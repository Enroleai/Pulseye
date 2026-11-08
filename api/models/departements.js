const mongoose = require('mongoose');
const departementSchema = new mongoose.Schema({
	MANAGERS: {
		type: [String],
	},
	ORG_ID: {
		type: String,
		required: true,
		maxlength: 28,
	},
	DEPT_NAME: {
		type: String,
		required: true,
		maxlength: 100,
	},
	DEPT_DESC: {
		type: String,
		required: true,
		maxlength: 100,
	},
	CREATE_DATE: {
		type: Date,
		required: true,
	},
	IS_DEPT_ACTIVE: {
		type: Boolean,
	},
	LAST_UPDATE_DATE: {
		type: Date,
	},
});

module.exports = mongoose.model('departments', departementSchema);
