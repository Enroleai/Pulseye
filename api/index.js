const config = require('config');
const Joi = require('joi');
const cors = require('cors');
const mongoose = require('mongoose');
const express = require('express');

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

const app = express();
const server = require('http').Server(app);
const io = socket.listen(server);
const { api } = socket;

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

requiredConfig('jwtPrivateKey', 'JWT_PRIVATE_KEY');
const mongoUri = requiredConfig('mongodbUri', 'MONGODB_URI');
const corsOptions = buildCorsOptions(configuredOrigins());

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

app.use((error, req, res, next) => {
	if (res.headersSent) return next(error);
	console.error('Unhandled request error:', error);
	return res.status(500).send({ message: 'An unexpected server error occurred.' });
});

async function startServer() {
	await mongoose.connect(mongoUri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
	});

	const port = process.env.PORT || 3000;
	server.listen(port, () => console.log(`Listening on port ${port}...`));
}

startServer().catch((error) => {
	console.error('Unable to start server:', error.message);
	process.exit(1);
});
