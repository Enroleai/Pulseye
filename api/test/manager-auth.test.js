const assert = require('assert');
const fs = require('fs');
const path = require('path');
const isManager = require('../middleware/isManager');

function runMiddleware(user) {
	let statusCode;
	let responseBody;
	let nextCalled = false;

	isManager(
		{ user },
		{
			status(code) {
				statusCode = code;
				return this;
			},
			send(body) {
				responseBody = body;
			}
		},
		() => {
			nextCalled = true;
		}
	);

	return { statusCode, responseBody, nextCalled };
}

assert.deepStrictEqual(runMiddleware(undefined), {
	statusCode: 403,
	responseBody: { message: 'Manager access is required.' },
	nextCalled: false
});
assert.deepStrictEqual(runMiddleware({ isAdmin: false }), {
	statusCode: 403,
	responseBody: { message: 'Manager access is required.' },
	nextCalled: false
});
assert.deepStrictEqual(runMiddleware({ isAdmin: true }), {
	statusCode: undefined,
	responseBody: undefined,
	nextCalled: true
});

const serverSource = fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8');
assert.match(
	serverSource,
	/app\.use\('\/api\/violations', auth, isManager, violationApis\);/
);
assert.match(
	serverSource,
	/app\.use\('\/api\/manegers', auth, isManager, manegers\);/
);

console.log('Manager authorization checks passed.');
