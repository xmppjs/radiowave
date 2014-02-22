'use strict';

var ApiError = require('./utils/ApiError'),
    winston = require('winston'),
    logger = winston.loggers.get('webapi');

var routes = function(app, storage) {
    logger.info('register channel routes');
    var Users = storage.users;

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
        
        Users.user(username).then(
            function (user) {
                return user.getChannel(channelname);
            }).then(
            function (channel) {
                // logger.debug('got channel' + JSON.stringify(channel));
                logger.debug('got channel : ' + channelname);
                res.json(channel);
            },
            function (error) {
                res.json(404, new ApiError(error));
            });
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