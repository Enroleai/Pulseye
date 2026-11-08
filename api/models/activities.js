const config = require("config");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
    workerid: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  entrydate: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  entrytime: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024
  },
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 1024,
  },
  app_name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  system_name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 1024
  },
  isVaiolated: {
    type: Boolean,
    default: false
  },
  system_id: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 1024
  },
  ram_info: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 1024
  },
  activitydate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    minlength: 0,
    maxlength: 1024

  }
});

// activitySchma.methods.generateAuthToken = function () {
//   const token = jwt.sign(
//     { _id: this._id, isAdmin: this.isAdmin },
//     config.get("jwtPrivateKey")
//   );
//   return token;
// };

const Activity = mongoose.model("activities", activitySchema);

function validateactivity(Activity) {
  const schema = {
    name: Joi.string().min(4).max(50).required(),
    type: Joi.string().min(5).max(255).required()
  };

  return Joi.validate(Activity, schema);
}

exports.Activity = Activity;
exports.validate = validateactivity;
