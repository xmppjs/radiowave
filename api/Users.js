'use strict';

var Promise = require('bluebird'),
    ApiError = require('./utils/ApiError'),
    winston = require('winston'),
    logger = winston.loggers.get('webapi');

var roomToJson = require('./utils/roomToJson');

var routes = function (app, storage) {

    function getUsername(req) {
        return req.user.username;
    }

    /**
     * Get the authenticated user
     */
    app.get('/api/user', function (req, res) {
        res.json({});
    });

    /**
     * Get a single user
     */
    app.get('/api/users/:user', function (req, res) {
        var username = getUsername(req);
        res.json({});
    });

    /**
     * List rooms for the authenticated user.
     */
    app.get('/api/user/rooms', function (req, res) {
        var username = getUsername(req);
        var usr = null;

        var type = req.query.type; // all, owner, member.
        type  = type || 'all';

        var affiliation = [];
        switch (type) {
            case 'owner' : 
                affiliation.push(storage.RoomMembers.Affiliation.Owner);
            break;
            case 'member' : 
                affiliation.push(storage.RoomMembers.Affiliation.Member);
            break;
            default : // all 
                affiliation.push(storage.RoomMembers.Affiliation.Owner);
                affiliation.push(storage.RoomMembers.Affiliation.Member);
            break;
        }

        console.log(JSON.stringify(req.user));

        var jid = username + '@example.net';
        console.log(jid);

        storage.User.find({
            where: {
                jid: jid
            }
        }).success(function(user){

            if (user) {
                // Owner as default affiliation
                user.getRooms({
                    where: {
                        affiliation: affiliation
                    }
                }).success(function (ownerRooms) {
                    res.json(ownerRooms);
                }).error(function(){
                    res.json(400, new ApiError());
                });
            } else {
                res.json(400, new ApiError());
            }
        }).error(function(){
            res.json(400, new ApiError());
        });
    });

    /**
     * Create a new rooms for the authenticated user.
     * {
     *    "name" : "room_name"
     * }
     */
    app.post('/api/user/rooms', function (req, res) {
        var username = getUsername(req);
        var data = req.body;

        // check that all required parameters are properly set
        if (!data || !data.name || data.name === '' || data.name === null) {
            res.json(new ApiError('name is missing'));
        }

        var jid = username + '@example.net';

        storage.User.find({
                where: {
                    jid: jid
                }
            }).success(function (user) {
                if (user) {
                    storage.Room.create({
                        name: data.name
                    }).success(function (room) {

                        user.addRoom(room, {
                            role: storage.RoomMembers.Role.Moderator,
                            affiliation: storage.RoomMembers.Affiliation.Owner,
                            nickname: ''
                        }).success(function () {
                            // added room as member
                            res.json(room);
                        }).error(function (err) {
                            res.json(400, new ApiError());
                        });

                    }).error(function (err) {
                        res.json(400, new ApiError('room exists'));
                    });
                } else {
                    res.json(400, new ApiError('user does not exists'));
                }

            }).error(function (err) {
                res.json(400, new ApiError());
            });
    });

    /**
     * List channels for the authenticated user.
     */
    app.get('/api/user/channels', function (req, res) {
        var username = getUsername(req);
        var usr = null;

        console.log(JSON.stringify(req.user));

        var jid = username + '@example.net';
        console.log(jid);

        storage.User.find({
            where: {
                jid: jid
            }
        }).success(function(user){

            if (user) {
                // Owner as default affiliation
                user.getChannels({
                    where: {
                        affiliation: storage.ChannelSub.Affiliation.Owner
                    }
                }).success(function (ownerChannels) {
                    res.json(ownerChannels);
                }).error(function(){
                    res.json(400, new ApiError());
                });
            } else {
                res.json(400, new ApiError());
            }
        }).error(function(){
            res.json(400, new ApiError());
        });
    });

    app.post('/api/user/channels', function (req, res) {
        var username = getUsername(req);
        var data = req.body;

        // check that all required parameters are properly set
        if (!data || !data.name || data.name === '' || data.name === null) {
            res.json(new ApiError('name is missing'));
        }

        var jid = username + '@example.net';

        storage.User.find({
                where: {
                    jid: jid
                }
            }).success(function (user) {
                if (user) {
                    storage.Channel.create({
                        name: data.name
                    }).success(function (channel) {

                        user.addChannel(channel, {
                            affiliation: storage.ChannelSub.Affiliation.Owner,
                            substate: storage.ChannelSub.SubState.Member
                        }).success(function () {
                            res.json(channel);
                        }).error(function (err) {
                            res.json(400, new ApiError());
                        });

                    }).error(function (err) {
                        res.json(400, new ApiError('channel exists'));
                    });
                } else {
                    res.json(400, new ApiError('user does not exists'));
                }

            }).error(function (err) {
                res.json(400, new ApiError());
            });
    });
};

// Expose routes
module.exports = routes;