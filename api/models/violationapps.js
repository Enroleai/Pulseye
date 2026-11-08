const config = require("config");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const mongoose = require("mongoose");
const { required } = require("joi/lib/types/object");

const violationappSchma = new mongoose.Schema({
    violationsitename: {
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
    dateadded: {
     type: Date,
     required: false
    },
    workerid: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 255,
    },
    isActive: {
      type: Boolean,
      default: true
    }
  });
  
  
  const violationapps = mongoose.model("violationapps", violationappSchma);
  
  function validateviolationapps(violationapps) {
    const schema = {
      name: Joi.string().min(4).max(50).required(),
      type: Joi.string().min(5).max(255).required()
    };
  
    return Joi.validate(violationapps, schema);
  }
  
  exports.violationapps = violationapps;
  exports.validate = validateviolationapps;
  