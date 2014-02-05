'use strict';

var util = require('util'),
    Authenticator = require('./Authenticator'),
    JID = require('node-xmpp-core').JID,
    ldap = require('ldapjs'),
    Promise = require('bluebird'),
    winston = require('winston'),
    logger = winston.loggers.get('authentication');

function LDAP(settings) {
    this.settings = settings || {};

    // LDAP settings
    this.suffix = settings.suffix;
    this.uidTag = settings.uidTag;

    // LDAP client
    this.client = ldap.createClient({
        url: settings.url,
        maxConnections: 5
    });
}
util.inherits(LDAP, Authenticator);

LDAP.prototype.name = 'LDAP';

LDAP.prototype.match = function (method) {
    if (method === 'PLAIN') {
        return true;
    } else {
        return false;
    }
};

LDAP.prototype.authenticateWithLDAP = function (username, password, callback) {
    return new Promise(function (resolve, reject) {
        // check that we got username and password
        if (!username || !password) {
            return callback(new Error('parameters are missing'));
        }

        // generate unix ldap like user name
        var uid = this.uidTag + '=' + username + ',' + this.suffix;

        // bind for authentication
        this.client.bind(uid, password, function (err) {
            // error
            if (err) {
                logger.error(err);
                reject(err);
            } else {
                resolve({
                    uid: uid
                });
            }
        });
    });
};

LDAP.prototype.authenticate = function (opts) {

    var username = null;

    // generate ldap username 
    if (opts.jid) {
        username = new JID(opts.jid.toString()).getLocal();
    } else if (opts.username) {
        username = opts.username;
    }

    logger.info('LDAP authenticate ' + opts.jid.toString());

    // authenticate with LDAP bind
    return this.authenticateWithLDAP(username, opts.password);

};

module.exports = LDAP;