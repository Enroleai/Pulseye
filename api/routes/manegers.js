const bcrypt = require('bcrypt');
const Departements = require('../models/departements');
const Teams = require('../models/Team');
const { Manager } = require('../models/maneger');
const { Worker, validateWorker } = require('../models/worker');
const { managerlicenses } = require('../models/managerlicenses');
const { violatedsites } = require('../models/violatedsites');
const { violationapps } = require('../models/violationapps');
const { screeshotdetails } = require('../models/screeshotdetails');
const { Category } = require('../models/categories');
const express = require('express');
const email = require('../email/email');
var moment = require('moment');
const router = express.Router();
const {
	getScreenshots,
	getPresignedUrlS3,
} = require('../imageUpload/uploadToS3');
const departements = require('../models/departements');

////// All endpoints require manager role/////

async function addedViolation(masterID, employeeid) {
	const violationList = ['torrent', 'twitter', 'Whatsapp', 'facebook'];
	let body = [];
	for (const v of violationList) {
		body.push({
			violationsitename: v,
			masterID,
			dateadded: new Date(),
			workerid: employeeid,
			isActive: true,
		});
	}

	const violation = await violatedsites.insertMany(body, { ordered: false });
	await violationapps.insertMany(body, { ordered: false });
	return violation;
}
router.post('/createWorker', async (req, res) => {
	//create a worker.. the access has only manager
	try {
		const time = new Date();
		const { name } = req.body;
		const licenseKey = req.body.licenseKey;
		const email = req.body.email;
		const employeeid = `emp${Date.now()}`;
		const worker = new Worker({
			name,
			licenseKey,
			email,
			employeeid,
			masterID: req.user._id,
			activeStatus: 'offline',
			lastLoginDate: '',
			employeeoffboarddate: '',
			employeeonboarddate: time,
			isActive: true,
		});
		const salt = await bcrypt.genSalt(10);
		await worker.save();
		if (worker) {
			const body = {
				name,
				employeeid,
				activeStatus: true,
				employeeonboarddate: time,
			};
			managerlicenses
				.updateOne(
					{ licenseKey: req.body.licenseKey }, // Filter
					{ $set: body }, // Update
					{ upsert: true } // add document with req.body._id if not exists
				)
				.then(async (obj) => {
					// res.redirect('orders')
					await addedViolation(req.user._id, employeeid);
					res.status(200).send({ status: true });
				})
				.catch((err) => {
					console.log('Error: ' + err);
					res.status(400).send(err);
				});
		}
	} catch (err) {
		console.log(err);
		if (err) return res.status(400).send('missing required parameters');
	}
});
router.post('/buyLicenses', async (req, res) => {
	//create a worker.. the access has only manager
	try {
		let body = [];
		for (let i = 0; i < req.body.number; i++) {
			body.push({
				name: ``,
				masterID: req.user._id,
				licenseKey: `worker${Math.floor(Math.random() * 100000000000)}`,
				employeeid: ``,
				activeStatus: false,
				licensecreateddate: new Date(),
				employeeonboarddate: '',
			});
		}
		const response = await managerlicenses.insertMany(body);
		if (response) {
			res.status(200).send('Licenses created successfully!');
		}
	} catch (err) {
		console.log(err);
		if (err) return res.status(400).send('missing required parameters');
	}
});
router.post('/changeName', async (req, res) => {
	try {
		const { name, _id } = req.body;
		if (!name || !_id) {
			return res.status(400).send('name and worker ID are required');
		}
		const result = await Worker.updateOne(
			{ _id, masterID: req.user._id },
			{ $set: { name } }
		);
		if (!result.n) {
			return res.status(404).send('worker not found');
		}
		res.status(200).send('Worker`s name updated successfully');
	} catch (ex) {
		res.status(400).send('something went wrong');
	}
});

router.post('/toEmail', async (req, res) => {
	try {
		const { data } = req.body;
		await email(data);
		res.status(200).send('ok');
	} catch (ex) {
		res.status(400).send('could not send to email');
	}
});

router.get('/workTimes', async (req, res) => {
	try {
		const { day, _id } = req.query;
		const worker = await Worker.findOne({
			_id,
			masterID: req.user._id,
		}).select(`activites.${day}`);
		if (!worker) return res.status(404).send('worker not found');
		res.send((worker.activites && worker.activites[day]) || []);
	} catch (ex) {
		res.status(400).send('bad request');
	}
});

router.get('/workers', async (req, res) => {
	try {
		const workers = await Worker.find({
			masterID: req.user._id,
			isActive: true,
		}).sort({
			lastLoginDate: "desc"
		});
		res.status(200).send(workers);
	} catch (ex) {
		console.log(ex);
		res.status(400).send('something went wrong');
	}
});

/********17-11-2020 */
router.get('/getLicenses', async (req, res) => {
	try {
		const licenses = await managerlicenses.find({
			masterID: req.user._id,
			activeStatus: false,
		}).sort({
			licensecreateddate: "desc"
		});
		res.status(200).send(licenses);
	} catch (ex) {
		console.log(ex);
		res.status(400).send('something went wrong');
	}
});
/**/
router.post('/getScreenshots', async (req, res) => {
	try {
		const managerID = req.user._id;
		const { workerID, today } = req.body;
		if (!workerID) return res.status(400).send('worker ID is required');
		const worker = await Worker.findOne({ _id: workerID, masterID: managerID });
		if (!worker) return res.status(404).send('worker not found');
		const imagesUrlArr = await getScreenshots(
			managerID,
			worker._id,
			today
		);
		res.status(200).send(imagesUrlArr);
	} catch (ex) {
		res.status(400).send('bad request');
		console.log(ex);
	}
});
router.get('/getWorkerLatestScreenshots', async (req, res) => {
	try {
		const worker = await Worker.find({
			masterID: req.user._id,
			isActive: true,
		}).sort({
			lastLoginDate: "desc"
		});
		let response = [];
		for (let i = 0; i < worker.length; i++) {
			let imagesUrlArr = [];
			console.log('Worker id', worker[i]._id);
			var pipeline = [
				{
					$match: {
						masterID: req.user._id,
						employeeid: worker[i]._id.toString(),
					},
				},
				{
					$sort: {
						screenshotdate: -1.0,
					},
				},
				{
					$limit: 1.0,
				},
			];
			var cursor = await screeshotdetails.aggregate(pipeline);
			let latest = '';
			if (cursor.length > 0) {
				latest = await getPresignedUrlS3(cursor[0].screenshoturl);
			}
			// imagesUrlArr = await getScreenshots(req.user._id, worker[i]._id)
			response.push({ worker: worker[i], latest });
		}
		res.status(200).send(response);
	} catch (ex) {
		res.status(400).send('bad request');
		console.log(ex);
	}
});
router.get('/getWorkerScreenshotsByDate', async (req, res) => {
	try {
		const startDate = `${new Date(
			new Date(req.query.startDate).yyyymmdd()
		).getTime()}`;
		const endDate = `${new Date(
			new Date(req.query.endDate).yyyymmdd()
		).getTime()}`;
		console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', req.query.employeeid);
		const worker = await Worker.find({
			masterID: req.user._id,
			employeeid: req.query.employeeid,
			isActive: true,
		}).sort({
			lastLoginDate: "desc"
		});
		let response = [];
		let imagesUrlArr = [];
		var pipeline = [
			{
				$match: {
					$and: [
						{
							masterID: req.user._id,
						},
						{
							employeeid: worker[0]._id.toString(),
						},
						{
							entrydate: {
								$gte: startDate,
							},
						},
						{
							entrydate: {
								$lte: endDate,
							},
						},
					],
				},
			},
			{
				$sort: {
					screenshotdate: -1.0,
				},
			},
		];
		var cursor = await screeshotdetails.aggregate(pipeline);
		console.log(cursor);
		var screenShot = [];
		if (cursor.length > 0) {
			for (let c of cursor) {
				screenShot.push({
					url: await getPresignedUrlS3(c.screenshoturl),
					date: c.screenshotdate,
				});
			}
			imagesUrlArr.push({ screenShot });
		}
		// console.log(imagesUrlArr);
		response.push({ worker: worker, imagesUrlArr });
		res.status(200).send(response);
	} catch (ex) {
		res.status(400).send('bad request');
		console.log(ex);
	}
});
// departements and team routes

//departements
router.post('/createdepartement', async (req, res) => {
	const DEPT_NAME = req.body.name;
	const DEPT_DESC = req.body.deptdesc;
	const MANAGERS = req.body.managers;
	const response = await Departements.create({
		DEPT_NAME: DEPT_NAME,
		DEPT_DESC: DEPT_DESC,
		CREATE_DATE: Date.now(),
		LAST_UPDATE_DATE: Date.now(),
		IS_DEPT_ACTIVE: true,
		ORG_ID: Math.random(),
		MANAGERS: MANAGERS,
	});
	res.json(response);
});
router.get('/departements', async (req, res) => {
	const schema = [
		{
			$project: {
				MANAGERS: 1,
				DEPT_NAME: 1,
				DEPT_DESC: 1,
				IS_DEPT_ACTIVE: 1,
			},
		},
	];
	const response = await Departements.aggregate(schema);
	res.json(response);
});

router.post('/updatedepartement', async (req, res) => {
	const _id = req.body.id;
	const MANAGERS = req.body.managers;
	const DEPT_DESC = req.body.deptdesc;
	const DEPT_NAME = req.body.name;
	const IS_DEPT_ACTIVE = req.body.active;
	const LAST_UPDATE_DATE = Date.now();
	const response = await Departements.updateOne(
		{ _id: _id },
		{
			$set: {
				MANAGERS,
				DEPT_DESC,
				DEPT_NAME,
				IS_DEPT_ACTIVE,
				LAST_UPDATE_DATE,
			},
		}
	);
	res.json(response);
});
//get department names
router.get('/departementnames', async (req, res) => {
	const schema = [
		{
			$project: {
				DEPT_NAME: 1,
				_id: 0,
			},
		},
	];
	let departements = [];
	const response = await Departements.aggregate(schema);
	for (let departement of response) {
		let singledept = departement['DEPT_NAME'];
		departements.push(singledept);
	}
	res.json(departements);
});
//get manager names
router.get('/managernames', async (req, res) => {
	const schema = [
		{
			$project: {
				name: 1,
				_id: 0,
			},
		},
	];
	let managers = [];
	const response = await Manager.aggregate(schema);
	for (let manager of response) {
		let managerName = manager['name'];
		managers.push(managerName);
	}
	res.json(managers);
});
// teams
router.post('/createteam', async (req, res) => {
	const TEAM_NAME = req.body.name;
	const TEAM_DESC = req.body.teamdesc;
	const MANAGER = req.body.manager;
	const DEPT_ID = await Departements.findOne({ DEPT_NAME: req.body.deptname });
	const response = await Teams.create({
		TEAM_NAME: TEAM_NAME,
		TEAM_DESC: TEAM_DESC,
		MANAGER: MANAGER,
		CREATE_DATE: Date.now(),
		IS_TEAM_ACTIVE: true,
		LAST_UPDATE_DATE: Date.now(),
		DEPT_ID: DEPT_ID._id,
	});
	res.send(response);
});

router.get('/teams', async (req, res) => {
	const schema = [
		{
			$project: {
				MANAGER: 1,
				TEAM_NAME: 1,
				TEAM_DESC: 1,
				DEPT_ID: 1,
				IS_TEAM_ACTIVE: 1,
			},
		},
	];
	const response = await Teams.aggregate(schema);
	res.json(response);
});
router.post('/updateteam', async (req, res) => {
	const _id = req.body.id;
	const MANAGER = req.body.manager;
	const TEAM_DESC = req.body.teamdesc;
	const TEAM_NAME = req.body.name;
	const IS_TEAM_ACTIVE = req.body.active;
	const LAST_UPDATE_DATE = Date.now();
	const response = await Teams.updateOne(
		{
			_id: _id,
		},
		{
			$set: { MANAGER, IS_TEAM_ACTIVE, TEAM_DESC, TEAM_NAME, LAST_UPDATE_DATE },
		}
	);
	res.json(response);
});
module.exports = router;
