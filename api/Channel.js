'use strict';

var ApiError = require('./utils/ApiError'),
    winston = require('winston'),
    logger = winston.loggers.get('webapi');

var routes = function(app, storage) {
    logger.info('register channel routes');

    /**
     * Create a new channels for the authenticated user.
     */
    app.post('/api/user/channels', function(req, res) {
        res.json({});
    });

    /**
     * Create a new channels in this organization.
     */
    app.post('/api/orgs/:org/channels', function(req, res) {
        res.json({});
    });

    /**
     * 
     */
    app.get('/api/channels/:owner/:channel', function(req, res) {
        var username = req.params.owner;
        var channelname = req.params.channel;

        logger.debug('Get channel: ' +  username + '/' + channelname);
        
        res.json({});
    });

    /**
     * Edit channel
     */
    app.patch('/api/channels/:owner/:channel', function(req, res) {
        res.json({});
    });

    /**
     * Delete a channel (requires admin access)
     */
    app.del('/api/channels/:owner/:channel', function(req, res) {
        res.json({});
    });
};

// Expose routes
module.exports = routes;