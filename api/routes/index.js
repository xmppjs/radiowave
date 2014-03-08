'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('webapi');

// other routes
var User = require('./User'),
    Orgs = require('./Orgs'),
    Room = require('./Room'),
    RoomMembers = require('./RoomMembers'),
    RoomMessages = require('./RoomMessages'),
    Channel = require('./Channel'),
    ChannelEvents = require('./ChannelEvents'),
    ChannelSubs = require('./ChannelSubs'),
    Public = require ('./Public');

var routes = function (app, storage) {
    logger.info('register routes');

    // register additional routes
    User(app, storage);
    Orgs(app, storage);
    Room(app, storage);
    RoomMembers(app, storage);
    RoomMessages(app, storage);
    Channel(app, storage);
    ChannelEvents(app, storage);
    ChannelSubs(app, storage);
    Public(app, storage);

};

// Expose routes
module.exports = routes;