'use strict';

var winston = require('winston'),
    express = require('express'),
    logger = winston.loggers.get('webapi');

var routes = function () {
    logger.info('register public routes');

    var publicapi = express.Router();

    /**
     * List all public rooms
     */
    publicapi.get('/rooms', function (req, res) {
        res.json({});
    });

    /**
     * List public rooms for the specified user.
     */
    publicapi.get('/users/:user/rooms', function (req, res) {
        res.json({});
    });

    return publicapi;

};

// Expose routes
module.exports = routes;