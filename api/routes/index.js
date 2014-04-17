'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('webapi');

// other routes
var User = require('./User'),
    Orgs = require('./Orgs'),
    Room = require('./Room'),
    Channel = require('./Channel'),
    Public = require ('./public');

var routes = function (app, storage, settings) {
    logger.info('register routes');

    // register additional routes
    var usr = User(storage, settings);
    var orgs = Orgs(storage, settings);
    var room = Room(storage, settings);
    var channel = Channel(storage, settings);
    var pub = Public(storage, settings);

    // call our router we just created
    app.use('/api', usr);
    app.use('/api', orgs);
    app.use('/api', room);
    app.use('/api', channel);
    app.use('/api', pub);
};

// Expose routes
module.exports = routes;