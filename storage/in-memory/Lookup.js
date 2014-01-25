'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('storage');

var Promise = require('bluebird');

/**
 * This lookup implementations maps xmpp identifiers with our
 * storage identifiers. All data is stored with the owner.
 * This implementation helps to bridge the worlds.
 */
var Lookup = function () {
    this.lookuptable = {};
};

/**
 * Adds new entries to our lookup table
 */
Lookup.prototype.add = function(type, user, resource, xmppIdentifier) {
    logger.debug('Add xmpp: ' + xmppIdentifier + ' to lookuptable' + type + ':'+ user + ':' + resource);
    var self = this;
    var promise = new Promise(function (resolve, reject) {

        if (!self.lookuptable[type]) {
            self.lookuptable[type] = {};
        }

        // check if entry exists

        if (self.lookuptable[type][xmppIdentifier]) {
            // abort
            reject();
        } else {
            self.lookuptable[type][xmppIdentifier] = {
                'user': user,
                'resource': resource
            };
            resolve();
        }
    });
    return promise;
};

/*
 * {
 *   user: username,
 *   resource: resourcename
 * }
 */
Lookup.prototype.find = function (type, xmppIdentifier) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (self.lookuptable[type] && self.lookuptable[type][xmppIdentifier]) {
            resolve(self.lookuptable[type][xmppIdentifier]);
        } else {
            reject();
        }
    });
    return promise;
};

module.exports = Lookup;