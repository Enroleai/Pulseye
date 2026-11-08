const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const adapterPath = path.join(__dirname, '../imageUpload/uploadToS3.js');
const source = fs.readFileSync(adapterPath, 'utf8');
const defaults = require('../config/default.json');
const mappings = require('../config/custom-environment-variables.json');
const fixedNow = new Date('2026-01-15T10:30:00Z').getTime();
const today = new Date(new Date(fixedNow).getFullYear(), new Date(fixedNow).getMonth(), new Date(fixedNow).getDate()).getTime();
let checks = 0;

function createHarness({ aws = {}, s3 = {}, env = {}, contents = [], uploadError, signingError, saveError } = {}) {
	const calls = { constructors: [], puts: [], lists: [], signs: [], saves: [], resolvedSigns: 0 };
	const values = {
		aws: { ...defaults.aws, ...aws },
		s3: { ...defaults.s3, bucket: 'pulseyeprod', ...s3 },
	};
	class S3 {
		constructor(options) { calls.constructors.push(options); }
		putObject(params) {
			calls.puts.push(params);
			return { promise: async () => {
				if (uploadError) throw uploadError;
				return { ETag: 'mock-etag' };
			} };
		}
		listObjectsV2(params) {
			calls.lists.push(params);
			return { promise: async () => contents === null ? {} : { Contents: contents } };
		}
		getSignedUrl() { throw new Error('Synchronous signing must not be used for role credentials.'); }
		getSignedUrlPromise(operation, params) {
			calls.signs.push({ operation, params });
			// Resolve later, as instance-role credential lookup does. Array responses
			// must contain resolved strings, not Promise objects serialized as {}.
			return new Promise((resolve, reject) => setImmediate(() => {
				if (signingError) return reject(signingError);
				calls.resolvedSigns++;
				resolve(`https://private.example/${params.Key}?expires=${params.Expires}`);
			}));
		}
	}
	class Screenshot {
		constructor(record) { this.record = record; }
		async save() {
			if (saveError) throw saveError;
			calls.saves.push(this.record);
		}
	}
	class FixedDate extends Date {
		constructor(...args) { super(...(args.length ? args : [fixedNow])); }
		static now() { return fixedNow; }
	}
	const module = { exports: {} };
	vm.runInNewContext(source, {
		module,
		process: { env },
		Date: FixedDate,
		URL,
		require(name) {
			if (name === 'aws-sdk') return { S3 };
			if (name === 'config') return { get: (key) => values[key] };
			if (name === '../models/screeshotdetails') return { screeshotdetails: Screenshot };
			throw new Error(`Unexpected dependency: ${name}`);
		},
	}, { filename: adapterPath });
	return { adapter: module.exports, calls };
}

// Normalize VM-realm object prototypes before deep equality assertions.
function plain(value) { return JSON.parse(JSON.stringify(value)); }
async function check(name, run) {
	await run();
	checks++;
	console.log(`PASS ${name}`);
}

async function main() {
	await check('AWS mapping/default contract and explicit legacy endpoint', () => {
		assert.strictEqual(mappings.s3.region, 'AWS_REGION');
		assert.strictEqual(mappings.s3.bucket, 'S3_BUCKET');
		assert.strictEqual(mappings.s3.awsBucket, 'AWS_BUCKET');
		assert.strictEqual(defaults.s3.region, 'ap-south-1');
		assert.strictEqual(defaults.s3.bucket, '');
		assert.strictEqual(defaults.aws.endpoint, '');
		for (const [key, variable] of Object.entries({ accessKeyId: 'SPACES_ACCESS_KEY_ID', secretAccessKey: 'SPACES_SECRET_ACCESS_KEY', endpoint: 'SPACES_ENDPOINT', region: 'SPACES_REGION', bucket: 'SPACES_BUCKET' })) {
			assert.strictEqual(mappings.aws[key], variable);
		}
	});
	await check('AWS role uses no explicit credentials/endpoint and signs asynchronously for 300 seconds', async () => {
		const { adapter, calls } = createHarness();
		const result = adapter.getPresignedUrlS3('manager/worker/day/image.jpg');
		assert.strictEqual(typeof result.then, 'function');
		assert.strictEqual(calls.resolvedSigns, 0);
		assert.strictEqual(await result, 'https://private.example/manager/worker/day/image.jpg?expires=300');
		assert.deepStrictEqual(plain(calls.constructors), [{ region: 'ap-south-1', signatureVersion: 'v4' }]);
		assert.deepStrictEqual(plain(calls.signs), [{ operation: 'getObject', params: { Bucket: 'pulseyeprod', Key: 'manager/worker/day/image.jpg', Expires: 300 } }]);
	});
	await check('AWS JPEG upload is private, encrypted, and preserves screenshot key/schema', async () => {
		const { adapter, calls } = createHarness();
		const body = Buffer.from('mock-jpeg');
		assert.deepStrictEqual(plain(await adapter.uploadScreenshots(body, 'master-1', 'worker-2')), { ETag: 'mock-etag' });
		assert.strictEqual(calls.puts[0].Body, body);
		const { Body, ...params } = calls.puts[0];
		assert.deepStrictEqual(plain(params), { Bucket: 'pulseyeprod', Key: `master-1/worker-2/${today}/${fixedNow}.jpg`, ContentType: 'image/jpeg', ServerSideEncryption: 'AES256' });
		assert.ok(!('ACL' in params));
		assert.deepStrictEqual(plain(calls.saves), [{ screenshoturl: params.Key, screenshotdate: new Date(fixedNow).toISOString(), masterID: 'master-1', employeeid: 'worker-2', entrydate: today, entrytime: fixedNow }]);
	});
	await check('Screenshots await all signing promises and preserve tenant/day prefixes', async () => {
		const { adapter, calls } = createHarness({ contents: [{ Key: 'first.jpg' }, { Key: 'second.jpg' }] });
		const urls = await adapter.getScreenshots('master-1', 'worker-2', today);
		assert.deepStrictEqual(plain(urls), ['https://private.example/first.jpg?expires=300', 'https://private.example/second.jpg?expires=300']);
		assert.strictEqual(calls.resolvedSigns, 2);
		assert.deepStrictEqual(plain(calls.lists), [{ Bucket: 'pulseyeprod', Prefix: `master-1/worker-2/${today}` }]);
		await adapter.getScreenshots('master-1', 'worker-2');
		assert.strictEqual(calls.lists[1].Prefix, 'master-1/worker-2');
		assert.ok(calls.signs.every(({ params }) => params.Expires === 300));
	});
	await check('Empty object listing returns an empty array', async () => {
		for (const contents of [[], null]) {
			const { adapter, calls } = createHarness({ contents });
			assert.deepStrictEqual(plain(await adapter.getScreenshots('m', 'w')), []);
			assert.strictEqual(calls.signs.length, 0);
		}
	});
	await check('Windows/Linux installer prefixes remain unchanged and URLs resolve', async () => {
		const { adapter, calls } = createHarness({ contents: [{ Key: 'installer.zip' }] });
		for (const method of ['getAgentTool', 'getAgentToolLinux']) {
			assert.deepStrictEqual(plain(await adapter[method]()), ['https://private.example/installer.zip?expires=300']);
		}
		assert.deepStrictEqual(plain(calls.lists), [
			{ Bucket: 'pulseyeprod', Prefix: 'Download-Pulseye-Agent/Pulseye Agent Setup.zip' },
			{ Bucket: 'pulseyeprod', Prefix: 'Download-Pulseye-Agent/Pulseye Agent Setup_linux.zip' },
		]);
	});
	await check('AWS_BUCKET alias and matching aliases work', async () => {
		for (const s3 of [{ bucket: '', awsBucket: 'alias-bucket' }, { bucket: 'alias-bucket', awsBucket: 'alias-bucket' }]) {
			const { adapter, calls } = createHarness({ s3 });
			await adapter.getPresignedUrlS3('image.jpg');
			assert.strictEqual(calls.signs[0].params.Bucket, 'alias-bucket');
		}
	});
	await check('Conflicting bucket aliases are rejected before SDK construction', async () => {
		const { adapter, calls } = createHarness({ s3: { awsBucket: 'other-bucket' } });
		await assert.rejects(adapter.getPresignedUrlS3('image.jpg'), /S3_BUCKET and AWS_BUCKET must match/);
		assert.strictEqual(calls.constructors.length, 0);
	});
	await check('AWS bucket and region are required', async () => {
		for (const s3 of [{ bucket: '', awsBucket: '' }, { region: '' }]) {
			const { adapter, calls } = createHarness({ s3 });
			await assert.rejects(adapter.getPresignedUrlS3('image.jpg'), /S3_BUCKET.*AWS_REGION/);
			assert.strictEqual(calls.constructors.length, 0);
		}
	});
	await check('Partial explicit AWS key pairs fail without leaking values', async () => {
		for (const env of [{ AWS_ACCESS_KEY_ID: 'DO_NOT_LOG_KEY' }, { AWS_SECRET_ACCESS_KEY: 'DO_NOT_LOG_SECRET' }]) {
			const { adapter, calls } = createHarness({ env });
			await assert.rejects(adapter.getPresignedUrlS3('image.jpg'), (error) => /both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY/.test(error.message) && !/DO_NOT_LOG/.test(error.message));
			assert.strictEqual(calls.constructors.length, 0);
		}
	});
	await check('Complete AWS environment credentials still resolve through the SDK chain', async () => {
		const { adapter, calls } = createHarness({ env: { AWS_ACCESS_KEY_ID: 'mock-key', AWS_SECRET_ACCESS_KEY: 'mock-secret', AWS_SESSION_TOKEN: 'mock-session' } });
		await adapter.getPresignedUrlS3('image.jpg');
		assert.deepStrictEqual(plain(calls.constructors), [{ region: 'ap-south-1', signatureVersion: 'v4' }]);
	});
	const legacy = { accessKeyId: 'mock-spaces-key', secretAccessKey: 'mock-spaces-secret', endpoint: 'fra1.digitaloceanspaces.com', region: 'us-east-2', bucket: 'employee-screenshots' };
	await check('Explicit Spaces endpoint/key pair selects legacy mode and omits AWS-only SSE/ACL', async () => {
		const { adapter, calls } = createHarness({ aws: legacy });
		await adapter.uploadScreenshots(Buffer.from('mock-jpeg'), 'm', 'w');
		await adapter.getPresignedUrlS3('legacy.jpg');
		assert.deepStrictEqual(plain(calls.constructors[0]), { region: legacy.region, signatureVersion: 'v4', endpoint: legacy.endpoint, accessKeyId: legacy.accessKeyId, secretAccessKey: legacy.secretAccessKey });
		assert.strictEqual(calls.puts[0].Bucket, legacy.bucket);
		assert.strictEqual(calls.puts[0].ContentType, 'image/jpeg');
		assert.ok(!('ServerSideEncryption' in calls.puts[0]));
		assert.ok(!('ACL' in calls.puts[0]));
		assert.strictEqual(calls.signs[0].params.Expires, 300);
		assert.strictEqual(calls.signs[0].params.Bucket, legacy.bucket);
	});
	await check('Bare and HTTPS Spaces endpoint forms are accepted', async () => {
		for (const endpoint of ['fra1.digitaloceanspaces.com', 'https://fra1.digitaloceanspaces.com/']) {
			const { adapter } = createHarness({ aws: { ...legacy, endpoint } });
			assert.strictEqual(typeof await adapter.getPresignedUrlS3('image.jpg'), 'string');
		}
	});
	await check('Partial Spaces credentials and endpoint-only configs fail before SDK use', async () => {
		for (const aws of [{ accessKeyId: 'DO_NOT_LOG_KEY' }, { secretAccessKey: 'DO_NOT_LOG_SECRET' }, { endpoint: legacy.endpoint }, { ...legacy, endpoint: '' }, { ...legacy, bucket: '' }, { ...legacy, region: '' }]) {
			const { adapter, calls } = createHarness({ aws });
			await assert.rejects(adapter.getPresignedUrlS3('image.jpg'), (error) => /configuration is incomplete/.test(error.message) && !/DO_NOT_LOG/.test(error.message));
			assert.strictEqual(calls.constructors.length, 0);
		}
	});
	await check('Invalid legacy endpoint rejected without echoing endpoint secrets', async () => {
		for (const endpoint of ['ftp://fra1.digitaloceanspaces.com', 'https://DO_NOT_LOG:secret@fra1.digitaloceanspaces.com', 'https://fra1.digitaloceanspaces.com/private', 'https://fra1.digitaloceanspaces.com?secret=DO_NOT_LOG', 'https://']) {
			const { adapter, calls } = createHarness({ aws: { ...legacy, endpoint } });
			await assert.rejects(adapter.getPresignedUrlS3('image.jpg'), (error) => /SPACES_ENDPOINT must be/.test(error.message) && !/DO_NOT_LOG/.test(error.message));
			assert.strictEqual(calls.constructors.length, 0);
		}
	});
	await check('Storage upload failure does not save a screenshot record', async () => {
		const failure = new Error('mock upload failure');
		const { adapter, calls } = createHarness({ uploadError: failure });
		await assert.rejects(adapter.uploadScreenshots(Buffer.from('mock'), 'm', 'w'), (error) => error === failure);
		assert.strictEqual(calls.saves.length, 0);
	});
	await check('Model save and asynchronous signing failures propagate', async () => {
		const failure = new Error('mock failure');
		const { adapter } = createHarness({ saveError: failure });
		await assert.rejects(adapter.uploadScreenshots(Buffer.from('mock'), 'm', 'w'), (error) => error === failure);
		const signed = createHarness({ signingError: failure, contents: [{ Key: 'image.jpg' }] }).adapter;
		await assert.rejects(signed.getPresignedUrlS3('image.jpg'), (error) => error === failure);
		await assert.rejects(signed.getScreenshots('m', 'w'), (error) => error === failure);
	});
	await check('Existing manager/download call sites await asynchronous getters', () => {
		const managers = fs.readFileSync(path.join(__dirname, '../routes/manegers.js'), 'utf8');
		const dashboard = fs.readFileSync(path.join(__dirname, '../routes/dashboard-api.js'), 'utf8');
		assert.match(managers, /latest = await getPresignedUrlS3\(cursor\[0\]\.screenshoturl\)/);
		assert.match(managers, /url: await getPresignedUrlS3\(c\.screenshoturl\)/);
		assert.match(managers, /imagesUrlArr = await getScreenshots\(/);
		assert.match(dashboard, /response = await getAgentTool\(\)/);
		assert.match(dashboard, /responseLinux = await getAgentToolLinux\(\)/);
	});
	console.log(`Storage checks passed (${checks} groups; SDK/model mocks only, no network or database).`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
