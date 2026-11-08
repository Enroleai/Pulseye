const { Category } = require('../models/categories');
const express = require('express');

const router = express.Router();

router.post('/createCategory', async (req, res) => {
	try {
		const { name, categoryname, type, isproductive, operatingsystem } = req.body;
		if (!name || !categoryname || !type || !operatingsystem) {
			return res.status(400).send('missing required parameters');
		}

		const category = new Category({
			name,
			categoryname,
			type,
			isproductive,
			operatingsystem,
			masterID: String(req.user._id),
		});
		await category.save();
		return res.status(200).send('New category created successfully');
	} catch (error) {
		console.error('Unable to create category:', error);
		return res.status(400).send('missing required parameters');
	}
});

router.get('/getCategory', async (req, res) => {
	try {
		const categories = await Category.find(
			{ masterID: String(req.user._id) },
			{ name: 1 }
		);
		return res.status(200).send(categories);
	} catch (error) {
		console.error('Unable to load categories:', error);
		return res.status(400).send('something went wrong');
	}
});

module.exports = router;
