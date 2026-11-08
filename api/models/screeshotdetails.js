const config = require("config");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const mongoose = require("mongoose");

const screeshotdetailsSchma = new mongoose.Schema({
    screenshoturl: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 1024,
    },
    screenshotdate: {
      type: Date,
      required: true
    },
    masterID: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 1024
    },
    employeeid: {
      type: String,
      required: true,
      minlength: 0,
      maxlength: 255,
    },
    entrydate: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 1024
    },
    entrytime: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 1024
    }
  });
  
  
  const screeshotdetails = mongoose.model("screeshotdetails", screeshotdetailsSchma);
  
  function validatescreeshotdetails(screeshotdetails) {
    const schema = {
      name: Joi.string().min(4).max(50).required(),
    };
  
    return Joi.validate(screeshotdetails, schema);
  }
  
  exports.screeshotdetails = screeshotdetails;
  exports.validate = validatescreeshotdetails;
  