'use strict';

var util = require('util'),
    Authenticator = require('./Authenticator'),
    JID = require('node-xmpp-core').JID,
    Promise = require('bluebird'),
    logger = require('../core/Logger')('authentication');

/**
 * ATTENTION: This implementation is intended for development and testing.
 * It is not intended for use in production.
 */
function Simple() {
    this.users = {};
}
util.inherits(Simple, Authenticator);

Simple.prototype.name = 'Simple';

Simple.prototype.addUser = function (username, password) {
    this.users[username] = password;
};

Simple.prototype.match = function (method) {
    if (method === 'PLAIN') {
        return true;
    }
    return false;
};

Simple.prototype.authenticate = function (opts) {
    logger.debug('authenticate ');
    var self = this;

    return new Promise(function (resolve, reject) {
        
        var username = null;

        // extract username 
        if (opts.jid) {
            username = new JID(opts.jid.toString()).getLocal();
        } else if (opts.username) {
            username = opts.username;
        }

        // user is authenticated
        if (self.users[username] === opts.password) {
            logger.debug(username + ' has successfully authenticated');
            delete opts.password;
            resolve(opts);
        }
        // error
        else {
            delete opts.password;
            reject('user not found');
        }
    });
};

module.exports = Simple;