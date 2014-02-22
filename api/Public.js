'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('webapi');

var routes = function (app) {
    logger.info('register public routes');

    /**
     * List all public rooms
     */
    app.get('/api/rooms', function (req, res) {
        res.json({});
    });

    /**
     * List public rooms for the specified user.
     */
    app.get('/api/users/:user/rooms', function (req, res) {
        res.json({});
    });

};

// Expose routes
module.exports = routes;