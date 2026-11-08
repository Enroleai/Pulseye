const config = require('config');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50
  },
  licenseKey: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1024
  },
  employeeid: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 1024
  },
  email: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 1024
  },
  masterID: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1024

  },
  activeStatus: {
    type: String,
    required: false,
    minlength: 3,
    maxlength: 50
  },
  lastLoginDate: {
    type: Date,
    required: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  employeeoffboarddate: {
    type: Date,
    required: false
  },
  employeeonboarddate: {
    type: Date,
    required: false
  },
  isActive: {
    type: Boolean,
    default: false
  }

});

workerSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id,  licenseKey: this.licenseKey, isAdmin: this.isAdmin, masterID: this.masterID, name: this.name }, config.get('jwtPrivateKey'));
  return token;
}

const Worker = mongoose.model('Worker', workerSchema);

function validateWorker(worker) {
  const schema = {
    name: Joi.string().min(4).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(4).max(255).required()
  };

  return Joi.validate(worker, schema);
}

exports.Worker = Worker;
exports.validate = validateWorker;