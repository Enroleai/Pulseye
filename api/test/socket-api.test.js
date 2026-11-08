const assert = require('assert');
const { api, getTenantId } = require('../soket/soket');

const routes = api.stack
	.filter((layer) => layer.route)
	.map((layer) => ({
		path: layer.route.path,
		methods: Object.keys(layer.route.methods).sort(),
	}));

assert.deepStrictEqual(routes, [
	{ path: '/removelisteners', methods: ['post'] },
	{ path: '/violations', methods: ['post'] },
]);

assert.strictEqual(getTenantId({ _id: 'manager-1' }), 'manager-1');
assert.strictEqual(
	getTenantId({ _id: 'worker-1', masterID: 'manager-1' }),
	'manager-1'
);
assert.strictEqual(getTenantId(null), null);

console.log('Socket route registration and tenant resolution checks passed.');
