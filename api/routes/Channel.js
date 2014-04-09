'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('webapi'),
    JID = require('node-xmpp-core').JID,
    ApiError = require('../utils/ApiError'),
    ApiUtils = require('../utils/ApiUtils');

var UserManager = require('../lib/User');

var routes = function(app, storage, settings) {

    logger.info('register channel routes');

    var domain = settings.get('domain');
    var usrManager = new UserManager(storage);

    /**
     * Create a new channels for the authenticated user.
     */
    app.post('/api/user/channels', function(req, res) {
        res.json({});
    });

    /**
     * Create a new channels in this organization.
     */
    app.post('/api/orgs/:org/channels', function(req, res) {
        res.json({});
    });

    /**
     * 
     */
    app.get('/api/channels/:owner/:channel', function(req, res) {
        // extract parameter
        var username = req.params.owner;
        var channelname = req.params.channel;

        logger.debug('Get channel: ' +  username + '/' + channelname);

        // requester, should be member of the room
        var jid = ApiUtils.getJID(req);
        var ownerjid = new JID(username + '@' + domain);

        var usr = null;
        var c = null;
        usrManager.findUser(jid.toString()).then(function (user) {
            usr = user;
            return usrManager.findUser(ownerjid.toString());
        }).then(function(owner){
            return usrManager.getChannel(owner, channelname);
        }).then(function(channel) {
            c = channel;
            return channel.isSubscriber(usr);
        }).then(function() {
            console.log('is subscriber');
            res.json(c);
        }).catch(function(err) {
            console.error(err);
            logger.error(err);
            res.json(404, new ApiError('not found'));
        });
    });

    /**
     * Edit channel
     */
    app.patch('/api/channels/:owner/:channel', function(req, res) {
        res.json({});
    });

    /**
     * Delete a channel (requires admin access)
     */
    app.del('/api/channels/:owner/:channel', function(req, res) {
        res.json({});
    });


    /**
     * List members
     */
    app.get('/api/channels/:owner/:channel/subscribers', function(req, res) {
        res.json({});
    });

    /**
     * Add user as a subscriber
     */
    app.put('/api/channels/:owner/:channel/subscribers/:user', function(req, res) {
        res.json({});
    });

    /**
     * Remove user as a subscriber
     */
    app.del('/api/channels/:owner/:channel/subscribers/:user', function(req, res) {
        res.json({});
    });

    /**
     * trigger an event
     */
    app.post('/api/channels/:owner/:channel/events', function(req, res) {
        res.json({});
    });

    /**
     * List events for a channel
     */
    app.get('/api/channels/:owner/:channel/events', function(req, res) {
        // extract parameter
        var username = req.params.owner;
        var channelname = req.params.channel;

        logger.debug('Get channel: ' +  username + '/' + channelname);

        // requester, should be member of the room
        var jid = ApiUtils.getJID(req);
        var ownerjid = new JID(username + '@' + domain);

        var usr = null;
        var c = null;
        usrManager.findUser(jid.toString()).then(function (user) {
            usr = user;
            return usrManager.findUser(ownerjid.toString());
        }).then(function(owner){
            return usrManager.getChannel(owner, channelname);
        }).then(function(channel) {
            c = channel;
            return channel.isSubscriber(usr);
        }).then(function() {
            return c.getEvents();
        }).then(function(events) {
            res.json(events);
        }).catch(function(err) {
            console.error(err);
            logger.error(err);
            res.json(404, new ApiError('not found'));
        });
    });
};

// Expose routes
module.exports = routes;