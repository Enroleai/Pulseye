const mongoose = require('mongoose');
const teamSchema = new mongoose.Schema({
	DEPT_ID: {
		type: String,
		required: true,
		maxlength: 28,
	},
	TEAM_NAME: {
		type: String,
		required: true,
		maxlength: 100,
	},
	TEAM_DESC: {
		type: String,
		required: true,
		maxlength: 28,
	},
	CREATE_DATE: {
		type: Date,
		required: true,
	},
	IS_TEAM_ACTIVE: {
		type: Boolean,
	},
	LAST_UPDATE_DATE: {
		type: Date,
	},
	MANAGER: {
		type: String,
	},
});

module.exports = mongoose.model('Teams', teamSchema);
