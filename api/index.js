const config = require('config');
const Joi = require('joi');
const cors = require('cors');
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');

// Do not let model initialization create collections or indexes during a release
// health check (or ordinary production startup). Schema changes are operator-owned.
mongoose.set('autoIndex', false);
mongoose.set('autoCreate', false);

const workers = require('./routes/workers');
const manegers = require('./routes/manegers');
const dashboardApi = require('./routes/dashboard-api');
const categories = require('./routes/categories');
const login = require('./routes/login');
const auth = require('./middleware/auth');
const isManager = require('./middleware/isManager');
const isAuth = require('./middleware/isAuth');
const socket = require('./soket/soket');
const violationApi = require('./routes/violation-api');
const violationApis = require('./routes/violation-apis');

Joi.objectId = require('joi-objectid')(Joi);

function requiredConfig(key, environmentVariable) {
	const value = config.get(key);
	if (!value) {
		throw new Error(`${environmentVariable} is not defined.`);
	}

	return value;
}

function configuredOrigins() {
	return requiredConfig('corsOrigin', 'CORS_ORIGIN')
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);
}

function buildCorsOptions(origins) {
	return {
		origin(origin, callback) {
			if (!origin || origins.includes(origin)) {
				return callback(null, true);
			}

			return callback(new Error('Origin is not allowed by CORS.'));
		},
		exposedHeaders: ['x-auth-token'],
	};
}

function createApplication() {
	requiredConfig('jwtPrivateKey', 'JWT_PRIVATE_KEY');
	const mongoUri = requiredConfig('mongodbUri', 'MONGODB_URI');
	const corsOptions = buildCorsOptions(configuredOrigins());
	const canary = process.env.PULSEYE_CANARY === '1';
	const app = express();
	const server = require('http').Server(app);

	app.get('/health', (req, res) => {
		const readyState = mongoose.connection.readyState;
		res.set('Cache-Control', 'no-store');
		res.status(readyState === 1 ? 200 : 503).json({
			status: readyState === 1 ? 'ok' : 'unavailable',
			mongo: { readyState },
			canary,
		});
	});
	app.use('/health', (req, res) => res.status(404).json({ message: 'Not found.' }));

	if (canary) {
		// A candidate connects to real MongoDB, but has no writable application
		// routes, Socket.IO handlers, uploads, email delivery or seed operations.
		app.use((req, res) => res.status(503).json({ message: 'Canary serves health checks only.' }));
		server.on('upgrade', (req, connection) => connection.destroy());
	} else {
		const io = socket.listen(server);
		const { api } = socket;
		app.use(cors(corsOptions));
		app.use(express.json());
		io.use(isAuth);

		app.use('/api/workers', workers);
		app.use('/api/login', login);
		app.use('/api/categories', auth, isManager, categories);
		app.use('/api/manegers', auth, isManager, manegers);
		app.use('/api/users', auth, dashboardApi);
		app.use('/api/violation', auth, isManager, violationApi);
		app.use('/api/violations', auth, isManager, violationApis);
		app.use('/api/agent', auth, api);
		// Unknown API/socket requests must never receive the Angular index page.
		app.use(['/api', '/socket.io'], (req, res) => res.status(404).json({ message: 'Not found.' }));

		const frontend = path.resolve(__dirname, '../frontend');
		app.use(express.static(frontend, { index: 'index.html', dotfiles: 'deny' }));
		app.get('*', (req, res, next) => {
			// Missing assets remain 404; extension-free Angular routes get the SPA.
			if (path.extname(req.path) || !req.accepts('html')) return next();
			res.sendFile(path.join(frontend, 'index.html'), (error) => {
				if (error) next(error);
			});
		});
	}

	app.use((req, res) => res.status(404).json({ message: 'Not found.' }));
	app.use((error, req, res, next) => {
		if (res.headersSent) return next(error);
		if (error.status === 404) return res.status(404).json({ message: 'Not found.' });
		console.error('Unhandled request error:', error.message);
		return res.status(500).send({ message: 'An unexpected server error occurred.' });
	});

	return { app, server, mongoUri, canary };
}

async function startServer(application = createApplication()) {
	const port = Number(process.env.PORT || 3000);
	const host = process.env.HOST || '127.0.0.1';
	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error('PORT must be an integer from 1 to 65535.');
	}
	await mongoose.connect(application.mongoUri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		autoIndex: false,
		autoCreate: false,
		serverSelectionTimeoutMS: 10000,
	});

	await new Promise((resolve, reject) => {
		application.server.once('error', reject);
		application.server.listen(port, host, () => {
			application.server.removeListener('error', reject);
			console.log(`Listening on ${host}:${port}...`);
			resolve();
		});
	});
	return application;
}

if (require.main === module) {
	startServer().catch((error) => {
		console.error('Unable to start server:', error.message);
		process.exit(1);
	});
}

module.exports = { createApplication, startServer };
