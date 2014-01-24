'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('webapi');

var routes = function(app) {
    logger.info('register channel events routes');

    /**
     * trigger an event
     */
    app.post('/api/channels/:owner/:channel/messages', function(req, res) {
        res.json({});
    });

    /**
     * List events for a channel
     */
    app.get('/api/channels/:owner/:channel/messages', function(req, res) {
        res.json({});
    });

};

// Expose routes
module.exports = routes;