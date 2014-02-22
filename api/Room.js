'use strict';

var ApiError = require('./utils/ApiError'),
    winston = require('winston'),
    logger = winston.loggers.get('webapi');

var roomToJson = require('./utils/roomToJson');

var routes = function (app, storage) {
    logger.info('register room routes');
    var Users = storage.users;

    /**
     * Get room
     */
    app.get('/api/rooms/:owner/:room', function (req, res) {
        var username = req.params.owner;
        var roomname = req.params.room;

        logger.debug('Get room: ' +  username + '/' + roomname);
        
        Users.user(username).then(
            function (user) {
                return user.getRoom(roomname);
            }).then(
            function (room) {
                res.json(roomToJson(room));
            },
            function (error) {
                res.json(404, new ApiError(error));
            });
    });

    /**
     * Edit room
     */
    app.patch('/api/rooms/:owner/:room', function (req, res) {
        res.json({});
    });

    /**
     * Delete a room (requires admin access)
     */
    app.del('/api/rooms/:owner/:room', function (req, res) {
        res.json({});
    });

};

// Expose routes
module.exports = routes;