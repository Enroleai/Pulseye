'use strict';
// Offline unit checks only. MongoDB is stubbed here, never in production or canary.
const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

process.env.JWT_PRIVATE_KEY = 'offline-native-startup-test-not-a-production-secret';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/offline_test';
process.env.CORS_ORIGIN = 'http://localhost';
const mongoose = require('mongoose');
const socket = require('../soket/soket');
const { createApplication, startServer } = require('../index');

function request(server, pathname, method = 'GET') {
	return new Promise((resolve, reject) => {
		const req = http.request({ host: '127.0.0.1', port: server.address().port, path: pathname, method }, (res) => {
			let body = '';
			res.setEncoding('utf8');
			res.on('data', (chunk) => { body += chunk; });
			res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
		});
		req.on('error', reject);
		req.end();
	});
}
function listen(server) {
	return new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
}
function close(server) {
	return new Promise((resolve) => server.close(resolve));
}

(async () => {
	const originalState = mongoose.connection.readyState;
	const originalConnect = mongoose.connect;
	const originalSocketListen = socket.listen;
	let candidate;
	let normal;
	const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'pulseye-native-test-'));
	try {
		assert.strictEqual(mongoose.get('autoIndex'), false);
		assert.strictEqual(mongoose.get('autoCreate'), false);
		process.env.PULSEYE_CANARY = '1';
		socket.listen = () => { throw new Error('Canary must not register writable socket handlers'); };
		candidate = createApplication();
		await listen(candidate.server);
		mongoose.connection.readyState = 0;
		let response = await request(candidate.server, '/health');
		assert.strictEqual(response.status, 503);
		assert.deepStrictEqual(JSON.parse(response.body), { status: 'unavailable', mongo: { readyState: 0 }, canary: true });
		mongoose.connection.readyState = 1;
		response = await request(candidate.server, '/health');
		assert.strictEqual(response.status, 200);
		assert.strictEqual(response.headers['cache-control'], 'no-store');
		assert.strictEqual(JSON.parse(response.body).mongo.readyState, 1);
		assert.strictEqual((await request(candidate.server, '/api/workers', 'POST')).status, 503);
		assert.strictEqual((await request(candidate.server, '/socket.io/?EIO=3&transport=polling')).status, 503);
		assert.strictEqual((await request(candidate.server, '/')).status, 503);
		await close(candidate.server);

		// Verify the same frontend mapping in an isolated release-shaped tree.
		const isolatedApi = path.join(temporary, 'api');
		const isolatedFrontend = path.join(temporary, 'frontend');
		fs.mkdirSync(isolatedApi);
		fs.mkdirSync(isolatedFrontend);
		fs.writeFileSync(path.join(isolatedFrontend, 'index.html'), '<!doctype html><title>offline-SPA-marker</title>');
		fs.writeFileSync(path.join(isolatedFrontend, 'main.js'), 'offline-asset-marker');
		const Module = require('module');
		const isolatedModule = new Module(path.join(isolatedApi, 'index.js'), module);
		isolatedModule.filename = path.join(isolatedApi, 'index.js');
		isolatedModule.paths = module.paths;
		isolatedModule.require = Module.createRequire(path.join(__dirname, '../index.js'));
		isolatedModule._compile(fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8'), isolatedModule.filename);
		process.env.PULSEYE_CANARY = '0';
		socket.listen = () => ({ use() {} });
		normal = isolatedModule.exports.createApplication();
		await listen(normal.server);
		assert.match((await request(normal.server, '/')).body, /offline-SPA-marker/);
		assert.match((await request(normal.server, '/dashboard/workers')).body, /offline-SPA-marker/);
		assert.match((await request(normal.server, '/main.js')).body, /offline-asset-marker/);
		for (const pathname of ['/api/missing', '/socket.io/missing', '/missing.js', '/health/missing']) {
			response = await request(normal.server, pathname);
			assert.strictEqual(response.status, 404, pathname);
			assert.doesNotMatch(response.body, /offline-SPA-marker/);
		}
		await close(normal.server);

		// Spy on the connect options and binding without making any real connection.
		let connectCalled = false;
		mongoose.connect = async (uri, options) => {
			assert.strictEqual(uri, process.env.MONGODB_URI);
			assert.strictEqual(options.autoIndex, false);
			assert.strictEqual(options.autoCreate, false);
			connectCalled = true;
		};
		process.env.PORT = '33001';
		delete process.env.HOST;
		const fakeServer = {
			once() {}, removeListener() {},
			listen(port, host, callback) {
				assert.strictEqual(connectCalled, true);
				assert.strictEqual(port, 33001);
				assert.strictEqual(host, '127.0.0.1');
				callback();
			},
		};
		await startServer({ server: fakeServer, mongoUri: process.env.MONGODB_URI });
		console.log('Offline native startup, readiness, canary isolation and frontend routing checks passed.');
	} finally {
		mongoose.connect = originalConnect;
		socket.listen = originalSocketListen;
		mongoose.connection.readyState = originalState;
		if (candidate && candidate.server.listening) await close(candidate.server);
		if (normal && normal.server.listening) await close(normal.server);
		fs.rmSync(temporary, { recursive: true, force: true });
	}
})().catch((error) => { console.error(error); process.exitCode = 1; });
