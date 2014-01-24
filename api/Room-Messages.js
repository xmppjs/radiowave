'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('webapi');

var routes = function(app) {
    logger.info('register room messages routes');

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