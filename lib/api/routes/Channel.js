'use strict';

var logger = require('../../core/Logger')('webapi'),
  express = require('express'),
  JID = require('node-xmpp-core').JID,
  ApiError = require('../utils/ApiError'),
  ApiUtils = require('../utils/ApiUtils'),
  bodyParser = require('body-parser');


var routes = function (storage, settings) {

  var channelapi = express.Router();
  logger.info('register channel routes');

  var domain = settings.get('domain');

  channelapi.use(bodyParser.json({
    limit: '1mb'
  }));

  /**
   * Create a new channels for the authenticated user.
   */
  channelapi.post('/user/channels', function (req, res) {
    res.json({});
  });

  /**
   * Create a new channels in this organization.
   */
  channelapi.post('/orgs/:org/channels', function (req, res) {
    res.json({});
  });

  /**
   *
   */
  channelapi.get('/channels/:owner/:channel', function (req, res) {
    // extract parameter
    var username = req.params.owner;
    var channelname = req.params.channel;

    logger.debug('Get channel: ' + username + '/' + channelname);

    // requester, should be member of the room
    var jid = ApiUtils.getJID(req);
    var ownerjid = new JID(username + '@' + domain);

    var usr = null;
    var c = null;
    storage.findUser(jid.toString()).then(function (user) {
      usr = user;
      return storage.findUser(ownerjid.toString());
    }).then(function (owner) {
      return storage.getChannel(owner, channelname);
    }).then(function (channel) {
      c = channel;
      return channel.isSubscriber(usr);
    }).then(function () {
      logger.debug('is subscriber');
      res.json(c);
    }).catch(function (err) {
      logger.error(err);
      res.status(404).json(new ApiError('not found'));
    });
  });

  /**
   * Edit channel
   */
  channelapi.patch('/channels/:owner/:channel', function (req, res) {
    res.json({});
  });

  /**
   * Delete a channel (requires admin access)
   */
  channelapi.delete('/channels/:owner/:channel', function (req, res) {
    res.json({});
  });


  /**
   * List members
   */
  channelapi.get('/channels/:owner/:channel/subscribers', function (req, res) {
    res.json({});
  });

  /**
   * Add user as a subscriber
   */
  channelapi.put('/channels/:owner/:channel/subscribers/:user', function (req, res) {
    res.json({});
  });

  /**
   * Remove user as a subscriber
   */
  channelapi.delete('/channels/:owner/:channel/subscribers/:user', function (req, res) {
    res.json({});
  });

  /**
   * trigger an event
   */
  channelapi.post('/channels/:owner/:channel/events', function (req, res) {
    res.json({});
  });

  /**
   * List events for a channel
   */
  channelapi.get('/channels/:owner/:channel/events', function (req, res) {
    // extract parameter
    var username = req.params.owner;
    var channelname = req.params.channel;

    logger.debug('Get channel: ' + username + '/' + channelname);

    // requester, should be member of the room
    var jid = ApiUtils.getJID(req);
    var ownerjid = new JID(username + '@' + domain);

    var usr = null;
    var c = null;
    storage.findUser(jid.toString()).then(function (user) {
      usr = user;
      return storage.findUser(ownerjid.toString());
    }).then(function (owner) {
      return storage.getChannel(owner, channelname);
    }).then(function (channel) {
      c = channel;
      return channel.isSubscriber(usr);
    }).then(function () {
      return c.getEvents();
    }).then(function (events) {
      res.json(events);
    }).catch(function (err) {
      logger.error(err);
      res.status(404).json(new ApiError('not found'));
    });
  });

  return channelapi;
};

// Expose routes
module.exports = routes;