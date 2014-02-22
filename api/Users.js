'use strict';

var Promise = require('bluebird'),
    ApiError = require('./utils/ApiError'),
    winston = require('winston'),
    logger = winston.loggers.get('webapi');

var roomToJson = require('./utils/roomToJson');

var routes = function (app, storage) {
    var Users = storage.users;

    // need to be a registered user in xmpp
    var userDetail = {
        'login': 'romeo',
        'id': 1,
        'type': 'User',
        'name': 'Romeo Montague',
        'company': 'xRocket Inc.'
    };

    function getUsername(req) {
        return req.user.login;
    }

    /**
     * Get the authenticated user
     */
    app.get('/api/user', function (req, res) {
        res.json(userDetail);
    });

    /**
     * Get a single user
     */
    app.get('/api/users/:user', function (req, res) {
        var username = getUsername(req);
        if (username === 'romeo') {
            res.json(userDetail);
        } else {
            res.json(new ApiError('user does not exist'));
        }

    });

    /**
     * List email addresses for a user
     * Current format:
     * ["romeo@example.com"]
     *
     */
    app.get('/api/user/emails', function (req, res) {
        var username = getUsername(req);

        Users.user(username).then(
            function (user) {
                // list all emails
                return user.listEmails();
            }
        ).then(function (emails) {
            res.json(emails);
        }, function (error) {
            res.json(new ApiError(error));
        });
    });

    /**
     * Add email address
     * ["romoe@example.com"]
     */
    app.post('/api/user/emails', function (req, res) {
        var username = getUsername(req);
        var data = req.body;

        // check if we have an array
        if (data instanceof Array) {

            Users.user(username).then(
                function (user) {
                    var promises = [];
                    // iterate over emails
                    for (var i = 0, l = data.length; i < l; i++) {
                        var email = data[i];
                        var promise = user.addEmail(email);
                        promises.push(promise);
                    }

                    // wait until all emails are set
                    Promise.all(promises).then(function () {
                        res.send(200);
                    }, function () {
                        res.json(new ApiError('email(s) cound not be stored'));
                    });
                },
                function (error) {
                    res.json(new ApiError(error));
                });

        } else {
            res.json(new ApiError('wrong input format'));
        }
    });

    /**
     * Delete email address
     * ["romoe@example.com"]
     */
    app.del('/api/user/emails', function (req, res) {
        var username = getUsername(req);
        var data = req.body;

        // check if we have an array
        if (data instanceof Array) {

            Users.user(username).then(
                function (user) {
                    var promises = [];
                    // iterate over emails
                    for (var i = 0, l = data.length; i < l; i++) {
                        var email = data[i];
                        var promise = user.removeEmail(email);
                        promises.push(promise);
                    }

                    // wait until all emails are set
                    Promise.all(promises).then(function () {
                        res.send(200);
                    }, function () {
                        res.json(new ApiError('email(s) cound not be stored'));
                    });
                },
                function (error) {
                    res.json(new ApiError(error));
                });

        } else {
            res.json(new ApiError('wrong input format'));
        }
    });


    /**
     * List rooms for the authenticated user.
     */
    app.get('/api/user/rooms', function (req, res) {
        var username = getUsername(req);
        var usr = null;

        Users.user(username).then(
            function (user) {
                usr = user;
                return user.listRooms();
            }).then(
            function (rooms) {
                console.log(JSON.stringify(rooms));
                
                // iterate over rooms and generate json
                var roomPromisses = rooms.map(function (roomname) {
                    console.log(roomname);
                    console.log(usr);
                    return usr.getRoom(roomname);
                });


                console.log('wait for response');
                Promise.all(roomPromisses).then(function (contentRooms) {

                    var data = [];
                    contentRooms.forEach(function (ro) {
                        data.push(roomToJson(ro));
                    });
                    console.log(JSON.stringify(data));
                    res.json(data);
                }).catch (function (reason) {
                    res.json(new ApiError(reason));
                });
            }).catch(
            function (error) {
                res.json(new ApiError(error));
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

        Users.user(username).then(
            function (user) {
                logger.debug('create room');
                return user.createRoom(data.name);
            }).then(
            function (room) {
                logger.debug('got room');
                res.json(room);
            }).catch(
            function (error) {
                res.json(new ApiError(error));
            });
    });

    /**
     * List channels for the authenticated user.
     */
    app.get('/api/user/channels', function (req, res) {
        var username = getUsername(req);
        var usr = null;

        Users.user(username).then(
            function (user) {
                usr = user;
                return user.listChannels();
            }).then(
            function (channels) {
                console.log(JSON.stringify(channels));
                
                // iterate over rooms and generate json
                var channelPromisses = channels.map(function (roomname) {
                    console.log(roomname);
                    console.log(usr);
                    return usr.getChannel(roomname);
                });

                console.log('wait for response');
                Promise.all(channelPromisses).then(function (contentChannel) {
                    console.log('raw' + JSON.stringify(contentChannel));

                    var data = [];
                    contentChannel.forEach(function (ch) {
                        data.push(ch.toJSON());
                    });
                    res.json(data);
                }).catch (function (reason) {
                    res.json(new ApiError(reason));
                });
            },
            function (error) {
                res.json(new ApiError(error));
            });
    });

    app.post('/api/user/channels', function (req, res) {
        var username = getUsername(req);
        var data = req.body;

        // check that all required parameters are properly set
        if (!data || !data.name || data.name === '' || data.name === null) {
            res.json(new ApiError('name is missing'));
        }

        Users.user(username).then(
            function (user) {
                return user.createChannel(data.name);
            }).then(
            function (room) {
                res.json(room);
            }).catch(
            function (error) {
                res.json(new ApiError(error));
            });
    });
};

// Expose routes
module.exports = routes;