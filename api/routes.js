'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('webapi');

// other routes
var channel = require('./Channel'),
    channelEvents = require('./Channel-Events'),
    channelSubscribers = require('./Channel-Subscribers'),
    room = require('./Room'),
    roomMembers = require('./Room-Members'),
    roomMessages = require('./Room-Messages'),
    roomHooks = require('./Room-Hooks'),
    users = require('./Users'),
    orgs = require('./Orgs'),
    publicRoutes = require ('./Public');

var routes = function (app, storage) {
    logger.info('register routes');

    // register additional routes
    publicRoutes(app, storage);
    users(app, storage);
    orgs(app, storage);
    room(app, storage);
    roomMessages(app, storage);
    roomMembers(app, storage);
    roomHooks(app, storage);
    channel(app, storage);
    channelEvents(app, storage);
    channelSubscribers(app, storage);
};

// Expose routes
module.exports = routes;