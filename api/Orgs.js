'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('webapi');

var routes = function (app, Users) {
    logger.info('register orgs routes');

    /**
     * List organization rooms
     */
    app.get('/api/orgs/:org/rooms', function (req, res) {
        res.json({});
    });


    /**
     * Create a new rooms in this organization.
     */
    app.post('/api/orgs/:org/rooms', function (req, res) {
        res.json({});
    });
};

// Expose routes
module.exports = routes;