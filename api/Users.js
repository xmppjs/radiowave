'use strict';

var RSVP = require('rsvp'),
    ApiError = require('./utils/ApiError'),
    winston = require('winston'),
    logger = winston.loggers.get('webapi');

var roomToJson = require('./utils/roomToJson');

var routes = function (app, Users) {

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
                    RSVP.all(promises).then(function () {
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
                    RSVP.all(promises).then(function () {
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
                RSVP.all(roomPromisses).then(function (contentRooms) {

                    var data = [];
                    contentRooms.forEach(function (ro) {
                        data.push(roomToJson(ro));
                    });
                    console.log(JSON.stringify(data));
                    res.json(data);
                }).catch (function (reason) {
                    res.json(new ApiError(reason));
                });
            },
            function (error) {
                res.json(new ApiError(error));
            });
    });

    /**
     * Create a new rooms for the authenticated user.
     * {
     *    "name" : "room_name"
     * }
     *
     */
    app.post('/api/user/rooms', function (req, res) {
        var username = getUsername(req);
        var data = req.body;

        // TODO check that all required parameters are properly set

        Users.user(username).then(
            function (user) {
                return user.createRoom(data.name);
            }).then(
            function (room) {
                res.json(room);
            },
            function (error) {
                res.json(new ApiError(error));
            });
    });
};

// Expose routes
module.exports = routes;