'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('webapi'),
    JID = require('node-xmpp-core').JID,
    ApiError = require('../utils/ApiError'),
    ApiUtils = require('../utils/ApiUtils');

var UserManager = require('../lib/User');

var routes = function (app, storage, settings) {

    logger.info('register room routes');

    var domain = settings.get('domain');
    var usrManager = new UserManager(storage);

    /**
     * Get room
     * restriction: only owner and members can access this information
     */
    app.get('/api/rooms/:owner/:room', function (req, res) {

        // requester, should be member of the room
        var jid = ApiUtils.getJID(req);

        var username = req.params.owner;
        var roomname = req.params.room;

        logger.debug('Get room: ' +  username + '/' + roomname);

        var ownerjid = new JID(username + '@' + domain);

        var usr = null;
        var r = null;
        usrManager.findUser(jid.toString()).then(function (user) {
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
        var username = req.params.owner;
        var roomname = req.params.room;

        logger.debug('Delete room: ' +  username + '/' + roomname);

        // requester, should be member of the room
        var jid = ApiUtils.getJID(req);
        var ownerjid = new JID(username + '@' + domain);

        // verify that owner and requestor are the same
        if (!ownerjid.equals(jid)) {
            res.send(404);
            return;
        }

        // since only owner can delete rooms, we try to delete the room directly
        usrManager.findUser(jid.toString()).then(function (user) {
            return usrManager.getRoom(user, roomname);
        }).then(function(room) {
            return usrManager.delRoom(room);
        }).then(function() {
            res.send(204);
        }).catch(function(err) {
            console.error(err);
            logger.error(err);
            res.json(404, new ApiError('not found'));
        });
    });

    /**
     * List members
     * restriction: only owner and members can access this information
     */
    app.get('/api/rooms/:owner/:room/members', function(req, res) {

        // extract parameter
        var username = req.params.owner;
        var roomname = req.params.room;

        logger.debug('Get room: ' +  username + '/' + roomname);

        // requester, should be member of the room
        var jid = ApiUtils.getJID(req);
        var ownerjid = new JID(username + '@' + domain);

        var usr = null;
        var r = null;
        usrManager.findUser(jid.toString()).then(function (user) {
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
            res.json(ApiUtils.exportJSON(members));
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
    
        // extract parameter
        var username = req.params.owner;
        var roomname = req.params.room;
        var membername = req.params.user;

        logger.debug('Get room: ' +  username + '/' + roomname);

        // requester, should be member of the room
        var jid = ApiUtils.getJID(req);

        // owner of the room
        var ownerjid = new JID(username + '@' + domain);

        // check if this user is member of the room
        var memberjid = new JID(membername);

        var usr = null;
        var r = null;
        var mem = null;

        // check if the "member" is a known user
        usrManager.findUser(memberjid.toString()).then(function(member){
            mem = member;
            // check if the requestor is a known user
            return usrManager.findUser(jid.toString());
        }).then(function (user) {
            usr = user;
            // check if the owner of the room is a known user
            return usrManager.findUser(ownerjid.toString());
        }).then(function(owner){
            // check if the owner has such room
            return usrManager.getRoom(owner, roomname);
        }).then(function(room) {
            r = room;
            // check if the requestor is member of the room
            return room.isMember(usr);
        }).then(function() {
            // check if the requested member is really a member of the room
            return r.isMember(mem);
        }).then(function() {
            res.send(204);
        }).catch(function(err) {
            console.error(err);
            logger.error(err);
            res.send(404);
        });
    });

    /**
     * Add user as a member
     * restriction: only owners can do this
     */
    app.put('/api/rooms/:owner/:room/members/:user', function(req, res) {
        // extract parameter
        var username = req.params.owner;
        var roomname = req.params.room;
        var membername = req.params.user;

        logger.debug('Add member to room: ' +  username + '/' + roomname);

        // requester, should be member of the room
        var jid = ApiUtils.getJID(req);

        // owner of the room
        var ownerjid = new JID(username + '@' + domain);

        // check if this user is member of the room
        var memberjid = new JID(membername);

        // verify that owner and requestor are the same
        if (!ownerjid.equals(jid)) {
            res.send(404);
            return;
        }

        var mem;

        // check if the "member" is a known user
        usrManager.findUser(memberjid.toString()).then(function(member){
            mem = member;
            // check if the requestor is a known user
            return usrManager.findUser(jid.toString());
        }).then(function(owner){
            // check if the owner has such room
            return usrManager.getRoom(owner, roomname);
        }).then(function(room) {
            console.log('add');
            // add member to room
            return usrManager.addMember(room, mem);
        }).then(function() {
            res.send(204);
        }).catch(function(err) {
            console.error(err);
            logger.error(err);
            res.send(404);
        });
    });

    /**
     * Remove user as a member
     * restriction: only owners can do this
     */
    app.del('/api/rooms/:owner/:room/members/:user', function(req, res) {
        // extract parameter
        var username = req.params.owner;
        var roomname = req.params.room;
        var membername = req.params.user;

        logger.debug('Delete member from room: ' +  username + '/' + roomname);

        // requester, should be member of the room
        var jid = ApiUtils.getJID(req);

        // owner of the room
        var ownerjid = new JID(username + '@' + domain);

        // check if this user is member of the room
        var memberjid = new JID(membername);

        // verify that owner and requestor are the same
        if (!ownerjid.equals(jid)) {
            res.send(400);
            return;
        }

        // owner cannot remove owner
        console.log('OWNER: ' + ownerjid.toString());
        console.log('MEMBER: ' + memberjid.toString());

        if (ownerjid.equals(memberjid)) {
            res.send(400);
            return;
        }

        var mem;

        // check if the "member" is a known user
        usrManager.findUser(memberjid.toString()).then(function(member){
            mem = member;
            // check if the requestor is a known user
            return usrManager.findUser(jid.toString());
        }).then(function(owner){
            // check if the owner has such room
            return usrManager.getRoom(owner, roomname);
        }).then(function(room) {
            // add member to room
            return usrManager.removeMember(room, mem);
        }).then(function() {
            res.send(204);
        }).catch(function(err) {
            console.error(err);
            logger.error(err);
            res.send(404);
        });
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