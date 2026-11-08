const { violatedsites } = require('../models/violatedsites');
const { violationapps } = require('../models/violationapps');
const { Worker } = require('../models/worker');
const express = require('express');
const websites = require('../models/websites');
const DesktopApps = require('../models/desktopapps');
const router = express.Router();

router.post('/createviolationweb', async (req, res) => {
	console.log(req.body);
	const selectedWorker = await Worker.findOne({ name: req.body.name }).sort({
		lastLoginDate: "desc"
	});
	const violationSites = [];
	if (!req.body.webname) {
		return res.json([]);
	}
	for (let website of req.body.webname) {
		if (website.tag) {
			const web = await violatedsites.findOne({
				violationsitename: website.name,
				workerid: selectedWorker.employeeid,
			});
			if (web) {
				return res.json({ status: 'website already exisits' });
			}
			const webSite = await websites.create({
				Name: website.name,
				CreatedDate: Date.now(),
			});
		}

		const name = website.tag ? website.name : website;
		const violationWebsite = await violatedsites.create({
			violationsitename: name,
			masterID: selectedWorker.masterID,
			dateadded: Date.now(),
			workerid: selectedWorker.employeeid,
			isActive: true,
		});
		violationSites.push(violationWebsite);
	}
	res.json(violationSites);
});

router.post('/createviolationapp', async (req, res) => {
	const selectedWorker = await Worker.findOne({ name: req.body.name }).sort({
		lastLoginDate: "desc"
	});
	const violationSites = [];
	if (req.body.appname.length === 0) {
		return res.json([]);
	}
	for (let app of req.body.appname) {
		if (app.tag) {
			const apps = await violationapps.findOne({
				violationsitename: app.name,
				workerid: selectedWorker.employeeid,
			});
			if (apps) {
				return res.json({ status: 'app already exisits' });
			}
			const desktopApp = await DesktopApps.create({
				Name: app.name,
				CreatedDate: Date.now(),
			});
			console.log(desktopApp);
		}

		const name = app.tag ? app.name : app;
		const violationApp = await violationapps.create({
			violationsitename: name,
			masterID: selectedWorker.masterID,
			dateadded: Date.now(),
			workerid: selectedWorker.employeeid,
			isActive: true,
		});
		violationSites.push(violationApp);
	}
	res.json(violationSites);
});

router.get('/getviolationwebsites/:name', async (req, res) => {
	console.log(req.params);
	const name = await Worker.findOne({ name: req.params.name });
	const violationWebsites = await violatedsites.find({
		workerid: name.employeeid,
	});
	res.json(violationWebsites);
});

router.get('/getviolationapps/:name', async (req, res) => {
	const name = await Worker.findOne({ name: req.params.name }).sort({
		lastLoginDate: "desc"
	});
	const violationApps = await violationapps.find({
		workerid: name.employeeid,
	});
	res.json(violationApps);
});

router.post('/createwebsite', async (req, res) => {
	const webSite = await websites.create({
		Name: req.body.name,
		CreatedDate: Date.now(),
	});
	res.json(webSite);
});

router.post('/createdesktopapp', async (req, res) => {
	const DesktopApp = await DesktopApps.create({
		Name: req.body.name,
		CreatedDate: Date.now(),
	});
	res.json(DesktopApp);
});

router.get('/websites', async (req, res) => {
	const website = await websites.find();
	const tranformedWebsites = website.map((res) => res['Name']);
	res.json(tranformedWebsites);
});

router.get('/desktopapps', async (req, res) => {
	const desktopApps = await DesktopApps.find();
	const tranformedDeskApp = desktopApps.map((res) => res['Name']);
	res.json(tranformedDeskApp);
});

router.get('/getwebsite/:name', async (req, res) => {
	// console.log(req.params.name);
	const selectedWorker = await Worker.findOne({ name: req.params.name }).sort({
		lastLoginDate: "desc"
	});
	const violationWebsites = await violatedsites
		.find({
			workerid: selectedWorker.employeeid,
		})
		.select({ violationsitename: 1, _id: 1, isActive: 1 });
	const websites = violationWebsites.map((res) => {
		const obj = {
			name: res['violationsitename'],
			status: res['isActive'],
			_id: res['_id'],
		};
		return obj;
	});
	res.json(websites);
});

router.get('/getdesktop/:name', async (req, res) => {
	// console.log(req.params.name);
	const selectedWorker = await Worker.findOne({ name: req.params.name }).sort({
		lastLoginDate: "desc"
	});
	const violationDesktopapps = await violationapps
		.find({
			workerid: selectedWorker.employeeid,
		})
		.select({ violationsitename: 1, _id: 1, isActive: 1 });
	const desktopApps = violationDesktopapps.map((res) => {
		const obj = {
			name: res['violationsitename'],
			status: res['isActive'],
			_id: res['_id'],
		};
		return obj;
	});

	res.json(desktopApps);
});

router.post('/updateviolationapp', async (req, res) => {
	const updated = await violationapps.updateOne(
		{ _id: req.body.id },
		{ isActive: req.body.active }
	);
	res.json(updated);
});

router.post('/updateviolationsite', async (req, res) => {
	const id = req.body.id;
	const updated = await violatedsites.updateOne(
		{ _id: id },
		{ isActive: req.body.active }
	);
	res.json(updated);
});

module.exports = router;
