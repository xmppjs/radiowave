'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('webapi');

var routes = function(app) {
    logger.info('register room hooks routes');

    /**
     * List hooks
     */
    app.get('/api/rooms/:owner/:room/hooks', function(req, res) {
        res.json({});
    });

    /**
     * Create a hook
     */
    app.post('/api/rooms/:owner/:room/hooks', function(req, res) {
        res.json({});
    });

    /**
     * Edit a hook
     */
    app.patch('/api/rooms/:owner/:room/hooks/:id', function(req, res) {
        res.json({});
    });

    /**
     * Delete a hook
     */
    app.del('/api/rooms/:owner/:room/hooks/:id', function(req, res) {
        res.json({});
    });

};

// Expose routes
module.exports = routes;