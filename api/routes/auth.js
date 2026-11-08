const Joi = require('joi');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const { Manager } = require('../models/maneger');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let manager = await Manager.findOne({ email: req.body.email });
  if (!manager) return res.status(400).send('Invalid email or password.');

  const validPassword = await bcrypt.compare(req.body.password, manager.password);
  if (!validPassword) return res.status(400).send('Invalid email or password.');

  const token = manager.generateAuthToken();
  res.send(token);
});

function validate(req) {
  const schema = {
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required()
  };

  return Joi.validate(req, schema);
}

module.exports = router; 
