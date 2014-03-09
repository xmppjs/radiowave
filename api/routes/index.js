'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('webapi');

// other routes
var User = require('./User'),
    Orgs = require('./Orgs'),
    Room = require('./Room'),
    Channel = require('./Channel'),
    Public = require ('./Public');

var routes = function (app, storage, settings) {
    logger.info('register routes');

    // register additional routes
    User(app, storage, settings);
    Orgs(app, storage, settings);
    Room(app, storage, settings);
    Channel(app, storage, settings);
    Public(app, storage, settings);

};

// Expose routes
module.exports = routes;