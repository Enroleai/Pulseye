const config = require("config");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const mongoose = require("mongoose");

const categorySchma = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  categoryname : {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  type: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  isproductive: {
    type: Boolean,
    default: true
  },
  operatingsystem: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  masterID: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1024

  }
});


const Category = mongoose.model("Category", categorySchma);

function validateCategory(category) {
  const schema = {
    name: Joi.string().min(4).max(50).required(),
    type: Joi.string().min(5).max(255).required()
  };

  return Joi.validate(category, schema);
}

exports.Category = Category;
exports.validate = validateCategory;
