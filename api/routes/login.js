const auth = require('../middleware/auth');
const isManager = require('../middleware/isManager');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const { Manager, validate } = require('../models/maneger');
const { Worker, validateWorker } = require('../models/worker');
const express = require('express');
const router = express.Router();

router.post('/managerLogin', async (req, res) => {
	try {
		let manager = await Manager.findOne({ email: req.body.user.email });
		// console.log(manager);
		if (!manager)
			return res
				.status(200)
				.send({ status: false, msg: 'Wrong email or password' });

		bcrypt.compare(
			req.body.user.password,
			manager.password,
			function (error, result) {
				if (error) throw error;
				if (result) {
					const token = manager.generateAuthToken();
					res
						.header('x-auth-token', token)
						.send(_.pick(manager, ['_id', 'name', 'email', 'isAdmin']));
				} else {
					return res
						.status(200)
						.send({ status: false, msg: 'Wrong email or password' });
				}
			}
		);
	} catch (error) {
		console.log('Failed in login', error);
		res.status(200).send({ status: false, msg: error.message });
	}
});
router.post('/managerChangePassword', async (req, res) => {
	try {
		let manager = await Manager.findOne({ email: req.body.user.email });
		// console.log(manager);
		if (!manager)
			return res
				.status(200)
				.send({ status: false, msg: 'No user registerd with this email!' });
		await bcrypt.compare(
			req.body.user.password,
			manager.password,
			async function (error, result) {
				if (error)
					return res.status(200).send({ status: false, msg: 'Wrong password' });
				if (result) {
						const salt = await bcrypt.genSalt(10);
					const password = await bcrypt.hash(req.body.user.newpassword, salt);
					const update = await Manager.updateOne(
						{ _id: manager._id },
						{ $set: { password } }
					);
					if (update) {
						res.status(200).send({ status: true });
					} else {
						res.status(200).send({ status: false });
					}
					// const token = manager.generateAuthToken();
					// res
					//   .header("x-auth-token", token)
					//   .send(_.pick(manager, ["_id", "name", "email", "isAdmin"]));
				} else {
					return res.status(200).send({ status: false, msg: 'Wrong password' });
				}
			}
		);
	} catch (error) {
		console.log('Failed in login', error);
		res.status(400).send(error.message);
	}
});

router.post('/managersignup', auth, isManager, async (req, res) => {
	const email = req.body.email;
	const password = req.body.password;
	const name = req.body.name;
	const { error } = validate({ name, email, password });
	if (error) return res.status(400).send(error.details[0].message);
	const manager = await Manager.findOne({ email: email });
	if (manager)
		return res.json({
			status: 'email already exists please use another email',
		});
	const hashedpassword = await bcrypt.hash(password, 10);
	const newManager = await Manager.create({
		name,
		email,
		password: hashedpassword,
		isAdmin: true,
	});
	res.json(newManager);
});

module.exports = router;
