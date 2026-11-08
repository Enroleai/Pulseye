const mongoose = require('mongoose');

const DesktopApps = new mongoose.Schema({
	Name: {
		type: String,
		required: true,
	},
	CreatedDate: {
		type: Date,
		required: true,
	},
});

module.exports = mongoose.model('DesktopApps', DesktopApps);
