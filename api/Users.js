'use strict';

var RSVP = require('rsvp'),
    ApiError = require('./utils/ApiError'),
    winston = require('winston'),
    logger = winston.loggers.get('webapi');

var routes = function (app, Users) {

    // need to be a registered user in xmpp
    var user = {
        'login': 'romeo',
        'id': 1,
        'type': 'User',
        'name': 'Romeo Montague',
        'company': 'xRocket Inc.'
    };

    /**
     * Get the authenticated user
     */
    app.get('/api/user', function (req, res) {
        res.json(user);
    });

    /**
     * Get a single user
     */
    app.get('/api/users/:user', function (req, res) {
        var username = req.params.user;
        if (username === 'romeo') {
            res.json(user);
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
        var username = 'romeo';

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
        var username = 'romeo';
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
        var username = 'romeo';
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
        res.json({});
    });

    /**
     * Create a new rooms for the authenticated user.
     * {
     *    "name" : "room_name"
     * }
     *
     */
    app.post('/api/user/rooms', function (req, res) {
        var username = 'romeo';
        var data = req.body;

        // TODO check that all required parameters are properly set

        Users.user(username).then(
            function (user) {
                return user.createRoom(data.name);
            }).then(
            function(room) {
                res.json(room);
            },
            function (error) {
                res.json(new ApiError(error));
            });
    });

};

// Expose routes
module.exports = routes;