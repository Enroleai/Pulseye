const { violatedsites } = require('../models/violatedsites');
const { violationapps } = require('../models/violationapps');
const { Worker } = require('../models/worker');
const express = require('express');
const exams = require('../models/exams');
const router = express.Router();

async function violationListData(masterID, employeeid) {
	if (employeeid !== '') {
		const data3 = await violatedsites.find({
			masterID,
			workerid: employeeid,
			isActive: true,
		});
		return data3;
	} else {
		const data3 = await violatedsites.find({ masterID, isActive: true });
		return data3;
	}
}
async function violationAppListData(masterID, employeeid) {
	if (employeeid !== '') {
		const data3 = await violationapps.find({
			masterID,
			workerid: employeeid,
			isActive: true,
		});
		return data3;
	} else {
		const data3 = await violationapps.find({ masterID, isActive: true });
		return data3;
	}
}
router.get('/getAllviolationsites', async (req, res) => {
	try {
		let response = [];
		let response1 = [];
		if (req.query.employeeid && req.query.employeeid !== '') {
			const worker = await Worker.findOne({
				employeeid: req.query.employeeid,
				masterID: req.user._id,
			});
			if (!worker) return res.status(404).send('worker not found');
			response = await violationListData(
				req.user._id,
				req.query.employeeid
			);
			response1 = await violationAppListData(
				req.user._id,
				req.query.employeeid
			);
		} else {
			response = await violationListData(req.user._id, '');
			response1 = await violationAppListData(req.user._id, '');
		}
		Array.prototype.push.apply(response, response1);
		res.status(200).send(response);
	} catch (error) {
		console.log(error);
		res.status(400).send('something went wrong');
	}
});
router.post('/createviolationsites', async (req, res) => {
	try {
		if (req.body.employeeid) {
			const worker = await Worker.findOne({
				employeeid: req.body.employeeid,
				masterID: req.user._id,
			});
			if (!worker) return res.status(404).send('worker not found');
			const body = {
				violationsitename: req.body.violationsitename,
				masterID: req.user._id,
				dateadded: new Date(),
				workerid: req.body.employeeid,
				isActive: true,
				};
				const violation = new violatedsites(body);
				await violation.save();
		} else {
			const worker = await Worker.find({ masterID: req.user._id });
			let body = [];
			for (const data of worker) {
				body.push({
					violationsitename: req.body.violationsitename,
					masterID: req.user._id,
					dateadded: new Date(),
					workerid: data.employeeid,
					isActive: true,
				});
			}
			const response = await violatedsites.insertMany(body, { ordered: false });
		}
		res.status(200).send('violation created successfully');
		} catch (error) {
			console.error(error);
			res.status(400).send('something went wrong');
	}
});

router.put('/updateviolationsites', async (req, res) => {
	try {
		const body = {
			violationsitename: req.body.violationsitename,
			isActive: req.body.isActive,
		};
		violatedsites
				.updateOne(
					{ _id: req.body._id, masterID: req.user._id }, // Filter
					{ $set: body } // Update
				)
				.then((obj) => {
					if (!obj.n) return res.status(404).send('violation not found');
					res.status(200).send('violation updated successfully');
				// res.redirect('orders')
			})
			.catch((err) => {
				console.log('Error: ' + err);
				res.status(400).send(err);
			});
	} catch (error) {
		console.log(error);
		res.status(400).send(error);
	}
});

// router.post('/exams', async (req, res) => {
// 	const exam = await exams.create({
// 		siteName: req.body.name,
// 		createdDate: Date.now(),
// 		activeStatus: true,
// 	});
// 	res.send(exam);
// });

// router.get('/exams', async (req, res) => {
// 	const exam = await exams.find({ activeStatus: true });
// 	res.send(exam);
// });

module.exports = router;
