'use strict';

var express = require('express'),
    logger = require('../../core/Logger')('webapi'),
    JID = require('node-xmpp-core').JID,
    ApiError = require('../utils/ApiError'),
    ApiUtils = require('../utils/ApiUtils');

var routes = function (storage, settings) {

    logger.info('register room routes');

    var roomapi = express.Router();

    var domain = settings.get('domain');

    /**
     * Get room
     * restriction: only owner and members can access this information
     */
    roomapi.get('/rooms/:owner/:room', function (req, res) {

        // requester, should be member of the room
        var jid = ApiUtils.getJID(req);

        var username = req.params.owner;
        var roomname = req.params.room;

        logger.debug('Get room: ' +  username + '/' + roomname);

        var ownerjid = new JID(username + '@' + domain);

        var usr = null;
        var r = null;
        storage.findUser(jid.toString()).then(function (user) {
            usr = user;
            return storage.findUser(ownerjid.toString());
        }).then(function(owner){
            return storage.getRoom(owner, roomname);
        }).then(function(room) {
            r = room;
            return room.isMember(usr);
        }).then(function() {
            res.json(r);
        }).catch(function(err) {
            logger.error(err);
            res.json(404, new ApiError('not found'));
        });
    });

    /**
     * Edit room
     * restriction: only owner and members can access this information
     */
    roomapi.patch('/rooms/:owner/:room', function (req, res) {
        res.json(404, new ApiError('not found'));
    });

    /**
     * Delete a room (requires admin access)
     * restriction: only owner can do this
     */
    roomapi.delete('/rooms/:owner/:room', function (req, res) {
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
        storage.findUser(jid.toString()).then(function (user) {
            return storage.getRoom(user, roomname);
        }).then(function(room) {
            return storage.delRoom(room);
        }).then(function() {
            res.send(204);
        }).catch(function(err) {
            logger.error(err);
            res.json(404, new ApiError('not found'));
        });
    });

    /**
     * List members
     * restriction: only owner and members can access this information
     */
    roomapi.get('/rooms/:owner/:room/members', function(req, res) {

        // extract parameter
        var username = req.params.owner;
        var roomname = req.params.room;

        logger.debug('Get room: ' +  username + '/' + roomname);

        // requester, should be member of the room
        var jid = ApiUtils.getJID(req);
        var ownerjid = new JID(username + '@' + domain);

        var usr = null;
        var r = null;
        storage.findUser(jid.toString()).then(function (user) {
            usr = user;
            return storage.findUser(ownerjid.toString());
        }).then(function(owner){
            return storage.getRoom(owner, roomname);
        }).then(function(room) {
            r = room;
            return room.isMember(usr);
        }).then(function() {
            return r.getMembers();
        }).then(function(members) {
            res.json(ApiUtils.exportJSON(members));
        }).catch(function(err) {
            logger.error(err);
            res.json(404, new ApiError('not found'));
        });
    });

    /**
     * Check if a user is a member
     * restriction: only owner and members can access this information
     */
    roomapi.get('/rooms/:owner/:room/members/:user', function(req, res) {
    
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
        storage.findUser(memberjid.toString()).then(function(member){
            mem = member;
            // check if the requestor is a known user
            return storage.findUser(jid.toString());
        }).then(function (user) {
            usr = user;
            // check if the owner of the room is a known user
            return storage.findUser(ownerjid.toString());
        }).then(function(owner){
            // check if the owner has such room
            return storage.getRoom(owner, roomname);
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
            logger.error(err);
            res.send(404);
        });
    });

    /**
     * Add user as a member
     * restriction: only owners can do this
     */
    roomapi.put('/rooms/:owner/:room/members/:user', function(req, res) {
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

        var own;
        var mem;
        var r;

        storage.findUser(jid.toString()).then(function(owner){
            own = owner;
            // check if the owner has such room
            return storage.getRoom(owner, roomname);
        }).then(function(room) {
            r = room;
            // find member
            return storage.findOrCreateUser(memberjid.toString());
        }).then(function(member){
            mem = member;
            // add member to room
            return storage.inviteMember({
                room: r,
                invitee: mem,
                inviter: own,
                reason: null
            });
        }).then(function() {
            res.send(204);
        }).catch(function(err) {
            logger.error(err);
            res.send(404);
        });
    });

    /**
     * Remove user as a member
     * restriction: only owners can do this
     */
    roomapi.delete('/rooms/:owner/:room/members/:user', function(req, res) {
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
        logger.debug('OWNER: ' + ownerjid.toString());
        logger.debug('MEMBER: ' + memberjid.toString());

        if (ownerjid.equals(memberjid)) {
            res.send(400);
            return;
        }

        var mem;

        // check if the "member" is a known user
        storage.findUser(memberjid.toString()).then(function(member){
            mem = member;
            // check if the requestor is a known user
            return storage.findUser(jid.toString());
        }).then(function(owner){
            // check if the owner has such room
            return storage.getRoom(owner, roomname);
        }).then(function(room) {
            // add member to room
            return storage.removeMember(room, mem);
        }).then(function() {
            res.send(204);
        }).catch(function(err) {
            logger.error(err);
            res.send(404);
        });
    });

    /**
     * List messages for a room
     */
    roomapi.get('/rooms/:owner/:room/messages', function(req, res) {

        // extract parameter
        var username = req.params.owner;
        var roomname = req.params.room;

        logger.debug('Get room: ' +  username + '/' + roomname);

        // requester, should be member of the room
        var jid = ApiUtils.getJID(req);
        var ownerjid = new JID(username + '@' + domain);

        var usr = null;
        var r = null;
        storage.findUser(jid.toString()).then(function (user) {
            usr = user;
            return storage.findUser(ownerjid.toString());
        }).then(function(owner){
            return storage.getRoom(owner, roomname);
        }).then(function(room) {
            r = room;
            return room.isMember(usr);
        }).then(function() {
            return r.getMessages();
        }).then(function(messages) {
            res.json(messages);
        }).catch(function(err) {
            logger.error(err);
            res.json(404, new ApiError('not found'));
        });
    });

    /**
     * Get a single message
     */
    roomapi.get('/rooms/:owner/:room/messages/:number', function(req, res) {
        res.json({});
    });

    /**
     * Create an message
     */
    roomapi.post('/rooms/:owner/:room/messages', function(req, res) {
        res.json({});
    });

    /**
     * Edit an message
     */
    roomapi.patch('/rooms/:owner/:room/messages/:number', function(req, res) {
        res.json({});
    });

    return roomapi;
};

// Expose routes
module.exports = routes;