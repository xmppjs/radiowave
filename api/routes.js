'use strict';

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

var routes = function (app, Users) {

    // register additional routes
    publicRoutes(app, Users);
    users(app, Users);
    orgs(app, Users);
    room(app, Users);
    roomMessages(app, Users);
    roomMembers(app, Users);
    roomHooks(app, Users);
    channel(app, Users);
    channelEvents(app, Users);
    channelSubscribers(app, Users);

};

// Expose routes
module.exports = routes;