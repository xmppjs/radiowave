'use strict';

var express = require('express'),
  logger = require('../../core/Logger')('webapi'),
  bodyParser = require('body-parser');

var routes = function () {

  var orgsapi = express.Router();

  logger.info('register orgs routes');

  orgsapi.use(bodyParser.json({
    limit: '1mb'
  }));

  /**
   * List organization rooms
   */
  orgsapi.get('/orgs/:org/rooms', function (req, res) {
    res.json({});
  });

  /**
   * Create a new rooms in this organization.
   */
  orgsapi.post('/orgs/:org/rooms', function (req, res) {
    res.json({});
  });

  return orgsapi;
};

// Expose routes
module.exports = routes;
