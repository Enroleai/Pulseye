const mongoose = require('mongoose');

const examsSchema = new mongoose.Schema({
	siteName: {
		type: String,
		required: true,
	},
	createdDate: {
		type: Date,
		required: true,
	},
	activeStatus: {
		type: Boolean,
		required: true,
	},
});

module.exports = mongoose.model('exams', examsSchema);
