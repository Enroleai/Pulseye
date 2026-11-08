const express = require('express');
const object = require('joi/lib/types/object');
var moment = require('moment');
const router = express.Router();
const { Worker, validateWorker } = require('../models/worker');
const { Activity } = require('../models/activities');
const { last } = require('lodash');
const { Category } = require('../models/categories');
const { violatedsites } = require('../models/violatedsites');
const { violationapps } = require('../models/violationapps');
const {
	getAgentTool,
	getAgentToolLinux,
} = require('../imageUpload/uploadToS3');
const { date } = require('joi');
const employeeHours = 28800; // 8 hours converted into seconds
const browsers = ['chrome', 'safari', 'Navigator', 'firefox', 'iexplore'];
let webSiteNames = [
	'facebook',
	'you tube',
	'instagram',
	'gmail',
	'yahoo',
	'rediffmail',
	'whatsapp',
];
const violatedAppsList = ['zoom', 'postman'];
const monthNames = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
];
function msToTime(s) {
	var ms = s % 1000;
	s = (s - ms) / 1000;
	var secs = s % 60;
	s = (s - secs) / 60;
	var mins = s % 60;
	var hrs = (s - mins) / 60;

	return hrs + ':' + mins + ':' + secs + '.' + ms;
}

function msToHours(s) {
	function pad(n, z) {
		z = z || 2;
		return ('00' + n).slice(-z);
	}
	var ms = s % 1000;
	s = (s - ms) / 1000;
	var secs = s % 60;
	s = (s - secs) / 60;
	var mins = s % 60;
	var hrs = (s - mins) / 60;

	return hrs;
}

function totalEffort(value, noOfEmp, days) {
	return parseFloat(
		((value / (noOfEmp * employeeHours * days)) * 100).toFixed(2)
	);
}

function totalEffortProduct(value, noOfEmp, days) {
	return (value / (noOfEmp * employeeHours * days)) * 100;
}

function totalWebEffort(duration, total) {
	return parseFloat(((duration / total) * 100).toFixed(2));
}

function getSum(items, prop) {
	return items.reduce(function (a, b) {
		return a + b[prop];
	}, 0);
}

function getConvertedMonth(date) {
	return `${monthNames[new Date(parseInt(date)).getMonth()]}-${new Date(
		parseInt(date)
	)
		.getFullYear()
		.toString()
		.slice(-2)}`;
}
async function violationListData(masterID, employeeid) {
	let data3 = [];
	if (employeeid !== '') {
		data3 = await violatedsites.find({
			masterID,
			workerid: employeeid,
			isActive: true,
		});
	} else {
		data3 = await violatedsites.find({
			masterID,
			isActive: true,
		});
	}
	return data3;
}
async function violationAppListData(masterID, employeeid) {
	let data3 = [];
	if (employeeid !== '') {
		data3 = await violationapps.find({
			masterID,
			workerid: employeeid,
			isActive: true,
		});
	} else {
		data3 = await violationapps.find({
			masterID,
			isActive: true,
		});
	}
	return data3;
}

function getRemanningDays() {
	var date = new Date(parseInt(date));
	var time = new Date(date.getTime());
	time.setMonth(date.getMonth() + 1);
	time.setDate(0);
	var days =
		time.getDate() > date.getDate() ? time.getDate() - date.getDate() : 0;
	return days;
}
async function getWorkingHours(masterID, employeeid, startDate, endDate) {
	let worker = [];
	if (masterID !== null && masterID !== '') {
		worker = await Worker.find({
			masterID,
			isActive: true,
		}).sort({
			lastLoginDate: "desc"
		});
	} else {
		worker = await Worker.find({
			employeeid,
			isActive: true,
		}).sort({
			lastLoginDate: "desc"
		});
	}
	let workingHours = 0;
	for (const w of worker) {
		let dateStart = '';
		let dateEnd = '';
		if (moment(w.employeeonboarddate).diff(moment(startDate)) <= 0) {
			dateStart = moment(startDate);
		} else {
			dateStart = moment(w.employeeonboarddate);
		}
		if (w.employeeoffboarddate !== '' && w.employeeoffboarddate !== null) {
			if (moment(w.employeeoffboarddate).diff(moment(endDate)) <= 0) {
				dateEnd = moment(w.employeeoffboarddate);
			} else {
				dateEnd = moment(endDate);
			}
		} else {
			dateEnd = moment(endDate);
		}
		workingHours =
			parseInt(moment(dateEnd).diff(moment(dateStart), 'days')) + 1;
	}

	return workingHours * 28800;
}
async function getWorkingHoursForApp(w, startDate, endDate) {
	let workingHours = 0;
	let dateStart = '';
	let dateEnd = '';
	if (moment(w.employeeonboarddate).diff(moment(startDate)) <= 0) {
		dateStart = moment(startDate);
	} else {
		dateStart = moment(w.employeeonboarddate);
	}
	if (w.employeeoffboarddate !== '' && w.employeeoffboarddate !== null) {
		if (moment(w.employeeoffboarddate).diff(moment(endDate)) <= 0) {
			dateEnd = moment(w.employeeoffboarddate);
		} else {
			dateEnd = moment(endDate);
		}
	} else {
		dateEnd = moment(endDate);
	}
	workingHours = parseInt(moment(dateEnd).diff(moment(dateStart), 'days')) + 1;

	return workingHours * 28800000;
}
router.get('/getOnlineUserInfo', async (req, res) => {
	try {
		const startDate = `${new Date(
			new Date(req.query.startDate).yyyymmdd()
		).getTime()}`;
		const response = await Worker.aggregate([
			{
				$lookup: {
					from: 'activities',
					localField: 'employeeid',
					foreignField: 'workerid',
					as: 'activitiesDetails',
				},
			},
			{
				$match: {
					$and: [
						{
							masterID: req.user._id,
						},
						{
							activeStatus: 'online',
						},
					],
				},
			},
		]);

		const response1 = response.map((a, index) => {
			delete a.activites;
			a.activitiesDetails = a.activitiesDetails[a.activitiesDetails.length - 1];
			return a;
		});
		console.log(response1);
		res.status(200).send(response1);
	} catch (ex) {
		console.log(ex);
		res.status(400).send('something went wrong');
	}
});

router.get('/getDashboardInfo', async (req, res) => {
	try {
		const startDate = `${new Date(
			new Date(req.query.startDate).yyyymmdd()
		).getTime()}`;
		const endDate = `${new Date(
			new Date(req.query.endDate).yyyymmdd()
		).getTime()}`;
		// const diffDays =
		// 	Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
		let response1 = [];

		if (true) {
			const response = await Activity.aggregate([
				{
					$lookup: {
						from: 'workers',
						localField: 'workerid',
						foreignField: 'employeeid',
						as: 'docs',
					},
				},
				{
					$match: {
						$and: [
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
					$match: {
						'docs.masterID': req.user._id,
					},
				},
				{
					$project: {
						name: 1,
						app_name: 1,
						duration: 1,
					},
				},
			]);
			const data3 = await violationListData(req.user._id, '');
			webSiteNames = data3.map((w) => {
				return w.violationsitename;
			});

			const data = response.map((a) => {
				delete a.employeeDetails;
				if (
					browsers.some((v) =>
						a.app_name.toLowerCase().includes(v.toLowerCase())
					)
				) {
					if (
						webSiteNames.find((v) =>
							a.name.toLowerCase().includes(v.toLowerCase())
						)
					) {
						a.url = `www.${webSiteNames.find((v) =>
							a.name.toLowerCase().includes(v.toLowerCase())
						)}.com`;
					} else {
						a.url = 'others';
					}
				} else {
					a.url = '';
				}
				return a;
			});
			var result = [];
			var resultWeb = [];
			data.reduce((res, value) => {
				if (!res[value.app_name]) {
					res[value.app_name] = {
						app_name: value.app_name,
						duration: 0,
						nooftimes: 0,
						usagepercent: 0,
						durationInSec: '',
					};
					result.push(res[value.app_name]);
					// result.push(res[value.app_name])
				}
				res[value.app_name].nooftimes += 1;
				res[value.app_name].duration += value.duration;
				res[value.app_name].durationInSec = msToTime(
					res[value.app_name].duration
				);
				res[value.app_name].usagepercent = 0;
				return res;
			}, {});

			data.reduce((res, value) => {
				if (!res[value.url]) {
					res[value.url] = {
						url: value.url,
						duration: 0,
						nooftimes: 0,
						usagepercent: 0,
						durationInSec: '',
					};
					if (value.url !== '') {
						resultWeb.push(res[value.url]);
					}
				}
				res[value.url].nooftimes += 1;
				res[value.url].duration += value.duration;
				res[value.url].durationInSec = msToTime(res[value.url].duration);
				res[value.url].usagepercent = 0;
				return res;
			}, {});
			if (resultWeb.length > 0) {
				resultWeb.map((c) => {
					c.usagepercent = totalWebEffort(
						c.duration,
						getSum(resultWeb, 'duration')
					);
				});
			}
			if (result.length > 0) {
				result.map((c) => {
					c.usagepercent = totalWebEffort(
						c.duration,
						getSum(result, 'duration')
					);
				});
			}
			const responseBody = {
				appUses: result,
				webUses: resultWeb,
				totalHoursApp: msToHours(getSum(result, 'duration')),
				totalHoursWeb: msToHours(getSum(resultWeb, 'duration')),
			};
			response1 = responseBody;
		}
		res.status(200).send(response1);
	} catch (ex) {
		console.log(ex);
		res.status(400).send('something went wrong');
	}
});

router.get('/getProductivityInfo', async (req, res) => {
	try {
		const startDate = `${new Date(
			new Date(req.query.startDate).yyyymmdd()
		).getTime()}`;
		const endDate = `${new Date(
			new Date(req.query.endDate).yyyymmdd()
		).getTime()}`;
		const diffDays =
			Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
		let response1 = [];
		// console.log(startDate);
		// console.log(endDate);
		// When user send employee id to get one wmployee detail
		const response = await Worker.aggregate([
			{
				$lookup: {
					from: 'activities',
					localField: 'employeeid',
					foreignField: 'workerid',
					as: 'activitiesDetails',
				},
			},
			{
				$match: {
					$and: [
						{
							'activitiesDetails.entrydate': {
								$gte: startDate,
							},
						},
						{
							'activitiesDetails.entrydate': {
								$lte: endDate,
							},
						},
						{
							masterID: req.user._id,
						},
					],
				},
			},
			{
				$project: {
					name: 1,
				},
			},
		]);

		const data3 = await violationListData(req.user._id, '');
		webSiteNames = data3.map((w) => {
			return w.violationsitename;
		});
		response1 = response.map((a, index) => {
			delete a.activites;
			var result = [];
			a.activitiesDetails.map((b) => {
				if (
					browsers.some((v) =>
						b.app_name.toLowerCase().includes(v.toLowerCase())
					)
				) {
					if (
						webSiteNames.find((v) =>
							b.name.toLowerCase().includes(v.toLowerCase())
						)
					) {
						b.url = `www.${webSiteNames.find((v) =>
							b.name.toLowerCase().includes(v.toLowerCase())
						)}.com`;
					} else {
						b.url = 'others';
					}
				} else {
					b.url = '';
				}
			});
			var violation = [];
			a.activitiesDetails.reduce((res, value) => {
				if (!res[value.app_name]) {
					res[value.app_name] = {
						app_name: value.app_name,
						duration: 0,
						nooftimes: 0,
						usagepercent: 0,
						durationInSec: '',
					};
					if (
						violatedAppsList.some((v) =>
							value.app_name.toLowerCase().includes(v.toLowerCase())
						)
					) {
						violation.push(res[value.app_name]);
					}
					result.push(res[value.app_name]);
				}
				res[value.app_name].nooftimes += 1;
				res[value.app_name].duration += value.duration;
				res[value.app_name].durationInSec = msToTime(
					res[value.app_name].duration
				);
				res[value.app_name].usagepercent = totalEffort(
					res[value.app_name].duration,
					1,
					diffDays
				);
				return res;
			}, {});
			var idleDuration = employeeHours * diffDays - getSum(result, 'duration');
			a.productivity = msToTime(getSum(result, 'duration'));
			a.productivityPercent = totalEffort(
				getSum(result, 'duration'),
				1,
				diffDays
			);
			a.idealTime = msToTime(idleDuration);
			a.idealTimePercent = totalEffort(idleDuration, 1, diffDays);
			a.totalTime = msToTime(employeeHours * diffDays);
			a.violation = violation;
			delete a.activitiesDetails;
			return a;
		});
		res.status(200).send(response1);
	} catch (ex) {
		console.log(ex);
		res.status(400).send('something went wrong');
	}
});

function daysDiff(d1, d2) {}
router.get('/getProductivityGraphOld', async (req, res) => {
	try {
		const startDate = `${new Date(
			new Date(req.query.startDate).yyyymmdd()
		).getTime()}`;
		const endDate = `${new Date(
			new Date(req.query.endDate).yyyymmdd()
		).getTime()}`;
		const diffDays =
			Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
		let noOfEmployee = await Worker.find({
			masterID: req.user._id,
		}).sort({
			lastLoginDate: "desc"
		});
		let howmanymonth = [];
		let response1 = [];
		var date = new Date(req.query.startDate);
		let dateStart = moment(req.query.startDate);
		let dateEnd = moment(req.query.startDate).endOf('month');
		howmanymonth.push({
			dateStart: moment(dateStart).format('YYYY-MM-DD'),
			dateEnd: moment(dateEnd).format('YYYY-MM-DD'),
			daysdiff: dateEnd.diff(dateStart, 'days'),
			monthName: dateStart.format('MMM-YY'),
			monthIndex: 1 + moment(req.query.startDate).month(),
		});
		let i = 1 + moment(req.query.startDate).month();
		do {
			i++;
			dateStart = moment(dateStart).add(1, 'M').startOf('month');
			dateEnd = moment(dateStart).endOf('month');
			if (`${new Date(new Date(dateEnd).yyyymmdd()).getTime()}` > endDate) {
				dateEnd = moment(req.query.endDate);
			}
			howmanymonth.push({
				dateStart: moment(dateStart).format('YYYY-MM-DD'),
				dateEnd: moment(dateEnd).format('YYYY-MM-DD'),
				daysdiff: dateEnd.diff(dateStart, 'days') + 1,
				monthName: dateStart.format('MMM-YY'),
				monthIndex: moment(dateStart).month() + 1,
			});
		} while (`${new Date(new Date(dateEnd).yyyymmdd()).getTime()}` < endDate);
		if (req.query.employeeid && req.query.employeeid !== '') {
			let response1 = [];
			for (const dates of howmanymonth) {
				const response = await Activity.aggregate([
					{
						$lookup: {
							from: 'workers',
							localField: 'workerid',
							foreignField: 'employeeid',
							as: 'employeeDetails',
						},
					},
					{
						$match: {
							$and: [
								{
									entrydate: {
										$gte: `${new Date(
											new Date(dates.dateStart).yyyymmdd()
										).getTime()}`,
									},
								},
								{
									entrydate: {
										$lte: `${new Date(
											new Date(dates.dateEnd).yyyymmdd()
										).getTime()}`,
									},
								},
								{
									'employeeDetails.masterID': req.user._id,
								},
								{
									workerid: req.query.employeeid,
								},
							],
						},
					},
				]);

				response.map((a) => {
					response1.push(response);
				});
			}

			res.status(200).send(response1);
		} else {
			// When user not send employee id to get all wmployee detail
			let response1 = [];
			for (const dates of howmanymonth) {
				const response = await Activity.aggregate([
					{
						$lookup: {
							from: 'workers',
							localField: 'workerid',
							foreignField: 'employeeid',
							as: 'employeeDetails',
						},
					},
					{
						$match: {
							$and: [
								{
									entrydate: {
										$gte: `${new Date(
											new Date(dates.dateStart).yyyymmdd()
										).getTime()}`,
									},
								},
								{
									entrydate: {
										$lte: `${new Date(
											new Date(dates.dateEnd).yyyymmdd()
										).getTime()}`,
									},
								},
								{
									'employeeDetails.masterID': req.user._id,
								},
							],
						},
					},
				]);
				response.map((a) => {
					delete a.employeeDetails;
				});
				var result = [];
				var violation = [];
				response.reduce((res, value) => {
					if (!res[value.app_name]) {
						res[value.app_name] = {
							app_name: value.app_name,
							duration: 0,
							nooftimes: 0,
							usagepercent: 0,
							durationInSec: '',
						};
						if (
							violatedAppsList.some((v) =>
								value.app_name.toLowerCase().includes(v.toLowerCase())
							)
						) {
							violation.push(res[value.app_name]);
						}
						result.push(res[value.app_name]);
					}
					res[value.app_name].nooftimes += 1;
					res[value.app_name].duration += value.duration;
					res[value.app_name].durationInSec = msToTime(
						res[value.app_name].duration
					);
					res[value.app_name].usagepercent = totalEffort(
						res[value.app_name].duration,
						noOfEmployee,
						dates.daysdiff
					);
					return res;
				}, {});
				var idleDuration =
					employeeHours * dates.daysdiff - getSum(result, 'duration');
				var totalProductivity =
					employeeHours * dates.daysdiff * noOfEmployee.length;
				var productivity =
					(getSum(result, 'duration') * 100) / totalProductivity;
				violation.map((c) => {
					c.percent = (c.duration * 100) / getSum(violation, 'duration');
				});
				var productivityData = {
					productivity: productivity,
					violationList: violation,
					violation: (getSum(violation, 'duration') * 100) / totalProductivity,
					idletime:
						100 -
						productivity -
						(getSum(violation, 'duration') * 100) / totalProductivity,
				};
				var body = {
					month: dates.monthName,
					data: productivityData,
				};

				response1.push(body);
			}
			res.status(200).send(response1);
		}
	} catch (ex) {
		console.log(ex);
		res.status(400).send('something went wrong');
	}
});
router.get('/getProductivityGraph', async (req, res) => {
	try {
		const startDate = `${new Date(
			new Date(req.query.startDate).yyyymmdd()
		).getTime()}`;
		const endDate = `${new Date(
			new Date(req.query.endDate).yyyymmdd()
		).getTime()}`;
		const diffDays =
			Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
		var options = {
			allowDiskUse: false,
		};
		var employeeid = {};
		if (req.query.employeeid) {
			employeeid = {
				workerid: req.query.employeeid,
			};
		}
		var pipeline = [
			{
				$match: {
					$and: [
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
						employeeid,
					],
				},
			},
			{
				$lookup: {
					from: 'workers',
					localField: 'workerid',
					foreignField: 'employeeid',
					as: 'workerresult',
				},
			},
			{
				$match: {
					'workerresult.masterID': req.user._id,
				},
			},
			{
				$addFields: {
					NumberDuration: {
						$toInt: '$duration',
					},
					MonthYear: {
						$concat: [
							{
								$let: {
									vars: {
										monthsInString: [
											'',
											'Jan',
											'Feb',
											'Mar',
											'Apr',
											'May',
											'Jun',
											'Jul',
											'Aug',
											'Sep',
											'Oct',
											'Nov',
											'Dec',
										],
									},
									in: {
										$arrayElemAt: [
											'$$monthsInString',
											{
												$toInt: {
													$month: '$activitydate',
												},
											},
										],
									},
								},
							},
							{
								$toString: {
									$year: '$activitydate',
								},
							},
						],
					},
				},
			},
			{
				$project: {
					app_name: 1.0,
					entrydate: {
						$dateFromString: {
							dateString: '$entrydate',
							onError: '$entrydate',
						},
					},
					workerid: 1.0,
					NumberDurationSec: {
						$divide: [
							{
								$toInt: '$duration',
							},
							1000.0,
						],
					},
					duration: 1.0,
					MonthYear: 1.0,
					isVaiolated: 1.0,
				},
			},
			{
				$group: {
					_id: {
						MonthYear: '$MonthYear',
						isVaiolated: '$isVaiolated',
					},
					SumDuration: {
						$sum: '$NumberDurationSec',
					},
				},
			},
		];

		let howmanymonth = [];
		let dateStart = moment(req.query.startDate);
		let dateEnd = moment(req.query.startDate).endOf('month');
		howmanymonth.push({
			dateStart: moment(dateStart).format('YYYY-MM-DD'),
			dateEnd: moment(dateEnd).format('YYYY-MM-DD'),
			daysdiff: dateEnd.diff(dateStart, 'days'),
			monthName: dateStart.format('MMMYYYY'),
			monthIndex: 1 + moment(req.query.startDate).month(),
		});
		let i = 1 + moment(req.query.startDate).month();
		do {
			i++;
			dateStart = moment(dateStart).add(1, 'M').startOf('month');
			dateEnd = moment(dateStart).endOf('month');
			if (`${new Date(new Date(dateEnd).yyyymmdd()).getTime()}` >= endDate) {
				dateEnd = moment(req.query.endDate);
			}
			howmanymonth.push({
				dateStart: moment(dateStart).format('YYYY-MM-DD'),
				dateEnd: moment(dateEnd).format('YYYY-MM-DD'),
				daysdiff: dateEnd.diff(dateStart, 'days') + 1,
				monthName: dateStart.format('MMMYYYY'),
				monthIndex: moment(dateStart).month() + 1,
			});
		} while (`${new Date(new Date(dateEnd).yyyymmdd()).getTime()}` < endDate);
		var cursor = await Activity.aggregate(pipeline);

		var result = [];
		var totalProductivity =
			(await getWorkingHours(
				req.user._id,
				'',
				req.query.startDate,
				req.query.endDate
			)) * 1000;
		var response = cursor.reduce((res, value) => {
			if (!res[value._id.MonthYear]) {
				res[value._id.MonthYear] = {
					month: value._id.MonthYear,
					monthIndex: 0,
					data: {
						productivity: 0,
						idletime: 0,
						violationList: [],
						violation: 0,
					},
				};
				result.push(res[value._id.MonthYear]);
			}
			res[value._id.MonthYear].monthIndex = howmanymonth.filter(
				(b) => b.monthName === value._id.MonthYear
			)[0].monthIndex;
			if (!value._id.isVaiolated) {
				// console.log(totalProductivity);
				res[value._id.MonthYear].data.productivity =
					(value.SumDuration * 100) / totalProductivity;
			}
			if (value._id.isVaiolated) {
				res[value._id.MonthYear].data.violation =
					(value.SumDuration * 100) / totalProductivity;
			}
			res[value._id.MonthYear].data.idletime =
				100 -
				(res[value._id.MonthYear].data.productivity +
					res[value._id.MonthYear].data.violation);
			console.log(res[value._id.MonthYear].data.idletime);
			return res;
		}, {});
		result.sort(function (a, b) {
			return a.monthIndex - b.monthIndex;
		});
		res.status(200).send(result);
	} catch (ex) {
		console.log(ex);
		res.status(400).send('something went wrong');
	}
});
router.get('/getViolationGraph', async (req, res) => {
	// console.log(req.user._id);
	try {
		const startDate = `${new Date(
			new Date(req.query.startDate).yyyymmdd()
		).getTime()}`;
		const endDate = `${new Date(
			new Date(req.query.endDate).yyyymmdd()
		).getTime()}`;
		const diffDays =
			Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
		var options = {
			allowDiskUse: false,
		};
		var value = employeeHours * diffDays * 3;
		var employeeid = {};
		if (req.query.employeeid) {
			employeeid = {
				workerid: req.query.employeeid,
			};
		}

		let howmanymonth = [];
		let dateStart = moment(req.query.startDate);
		let dateEnd = moment(req.query.startDate).endOf('month');
		howmanymonth.push({
			dateStart: moment(dateStart).format('YYYY-MM-DD'),
			dateEnd: moment(dateEnd).format('YYYY-MM-DD'),
			daysdiff: dateEnd.diff(dateStart, 'days'),
			monthName: dateStart.format('MMMYYYY'),
			monthIndex: 1 + moment(req.query.startDate).month(),
		});
		let i = 1 + moment(req.query.startDate).month();
		do {
			i++;
			dateStart = moment(dateStart).add(1, 'M').startOf('month');
			dateEnd = moment(dateStart).endOf('month');
			if (`${new Date(new Date(dateEnd).yyyymmdd()).getTime()}` >= endDate) {
				dateEnd = moment(req.query.endDate);
			}
			howmanymonth.push({
				dateStart: moment(dateStart).format('YYYY-MM-DD'),
				dateEnd: moment(dateEnd).format('YYYY-MM-DD'),
				daysdiff: dateEnd.diff(dateStart, 'days') + 1,
				monthName: dateStart.format('MMMYYYY'),
				monthIndex: moment(dateStart).month() + 1,
			});
		} while (`${new Date(new Date(dateEnd).yyyymmdd()).getTime()}` < endDate);
		var pipeline = [
			{
				$match: {
					$and: [
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
						{
							isVaiolated: true,
						},
						employeeid,
					],
				},
			},
			{
				$lookup: {
					from: 'workers',
					localField: 'workerid',
					foreignField: 'employeeid',
					as: 'workerresult',
				},
			},
			{
				$match: {
					'workerresult.masterID': req.user._id,
				},
			},
			{
				$addFields: {
					NumberDuration: {
						$toInt: '$duration',
					},
					MonthYear: {
						$concat: [
							{
								$let: {
									vars: {
										monthsInString: [
											'',
											'Jan',
											'Feb',
											'Mar',
											'Apr',
											'May',
											'Jun',
											'Jul',
											'Aug',
											'Sep',
											'Oct',
											'Nov',
											'Dec',
										],
									},
									in: {
										$arrayElemAt: [
											'$$monthsInString',
											{
												$toInt: {
													$month: '$activitydate',
												},
											},
										],
									},
								},
							},
							{
								$toString: {
									$year: '$activitydate',
								},
							},
						],
					},
				},
			},
			{
				$group: {
					_id: '$app_name',
					SumDuration: {
						$sum: '$duration',
					},
				},
			},
		];
		var cursor = await Activity.aggregate(pipeline);
		console.log(cursor);
		var response = cursor.map((a) => {
			a.app_name = a._id;
			a.usagepercent = (a.SumDuration * 100) / getSum(cursor, 'SumDuration');
		});
		var options = {
			allowDiskUse: false,
		};
		cursor.sort((a, b) => {
			return b.usagepercent - a.usagepercent;
		});
		res.status(200).send(cursor);
	} catch (ex) {
		console.log(ex);
		res.status(400).send('something went wrong');
	}
});
router.get('/getWebAppUses', async (req, res) => {
	try {
		const startDate = `${new Date(
			new Date(req.query.startDate).yyyymmdd()
		).getTime()}`;
		const endDate = `${new Date(
			new Date(req.query.endDate).yyyymmdd()
		).getTime()}`;

		let webUses = [];
		let appUses = [];
		let response1 = [];

		if (req.query.employeeid) {
			const response = await Activity.find({
				workerid: req.query.employeeid,
				activitydate: {
					$gte: moment(req.query.startDate),
					$lte: moment(req.query.endDate),
				},
			}).sort({
				activitydate: "desc"
			});
			const data3 = await violationListData(req.user._id, req.query.employeeid);
			webSiteNames = data3.map((w) => {
				return w.violationsitename;
			});
			const data = response.map((a) => {
				a = {
					isVaiolated: a.isVaiolated,
					_id: a._id,
					name: a.name,
					app_name: a.app_name,
					system_name: a.system_name,
					system_id: a.system_id,
					ram_info: a.ram_info,
					workerid: a.workerid,
					entrydate: a.entrydate,
					activitydate: a.activitydate,
					entrytime: a.entrydate,
					duration: a.duration,
					url: '',
				};
				if (
					browsers.some((v) =>
						a.app_name.toLowerCase().includes(v.toLowerCase())
					)
				) {
					if (
						webSiteNames.find((v) =>
							a.name.toLowerCase().includes(v.toLowerCase())
						)
					) {
						a.url = `www.${webSiteNames.find((v) =>
							a.name.toLowerCase().includes(v.toLowerCase())
						)}.com`;
					} else {
						a.url = 'others';
					}
				} else {
					a.url = '';
				}
				return a;
			});
			data.reduce((res, value) => {
				if (!res[value.url]) {
					res[value.url] = {
						url: value.url,
						duration: 0,
						nooftimes: 0,
						usagepercent: 0,
						durationInSec: '',
					};
					if (value.url !== '') {
						webUses.push(res[value.url]);
					}
				}
				res[value.url].nooftimes += 1;
				res[value.url].duration += value.duration;
				res[value.url].durationInSec = msToTime(res[value.url].duration);
				res[value.url].usagepercent = 0;
				return res;
			}, {});
			webUses.map((a) => {
				a.usagepercent = totalWebEffort(
					a.duration,
					getSum(webUses, 'duration')
				);
			});
			response.reduce((res, value) => {
				if (!res[value.app_name]) {
					res[value.app_name] = {
						app_name: value.app_name,
						duration: 0,
						nooftimes: 0,
						usagepercent: 0,
						durationInSec: '',
					};
					if (value.app_name !== '') {
						appUses.push(res[value.app_name]);
					}
				}
				res[value.app_name].nooftimes += 1;
				res[value.app_name].duration += value.duration;
				res[value.app_name].durationInSec = msToTime(
					res[value.app_name].duration
				);
				res[value.app_name].usagepercent = 0;
				return res;
			}, {});
			appUses.map((a) => {
				a.usagepercent = totalWebEffort(
					a.duration,
					getSum(appUses, 'duration')
				);
			});
			res.status(200).send({
				webUses,
				appUses,
			});
		} else {
			const response = await Activity.aggregate([
				{
					$lookup: {
						from: 'workers',
						localField: 'workerid',
						foreignField: 'employeeid',
						as: 'employeeDetails',
					},
				},
				{
					$match: {
						$and: [
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
							{
								'employeeDetails.masterID': req.user._id,
							},
						],
					},
				},
			]);
			const data3 = await violationListData(req.user._id, '');
			webSiteNames = data3.map((w) => {
				return w.violationsitename;
			});
			// let workingHours =
			// 	(await getWorkingHours(
			// 		req.user._id,
			// 		'',
			// 		req.query.startDate,
			// 		req.query.endDate
			// 	)) * 1000;
			const data = response.map((a) => {
				delete a.employeeDetails;
				if (
					browsers.some((v) =>
						a.app_name.toLowerCase().includes(v.toLowerCase())
					)
				) {
					if (
						webSiteNames.find((v) =>
							a.name.toLowerCase().includes(v.toLowerCase())
						)
					) {
						a.url = `www.${webSiteNames.find((v) =>
							a.name.toLowerCase().includes(v.toLowerCase())
						)}.com`;
					} else {
						a.url = 'others';
					}
				} else {
					a.url = '';
				}
				return a;
			});
			var result = [];
			var resultWeb = [];
			data.reduce((res, value) => {
				if (!res[value.app_name]) {
					res[value.app_name] = {
						app_name: value.app_name,
						duration: 0,
						nooftimes: 0,
						usagepercent: 0,
						durationInSec: '',
					};
					result.push(res[value.app_name]);
					// result.push(res[value.app_name])
				}
				res[value.app_name].nooftimes += 1;
				res[value.app_name].duration += value.duration;
				res[value.app_name].durationInSec = msToTime(
					res[value.app_name].duration
				);
				res[value.app_name].usagepercent = 0;
				return res;
			}, {});

			data.reduce((res, value) => {
				if (!res[value.url]) {
					res[value.url] = {
						url: value.url,
						duration: 0,
						nooftimes: 0,
						usagepercent: 0,
						durationInSec: '',
					};
					if (value.url !== '') {
						resultWeb.push(res[value.url]);
					}
				}
				res[value.url].nooftimes += 1;
				res[value.url].duration += value.duration;
				res[value.url].durationInSec = msToTime(res[value.url].duration);
				res[value.url].usagepercent = 0;
				return res;
			}, {});
			if (resultWeb.length > 0) {
				resultWeb.map((c) => {
					c.usagepercent = totalWebEffort(
						c.duration,
						getSum(resultWeb, 'duration')
					);
				});
			}
			if (result.length > 0) {
				result.map((c) => {
					c.usagepercent = totalWebEffort(
						c.duration,
						getSum(result, 'duration')
					);
				});
			}
			const responseBody = {
				appUses: result,
				webUses: resultWeb,
			};
			response1 = responseBody;
		}
		// console.log(response1)
		res.status(200).send(response1);
	} catch (ex) {
		console.log(ex);
		res.status(400).send('something went wrong');
	}
});

router.get('/getWebUsesEmployeeList', async (req, res) => {
	try {
		const worker = await Worker.find({
			masterID: req.user._id,
			isActive: true,
		}).sort({
			lastLoginDate: "desc"
		});
		// console.log(worker);
		let response = [];
		for (let w of worker) {
			var pipeline = [
				{
					$match: {
						$and: [
							{
								entrydate: {
									$gte: new Date(new Date(req.query.startDate).yyyymmdd())
										.getTime()
										.toString(),
								},
							},
							{
								entrydate: {
									$lte: new Date(new Date(req.query.endDate).yyyymmdd())
										.getTime()
										.toString(),
								},
							},
							{
								workerid: w.employeeid,
							},
						],
					},
				},
			];
			let webUses = [];
			let lastWebuse = '';
			let lastWebuseDate = '';
			let lastWebuseSystem = '';
			let activityWeb = [];
			const activity = await Activity.aggregate(pipeline);
			activity.reduce((res, value) => {
				if (!res[value.app_name]) {
					res[value.app_name] = {
						app_name: value.app_name,
						processName: '',
						system_name: '',
						duration: 0,
						nooftimes: 0,
						usagepercent: 0,
						durationInSec: '',
						activitydate: '',
					};
					if (value.app_name !== '') {
						if (
							browsers.some((v) =>
								value.app_name.toLowerCase().includes(v.toLowerCase())
							)
						) {
							webUses.push(res[value.app_name]);
						}
					}
				}
				if (
					browsers.some((v) =>
						value.app_name.toLowerCase().includes(v.toLowerCase())
					)
				) {
					lastWebuse = value.name;
					activityWeb.push(value);
					lastWebuseSystem = value.system_name;
					lastWebuseDate = value.activitydate;
				}
				res[value.app_name].activitydate = value.activitydate;
				res[value.app_name].system_name = value.system_name;
				res[value.app_name].processName = value.name;
				res[value.app_name].nooftimes += 1;
				res[value.app_name].duration += value.duration;
				res[value.app_name].durationInSec = msToTime(
					res[value.app_name].duration
				);
				res[value.app_name].usagepercent = 0;
				return res;
			}, {});
			let data = {
				isAdmin: w.isAdmin,
				activity: activityWeb,
				isActive: w.isActive,
				_id: w._id,
				empname: w.name,
				licenseKey: w.licenseKey,
				employeeid: w.employeeid,
				masterID: w.masterID,
				activeStatus: w.activeStatus,
				system_name: webUses.length > 0 ? lastWebuseSystem : 'N/A',
				activitydate:
					webUses.length > 0
						? moment(lastWebuseDate).format('YYYY-MM-DD HH:mm:ss')
						: 'N/A',
				latestWebUsed: webUses.length > 0 ? lastWebuse : 'N/A',
				totalDuration: msToTime(getSum(webUses, 'duration')),
				usesPercentage:
					totalWebEffort(
						getSum(webUses, 'duration'),
						getSum(activity, 'duration')
					) === null
						? 0
						: totalWebEffort(
								getSum(webUses, 'duration'),
								getSum(activity, 'duration')
						  ),
			};
			response.push(data);
		}
		res.status(200).send(response);
	} catch (ex) {
		console.log(ex);
		res.status(400).send('something went wrong');
	}
});
router.get('/getAppUsesEmployeeList', async (req, res) => {
	try {
		const worker = await Worker.find({
			masterID: req.user._id,
			isActive: true,
		}).sort({
			lastLoginDate: "desc"
		});
		// console.log(worker);
		let response = [];
		for (let w of worker) {
			var pipeline = [
				{
					$match: {
						$and: [
							{
								entrydate: {
									$gte: new Date(new Date(req.query.startDate).yyyymmdd())
										.getTime()
										.toString(),
								},
							},
							{
								entrydate: {
									$lte: new Date(new Date(req.query.endDate).yyyymmdd())
										.getTime()
										.toString(),
								},
							},
							{
								workerid: w.employeeid,
							},
						],
					},
				},
			];
			let appUses = [];
			const activity = await Activity.aggregate(pipeline);
			activity.reduce((res, value) => {
				if (!res[value.app_name]) {
					res[value.app_name] = {
						app_name: value.app_name,
						processName: value.name,
						system_name: '',
						duration: 0,
						nooftimes: 0,
						usagepercent: 0,
						durationInSec: '',
						activitydate: '',
					};
					if (value.app_name !== '') {
						appUses.push(res[value.app_name]);
					}
				}
				res[value.app_name].activitydate = value.activitydate;
				res[value.app_name].system_name = value.system_name;
				res[value.app_name].processName = value.name;
				res[value.app_name].nooftimes += 1;
				res[value.app_name].duration += value.duration;
				res[value.app_name].durationInSec = msToTime(
					res[value.app_name].duration
				);
				res[value.app_name].usagepercent = 0;
				return res;
			}, {});
			// console.log(activity)
			let data = {
				isAdmin: w.isAdmin,
				isActive: w.isActive,
				activity,
				_id: w._id,
				empname: w.name,
				licenseKey: w.licenseKey,
				employeeid: w.employeeid,
				masterID: w.masterID,
				activeStatus: w.activeStatus,
				system_name:
					activity.length > 0
						? activity[activity.length - 1].system_name
						: 'N/A',
				activitydate:
					activity.length > 0
						? moment(activity[activity.length - 1].activitydate).format(
								'YYYY-MM-DD HH:mm:ss'
						  )
						: 'N/A',
				latestAppUsed:
					activity.length > 0 ? activity[activity.length - 1].name : 'N/A',
				totalDuration: msToTime(getSum(appUses, 'duration')),
				usesPercentage:
					totalWebEffort(
						getSum(appUses, 'duration'),
						getWorkingHoursForApp(w, req.query.startDate, req.query.endDate)
					) === null
						? 0
						: totalWebEffort(
								getSum(appUses, 'duration'),
								(await getWorkingHoursForApp(
									w,
									req.query.startDate,
									req.query.endDate
								)) * 1000
						  ),
			};
			// console.log(data)
			response.push(data);
		}
		res.status(200).send(response);
	} catch (ex) {
		console.log(ex);
		res.status(400).send('something went wrong');
	}
});
router.get('/getViolationListGraph', async (req, res) => {
	try {
		let response = [];
		var pipeline = [
			{
				$match: {
					$and: [
						{
							entrydate: {
								$gte: new Date(new Date(req.query.startDate).yyyymmdd())
									.getTime()
									.toString(),
							},
						},
						{
							entrydate: {
								$lte: new Date(new Date(req.query.endDate).yyyymmdd())
									.getTime()
									.toString(),
							},
						},
						{
							isVaiolated: true,
						},
					],
				},
			},
		];
		const activity = await Activity.aggregate(pipeline);
		let violatedWebUse = [];
		let violatedAppUse = [];
		const data = activity.map((a) => {
			a = {
				isVaiolated: a.isVaiolated,
				_id: a._id,
				name: a.name,
				app_name: a.app_name,
				system_name: a.system_name,
				system_id: a.system_id,
				ram_info: a.ram_info,
				workerid: a.workerid,
				entrydate: a.entrydate,
				activitydate: a.activitydate,
				entrytime: a.entrydate,
				duration: a.duration,
				url: '',
			};
			if (
				browsers.some((v) => a.app_name.toLowerCase().includes(v.toLowerCase()))
			) {
				if (
					webSiteNames.find((v) =>
						a.name.toLowerCase().includes(v.toLowerCase())
					)
				) {
					a.url = `www.${webSiteNames.find((v) =>
						a.name.toLowerCase().includes(v.toLowerCase())
					)}.com`;
				} else {
					a.url = 'others';
				}
			} else {
				a.url = '';
			}
			return a;
		});
		data.reduce((res, value) => {
			if (!res[value.url]) {
				res[value.url] = {
					url: value.url,
					app_name: value.app_name,
					processName: '',
					system_name: '',
					duration: 0,
					nooftimes: 0,
					usagepercent: 0,
					durationInSec: '',
					activitydate: '',
				};
				if (value.url !== '') {
					violatedWebUse.push(res[value.url]);
				}
			}
			res[value.url].activitydate = value.activitydate;
			res[value.url].system_name = value.system_name;
			res[value.url].processName = value.name;
			res[value.url].nooftimes += 1;
			res[value.url].duration += value.duration;
			res[value.url].durationInSec = msToTime(res[value.url].duration);
			res[value.url].usagepercent = 0;
			return res;
		}, {});
		data.reduce((res, value) => {
			if (!res[value.app_name]) {
				res[value.app_name] = {
					url: value.url,
					app_name: value.app_name,
					processName: '',
					system_name: '',
					duration: 0,
					nooftimes: 0,
					usagepercent: 0,
					durationInSec: '',
					activitydate: '',
				};
				if (value.url === '') {
					violatedAppUse.push(res[value.app_name]);
				}
			}
			res[value.app_name].activitydate = value.activitydate;
			res[value.app_name].system_name = value.system_name;
			res[value.app_name].processName = value.name;
			res[value.app_name].nooftimes += 1;
			res[value.app_name].duration += value.duration;
			res[value.app_name].durationInSec = msToTime(
				res[value.app_name].duration
			);
			res[value.app_name].usagepercent = 0;
			return res;
		}, {});
		Array.prototype.push.apply(violatedAppUse, violatedWebUse);
		violatedAppUse.map((a) => {
			if (a.url === '') {
				a.url = a.app_name;
			}
			a.usagepercent = totalWebEffort(
				a.duration,
				getSum(violatedAppUse, 'duration')
			);
		});
		res.status(200).send(violatedAppUse);
	} catch (ex) {
		console.log(ex);
		res.status(400).send('something went wrong');
	}
});

router.get('/getViolationEmployeeList', async (req, res) => {
	try {
		const worker = await Worker.find({
			masterID: req.user._id,
			isActive: true,
		}).sort({
			lastLoginDate: "desc"
		});
		let response = [];
		for (let w of worker) {
			var pipeline = [
				{
					$match: {
						$and: [
							{
								entrydate: {
									$gte: new Date(new Date(req.query.startDate).yyyymmdd())
										.getTime()
										.toString(),
								},
							},
							{
								entrydate: {
									$lte: new Date(new Date(req.query.endDate).yyyymmdd())
										.getTime()
										.toString(),
								},
							},
							{
								workerid: w.employeeid,
							},
							{
								isVaiolated: true,
							},
						],
					},
				},
			];
			let violatedUse = [];
			const activity = await Activity.aggregate(pipeline);
			const data = activity.map((a) => {
				a = {
					isVaiolated: a.isVaiolated,
					_id: a._id,
					name: a.name,
					app_name: a.app_name,
					system_name: a.system_name,
					system_id: a.system_id,
					ram_info: a.ram_info,
					workerid: a.workerid,
					entrydate: a.entrydate,
					activitydate: a.activitydate,
					entrytime: a.entrydate,
					duration: a.duration,
					url: '',
				};
				if (
					browsers.some((v) =>
						a.app_name.toLowerCase().includes(v.toLowerCase())
					)
				) {
					if (
						webSiteNames.find((v) =>
							a.name.toLowerCase().includes(v.toLowerCase())
						)
					) {
						a.url = `www.${webSiteNames.find((v) =>
							a.name.toLowerCase().includes(v.toLowerCase())
						)}.com`;
					} else {
						a.url = 'others';
					}
				} else {
					a.url = '';
				}
				return a;
			});
			data.reduce((res, value) => {
				if (!res[value.url]) {
					res[value.url] = {
						url: value.url,
						processName: '',
						system_name: '',
						duration: 0,
						nooftimes: 0,
						usagepercent: 0,
						durationInSec: '',
						activitydate: '',
					};
					violatedUse.push(res[value.url]);
				}
				res[value.url].activitydate = value.activitydate;
				res[value.url].system_name = value.system_name;
				res[value.url].processName = value.name;
				res[value.url].nooftimes += 1;
				res[value.url].duration += value.duration;
				res[value.url].durationInSec = msToTime(res[value.url].duration);
				res[value.url].usagepercent = 0;
				return res;
			}, {});
			w.activity = activity;
			let data1 = {
				activity: activity,
				isAdmin: w.isAdmin,
				isActive: w.isActive,
				_id: w._id,
				empname: w.name,
				licenseKey: w.licenseKey,
				employeeid: w.employeeid,
				masterID: w.masterID,
				activeStatus: w.activeStatus,
				system_name:
					activity.length > 0
						? activity[activity.length - 1].system_name
						: 'N/A',
				activitydate:
					activity.length > 0
						? moment(activity[activity.length - 1].activitydate).format(
								'YYYY-MM-DD HH:mm:ss'
						  )
						: 'N/A',
				latestAppUsed:
					activity.length > 0 ? activity[activity.length - 1].name : 'N/A',
				totalDuration: msToTime(getSum(violatedUse, 'duration')),
				usesPercentage:
					totalWebEffort(
						getSum(violatedUse, 'duration'),
						getWorkingHoursForApp(w, req.query.startDate, req.query.endDate)
					) === null
						? 0
						: totalWebEffort(
								getSum(violatedUse, 'duration'),
								(await getWorkingHoursForApp(
									w,
									req.query.startDate,
									req.query.endDate
								)) * 1000
						  ),
			};
			response.push(data1);
		}
		res.status(200).send(response);
	} catch (ex) {
		console.log(ex);
		res.status(400).send('something went wrong');
	}
});
router.get('/getProductivityEmployeeList', async (req, res) => {
	try {
		const employee = await Worker.find({
			masterID: req.user._id,
			isActive: true,
		}).sort({
			lastLoginDate: "desc"
		});
		let response = [];
		for (let emp of employee) {
			let pipeline = [
				{
					$match: {
						$and: [
							{
								entrydate: {
									$gte: new Date(new Date(req.query.startDate).yyyymmdd())
										.getTime()
										.toString(),
								},
							},
							{
								entrydate: {
									$lte: new Date(new Date(req.query.endDate).yyyymmdd())
										.getTime()
										.toString(),
								},
							},
							{
								workerid: emp['employeeid'],
							},
							{
								isVaiolated: false,
							},
						],
					},
				},
			];
			let activity = await Activity.aggregate(pipeline);
			let data1 = {
				isAdmin: emp.isAdmin,
				isActive: emp.isActive,
				_id: emp._id,
				empname: emp.name,
				licenseKey: emp.licenseKey,
				employeeid: emp.employeeid,
				masterID: emp.masterID,
				activeStatus: emp.activeStatus,
				system_name:
					activity.length > 0
						? activity[activity.length - 1].system_name
						: 'N/A',
				activitydate:
					activity.length > 0
						? moment(activity[activity.length - 1].activitydate).format(
								'YYYY-MM-DD HH:mm:ss'
						  )
						: 'N/A',
				totalDuration: msToTime(getSum(activity, 'duration')),
				productivityPercentage:
					totalWebEffort(
						getSum(activity, 'duration'),
						await getWorkingHoursForApp(
							emp,
							req.query.startDate,
							req.query.endDate
						)
					) === null
						? 0
						: totalWebEffort(
								getSum(activity, 'duration'),
								await getWorkingHoursForApp(
									emp,
									req.query.startDate,
									req.query.endDate
								)
						  ),
				activity,
			};
			response = [...response, data1];
		}
		return res.status(200).send(response);
	} catch (ex) {
		console.log(ex);
		res.status(400).send('something went wrong');
	}
});
router.get('/getAgentTool', async (req, res) => {
	try {
		const response = await getAgentTool();
		const responseLinux = await getAgentToolLinux();
		res.status(200).send({
			linkWindows: response[0],
			linkLinux: responseLinux[0],
		});
	} catch (error) {
		console.log(error);
		res.status(400).send('something went wrong');
	}
});
router.get('/activitystatus', async (req, res) => {
	const worker = await Worker.find({
		masterID: req.user._id,
		isActive: true,
	}).sort({
		lastLoginDate: "desc"
	});
	let active = [];
	for (let w of worker) {
		let name = {
			name: w.name,
		};
		let person = await Activity.find({
			workerid: w.employeeid,
		})
			.sort({
				activitydate: "desc",
			})
			.limit(1);
		if (person[0]) {
			person[0]['system_name'] = w.name;
			active.push(person[0]);
		} else {
			active.push({
				system_name: w.name,
			});
		}
	}
	res.send(active);
});
module.exports = router;
