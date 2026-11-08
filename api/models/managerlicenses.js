const config = require("config");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const mongoose = require("mongoose");

const managerlicensesSchma = new mongoose.Schema({
    licenseKey: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 50,
    },
    masterID: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 1024
  
    },
    activeStatus: {
      type: Boolean,
      default: false
    },
    licensecreateddate: {
        type: Date,
        required: true,
    },
    employeeid: {
      type: String,
      required: false,
      minlength: 0,
      maxlength: 255,
    },
    name: {
      type: String,
      required: false,
      minlength: 0,
      maxlength: 255,
    },
    employeeonboarddate: {
        type: Date,
        required: false,
    },
  });
  
  
  const managerlicenses = mongoose.model("managerlicenses", managerlicensesSchma);
  
  function validatemanagerlicenses(managerlicenses) {
    const schema = {
      name: Joi.string().min(4).max(50).required(),
      type: Joi.string().min(5).max(255).required()
    };
  
    return Joi.validate(managerlicenses, schema);
  }
  
  exports.managerlicenses = managerlicenses;
  exports.validate = validatemanagerlicenses;
  