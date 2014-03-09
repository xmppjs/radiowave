'use strict';

var ApiError = require('../utils/ApiError'),
    winston = require('winston'),
    logger = winston.loggers.get('webapi'),
    JID = require('node-xmpp-core').JID,
    apiutils = require('../utils/utils');

var UserManager = require('../lib/user');

var routes = function (app, storage, settings) {

    logger.info('register room routes');

    var domain = settings.get('domain');
    var usrManager = new UserManager(storage);

    function exportJSON(model) {
        if (model instanceof Array) {
            var exportVal = [];
            model.forEach(function (item) {
                exportVal.push(exportJSON(item));
            });
            return exportVal;
        } else if (model && typeof(model.exportJSON) === 'function') {
            return model.exportJSON();
        } else {
            return model.toJSON();
        }
    }

    /**
     * Get room
     * restriction: only owner and members can access this information
     */
    app.get('/api/rooms/:owner/:room', function (req, res) {
        logger.debug('Get room: ' +  username + '/' + roomname);

        // requester, should be member of the room
        var jid = apiutils.getJid(req);

        var username = req.params.owner;
        var roomname = req.params.room;

        var ownerjid = new JID(username + '@' + domain);

        var usr = null;
        var r = null;
        usrManager.findUser(jid).then(function (user) {
            usr = user;
            return usrManager.findUser(ownerjid.toString());
        }).then(function(owner){
            return usrManager.getRoom(owner, roomname);
        }).then(function(room) {
            r = room;
            return room.isMember(usr);
        }).then(function() {
            res.json(r);
        }).catch(function(err) {
            console.error(err);
            logger.error(err);
            res.json(404, new ApiError('not found'));
        });
    });

    /**
     * Edit room
     * restriction: only owner and members can access this information
     */
    app.patch('/api/rooms/:owner/:room', function (req, res) {
        res.json(404, new ApiError('not found'));
    });

    /**
     * Delete a room (requires admin access)
     * restriction: only owner can do this
     */
    app.del('/api/rooms/:owner/:room', function (req, res) {
        res.json(404, new ApiError('not found'));
    });

    /**
     * List members
     * restriction: only owner and members can access this information
     */
    app.get('/api/rooms/:owner/:room/members', function(req, res) {
        logger.debug('Get room: ' +  username + '/' + roomname);

        // requester, should be member of the room
        var jid = apiutils.getJid(req);

        var username = req.params.owner;
        var roomname = req.params.room;

        var ownerjid = new JID(username + '@' + domain);

        var usr = null;
        var r = null;
        usrManager.findUser(jid).then(function (user) {
            usr = user;
            return usrManager.findUser(ownerjid.toString());
        }).then(function(owner){
            return usrManager.getRoom(owner, roomname);
        }).then(function(room) {
            r = room;
            return room.isMember(usr);
        }).then(function() {
            return r.getMembers();
        }).then(function(members) {
            res.json(exportJSON(members));
        }).catch(function(err) {
            console.error(err);
            logger.error(err);
            res.json(404, new ApiError('not found'));
        });
    });

    /**
     * Check if a user is a member
     * restriction: only owner and members can access this information
     */
    app.get('/api/rooms/:owner/:room/members/:user', function(req, res) {
        res.json({});
    });

    /**
     * Add user as a member
     * restriction: only owners can do this
     */
    app.put('/api/rooms/:owner/:room/members/:user', function(req, res) {
        res.json({});
    });

    /**
     * Remove user as a member
     * restriction: only owners can do this
     */
    app.del('/api/rooms/:owner/:room/members/:user', function(req, res) {
        res.json({});
    });

    /**
     * List messages for a room
     */
    app.get('/api/rooms/:owner/:room/messages', function(req, res) {
        res.json({});
    });

    /**
     * Get a single message
     */
    app.get('/api/rooms/:owner/:room/messages/:number', function(req, res) {
        res.json({});
    });

    /**
     * Create an message
     */
    app.post('/api/rooms/:owner/:room/messages', function(req, res) {
        res.json({});
    });

    /**
     * Edit an message
     */
    app.patch('/api/rooms/:owner/:room/messages/:number', function(req, res) {
        res.json({});
    });

};

// Expose routes
module.exports = routes;