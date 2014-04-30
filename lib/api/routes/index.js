'use strict';

var logger = require('../../core/Logger')('webapi');

// other routes
var userapi = require('./User'),
    orgsapi = require('./Orgs'),
    roomapi = require('./Room'),
    channelapi = require('./Channel'),
    publicapi = require ('./public');

var routes = function (storage, settings) {
    logger.info('register routes');

    return {
        user : userapi(storage, settings),
        orgs : orgsapi(storage, settings),
        room : roomapi(storage, settings),
        channel : channelapi(storage, settings),
        pub : publicapi(storage, settings)
    };
};

// Expose routes
module.exports = routes;