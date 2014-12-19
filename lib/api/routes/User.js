'use strict';

var express = require('express'),
  logger = require('../../core/Logger')('webapi'),
  ApiError = require('../utils/ApiError'),
  ApiUtils = require('../utils/ApiUtils'),
  bodyParser = require('body-parser');

var routes = function (storage, settings) {
  logger.info('register user routes');

  var userapi = express.Router();

  userapi.use(bodyParser.json({
    limit: '1mb'
  }));

  /**
   * Get the authenticated user
   */
  userapi.get('/user', function (req, res) {
    var jid = ApiUtils.getJID(req);

    res.json({
      user: jid.toString()
    });
  });

  /**
   * Get a single user
   */
  userapi.get('/users/:user', function (req, res) {
    res.json({});
  });

  /**
   * List rooms for the authenticated user.
   */
  userapi.get('/user/rooms', function (req, res) {
    var jid = ApiUtils.getJID(req);
    var type = req.query.type; // all, owner, member.

    storage.findUser(jid.toString()).then(function (user) {
      return storage.getRooms(user, type);
    }).then(function (rooms) {
      logger.debug(JSON.stringify(rooms));
      res.json(rooms);
    }).catch(function (err) {
      logger.error(err);
      res.status(400).json(new ApiError());
    });

  });

  /**
   * Create a new rooms for the authenticated user.
   * {
   *    "name" : "room_name"
   * }
   */
  userapi.post('/user/rooms', function (req, res) {
    var jid = ApiUtils.getJID(req);
    var data = req.body;

    // check that all required parameters are properly set
    if (!data || !data.name ||  data.name === '' ||  data.name === null) {
      res.json(new ApiError('name is missing'));
    }

    logger.debug('start database request');
    storage.findUser(jid.toString()).then(function (user) {
      logger.debug('found user: ' + JSON.stringify(user));
      return storage.addRoom(user, data);
    }).then(function (room) {
      logger.debug('found room: ' + JSON.stringify(room));
      res.json(room);
    }).catch(function (err) {
      logger.error(err);
      res.status(400).json(new ApiError());
    });

  });

  /**
   * List channels for the authenticated user.
   */
  userapi.get('/user/channels', function (req, res) {
    var jid = ApiUtils.getJID(req);
    var type = req.query.type; // all, owner, member.

    storage.findUser(jid.toString()).then(function (user) {
      return storage.getChannels(user, type);
    }).then(function (room) {
      res.json(room);
    }).catch(function (err) {
      logger.error(err);
      res.status(400).json(new ApiError());
    });

  });

  userapi.post('/user/channels', function (req, res) {
    var jid = ApiUtils.getJID(req);
    var data = req.body;

    // check that all required parameters are properly set
    if (!data || !data.name ||  data.name === '' ||  data.name === null) {
      res.json(new ApiError('name is missing'));
    }

    storage.findUser(jid.toString()).then(function (user) {
      return storage.addChannel(user, data);
    }).then(function (room) {
      res.json(room);
    }).catch(function (err) {
      logger.error(err);
      res.status(400).json(new ApiError());
    });
  });

  return userapi;
};

// Expose routes
module.exports = routes;