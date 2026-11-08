const socketio = require('socket.io');
const { Worker } = require('../models/worker');
const { Activity } = require('../models/activities');
const { violatedsites } = require('../models/violatedsites');
const { violationapps } = require('../models/violationapps');
const { uploadScreenshots } = require('../imageUpload/uploadToS3');
const moment = require('moment');
const express = require('express');

const router = express.Router();
let io;

Date.prototype.yyyymmdd = function () {
	const mm = this.getMonth() + 1;
	const dd = this.getDate();

	return [
		this.getFullYear(),
		'-',
		(mm > 9 ? '' : '0') + mm,
		'-',
		(dd > 9 ? '' : '0') + dd,
	].join('');
};

function getTenantId(user) {
	if (!user) return null;
	if (user.masterID) return String(user.masterID);
	if (user._id) return String(user._id);
	return null;
}

function getSocketServer(res) {
	if (!io) {
		res.status(503).send({ message: 'Real-time service is not ready.' });
		return null;
	}

	return io;
}

router.post('/removelisteners', (req, res) => {
	const tenantId = getTenantId(req.user);
	const socketServer = getSocketServer(res);
	if (!socketServer) return;
	if (!tenantId) return res.status(401).send({ message: 'Authentication is required.' });

	socketServer.to(tenantId).emit('removelisteners');
	res.send({ start: `${tenantId} users are active` });
});

router.post('/violations', async (req, res, next) => {
	try {
		if (!req.user || !req.user.isAdmin) {
			return res.status(403).send({ message: 'Manager access is required.' });
		}

		const tenantId = getTenantId(req.user);
		const socketServer = getSocketServer(res);
		if (!socketServer) return;
		if (!tenantId) return res.status(401).send({ message: 'Authentication is required.' });

		const worker = await Worker.findOne({
			name: req.body.name,
			masterID: tenantId,
		});
		if (!worker) {
			return res.status(404).send({ message: 'Worker not found in this organization.' });
		}

		const [violationWebData, violationAppData] = await Promise.all([
			violatedsites.find({
				masterID: tenantId,
				workerid: worker.employeeid,
				isActive: true,
			}),
			violationapps.find({
				masterID: tenantId,
				workerid: worker.employeeid,
				isActive: true,
			}),
		]);

		socketServer.to(tenantId).emit('violations', {
			data: [...violationWebData, ...violationAppData],
			employeeid: worker.employeeid,
		});
		res.send({ status: 'successfully sent to the agent' });
	} catch (error) {
		next(error);
	}
});

module.exports.listen = (server) => {
	io = socketio.listen(server);

	io.on('connection', (socket) => {
		socket.on('subscribe', () => {
			const { _id, isAdmin } = socket.decoded;
			const tenantId = getTenantId(socket.decoded);
			if (!tenantId) return socket.disconnect(true);

			socket.join(tenantId);
			socket.join(String(_id));

			if (!isAdmin) {
				Worker.updateOne(
					{ _id, masterID: tenantId },
					{ $set: { activeStatus: 'online', lastLoginDate: new Date() } },
					{ upsert: false }
				).catch((error) => console.error('Unable to update worker status:', error));
			}

			if (isAdmin) {
				socket.to(String(_id)).emit('startscreens');
			}
		});

		socket.on('activites', async (obj) => {
			try {
				const tenantId = getTenantId(socket.decoded);
				if (!tenantId || socket.decoded.isAdmin) return;

				const worker = await Worker.findOne({
					_id: socket.decoded._id,
					masterID: tenantId,
				});
				if (!worker) {
					return socket.emit('error', { message: 'Unauthorized worker.' });
				}

				const today = new Date(new Date().yyyymmdd()).getTime();
				const data = obj.body || {};
				const body = {
					name: data.name,
					app_name: data.app_name,
					system_name: data.system_name,
					system_id: data.system_id,
					ram_info: data.ram_info,
					isVaiolated: data.isVaiolated,
					workerid: worker.employeeid,
					entrydate: today,
					activitydate: moment().utc(),
					entrytime: Date.now(),
					duration: 0,
				};

				if (worker.activeStatus === 'offline') {
					await worker.updateOne({ $set: { activeStatus: 'online' } });
				}

				const lastActivity = await Activity.find({
					workerid: body.workerid,
					entrydate: body.entrydate,
				})
					.sort({ entrytime: -1 })
					.limit(1);
				if (lastActivity.length > 0) {
					await Activity.updateOne(
						{ _id: lastActivity[0]._id },
						{ $set: { duration: body.entrytime - lastActivity[0].entrytime } }
					);
				}

				await new Activity(body).save();
			} catch (error) {
				console.error('Unable to save activity:', error);
				socket.emit('error', { message: 'Unable to save activity.' });
			}
		});

		socket.on('sendd', (data) => {
			const { _id, name } = socket.decoded;
			const tenantId = getTenantId(socket.decoded);
			if (!tenantId) return;

			socket.to(tenantId).emit('image', {
				image: true,
				buffer: data.buf.toString('base64'),
				info: data.info,
				workerID: _id,
				name,
				system_name: data.system_name,
				time: moment().format('YYYY-MM-DD HH:mm:ss'),
			});
		});

		socket.on('screensharing', (stream) => {
			const tenantId = getTenantId(socket.decoded);
			if (tenantId) socket.to(tenantId).emit('screen', { stream });
		});

		socket.on('uploadImage', async (buf) => {
			try {
				const tenantId = getTenantId(socket.decoded);
				if (!tenantId || socket.decoded.isAdmin) return;
				await uploadScreenshots(buf, tenantId, socket.decoded._id);
			} catch (error) {
				console.error('Unable to upload screenshot:', error);
				socket.emit('error', { message: 'Unable to upload screenshot.' });
			}
		});

		socket.on('alert', (data) => {
			socket.broadcast.to(data.workerID).emit('message', { message: data.message });
		});

		socket.on('disconnect', async () => {
			try {
				if (!socket.decoded.masterID || socket.decoded.isAdmin) return;
				const tenantId = getTenantId(socket.decoded);
				if (!tenantId) return;
				await Worker.updateOne(
					{ _id: socket.decoded._id, masterID: tenantId },
					{ $set: { activeStatus: 'offline' } }
				);
			} catch (error) {
				console.error('Unable to update worker disconnect status:', error);
			}
		});
	});

	return io;
};

module.exports.api = router;
module.exports.getTenantId = getTenantId;
