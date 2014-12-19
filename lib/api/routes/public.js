'use strict';

var express = require('express'),
  logger = require('../../core/Logger')('webapi'),
  bodyParser = require('body-parser');

var routes = function () {
  logger.info('register public routes');

  var publicapi = express.Router();

  app.use(bodyParser.json({
    limit: '1mb'
  }));

  /**
   * List all public rooms
   */
  publicapi.get('/rooms', function (req, res) {
    res.json({});
  });

  /**
   * List public rooms for the specified user.
   */
  publicapi.get('/users/:user/rooms', function (req, res) {
    res.json({});
  });

  return publicapi;

};

// Expose routes
module.exports = routes;