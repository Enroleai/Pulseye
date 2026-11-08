const mongoose = require('mongoose');

const Websites = new mongoose.Schema({
	Name: {
		type: String,
		required: true,
	},
	CreatedDate: {
		type: Date,
		required: true,
	},
});

module.exports = mongoose.model('WebSites', Websites);
