const AWS = require('aws-sdk');
const config = require('config');
const { screeshotdetails } = require('../models/screeshotdetails');

function validateCredentialPair(accessKeyId, secretAccessKey, variablePrefix) {
	if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
		throw new Error(
			`Storage configuration is incomplete. Set both ${variablePrefix}_ACCESS_KEY_ID and ${variablePrefix}_SECRET_ACCESS_KEY, or leave both unset.`
		);
	}
}

function validateLegacyEndpoint(endpoint) {
	try {
		const url = new URL(endpoint.includes('://') ? endpoint : `https://${endpoint}`);
		if (
			!['http:', 'https:'].includes(url.protocol) ||
			!url.hostname ||
			url.username ||
			url.password ||
			(url.pathname && url.pathname !== '/') ||
			url.search ||
			url.hash
		) {
			throw new Error('Invalid endpoint');
		}
	} catch (_) {
		// Do not include endpoint values: a misconfigured URL could contain credentials.
		throw new Error('Storage configuration is invalid. SPACES_ENDPOINT must be an HTTP(S) endpoint hostname or URL without credentials, path, query, or fragment.');
	}
}

function getStorageConfig() {
	const legacyConfig = config.get('aws');
	validateCredentialPair(legacyConfig.accessKeyId, legacyConfig.secretAccessKey, 'SPACES');

	if (legacyConfig.endpoint || legacyConfig.accessKeyId || legacyConfig.secretAccessKey) {
		const requiredKeys = ['accessKeyId', 'secretAccessKey', 'endpoint', 'region', 'bucket'];
		const missingKeys = requiredKeys.filter((key) => !legacyConfig[key]);
		if (missingKeys.length > 0) {
			throw new Error(
				`Legacy Spaces storage configuration is incomplete. Set ${missingKeys.join(', ')} through the SPACES_* environment variables.`
			);
		}
		validateLegacyEndpoint(legacyConfig.endpoint);
		return { ...legacyConfig, legacy: true };
	}

	const nativeConfig = config.get('s3');
	if (nativeConfig.bucket && nativeConfig.awsBucket && nativeConfig.bucket !== nativeConfig.awsBucket) {
		throw new Error('Storage configuration is invalid. S3_BUCKET and AWS_BUCKET must match when both are set.');
	}
	const bucket = nativeConfig.bucket || nativeConfig.awsBucket;
	if (!bucket || !nativeConfig.region) {
		throw new Error('AWS S3 storage configuration is incomplete. Set S3_BUCKET (or AWS_BUCKET) and AWS_REGION.');
	}
	validateCredentialPair(process.env.AWS_ACCESS_KEY_ID, process.env.AWS_SECRET_ACCESS_KEY, 'AWS');
	return { bucket, region: nativeConfig.region, legacy: false };
}

function createS3Client() {
	const storageConfig = getStorageConfig();
	const options = {
		region: storageConfig.region,
		signatureVersion: 'v4',
	};
	if (storageConfig.legacy) {
		options.endpoint = storageConfig.endpoint;
		options.accessKeyId = storageConfig.accessKeyId;
		options.secretAccessKey = storageConfig.secretAccessKey;
	}
	// Native AWS mode deliberately omits endpoint and credentials. The SDK resolves
	// its standard credential chain, including an EC2 instance role through IMDSv2.
	return {
		bucket: storageConfig.bucket,
		legacy: storageConfig.legacy,
		client: new AWS.S3(options),
	};
}

function startOfLocalDay(date = new Date()) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

async function uploadScreenshots(buf, masterID, workerId) {
	const { bucket, client, legacy } = createS3Client();
	const today = startOfLocalDay();
	const now = Date.now();
	const key = `${masterID}/${workerId}/${today}/${now}.jpg`;

	const params = {
		Bucket: bucket,
		Key: key,
		Body: buf,
		ContentType: 'image/jpeg',
	};
	if (!legacy) params.ServerSideEncryption = 'AES256';
	// No ACL: compatible with private, BucketOwnerEnforced AWS buckets.
	const data = await client.putObject(params).promise();

	await new screeshotdetails({
		screenshoturl: key,
		screenshotdate: new Date(),
		masterID,
		employeeid: workerId,
		entrydate: today,
		entrytime: now,
	}).save();

	return data;
}

async function getScreenshots(managerId, workerID, today) {
	const prefix = today ? `${managerId}/${workerID}/${today}` : `${managerId}/${workerID}`;
	return getFilesAtPrefix(prefix);
}

async function getFilesAtPrefix(prefix) {
	const { bucket, client } = createS3Client();
	const data = await client.listObjectsV2({ Bucket: bucket, Prefix: prefix }).promise();

	return Promise.all((data.Contents || []).map((item) =>
		client.getSignedUrlPromise('getObject', {
			Bucket: bucket,
			Key: item.Key,
			Expires: 300,
		})
	));
}

function getAgentTool() {
	return getFilesAtPrefix('Download-Pulseye-Agent/Pulseye Agent Setup.zip');
}

function getAgentToolLinux() {
	return getFilesAtPrefix('Download-Pulseye-Agent/Pulseye Agent Setup_linux.zip');
}

async function getPresignedUrlS3(prefix) {
	const { bucket, client } = createS3Client();
	return client.getSignedUrlPromise('getObject', {
		Bucket: bucket,
		Key: prefix,
		Expires: 300,
	});
}

module.exports = {
	uploadScreenshots,
	getScreenshots,
	getAgentTool,
	getAgentToolLinux,
	getPresignedUrlS3,
};
