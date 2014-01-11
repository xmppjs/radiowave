'use strict';

var JID = require('node-xmpp-core').JID,
    ldap = require('ldapjs'),
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

LDAP.prototype.name = 'LDAP';

LDAP.prototype.match = function (method) {
    if (method === 'PLAIN') {
        return true;
    } else {
        return false;
    }
};

LDAP.prototype.authenticateWithLDAP = function (username, password, callback) {
    // check that we got username and password
    if (!username || !password) {
        return callback(new Error("parameters are missing"));
    }

    // generate unix ldap like user name
    var uid = this.uidTag + '=' + username + ',' + this.suffix;

    // bind for authentication
    this.client.bind(uid, password, function (err) {
        // error
        if (err) {
            return callback(err);
        }

        callback(null, {
            uid: uid
        });
    });
};

LDAP.prototype.authenticate = function (opts, cb) {
    // generate ldap username 
    var username = new JID(opts.jid.toString()).getLocal();
    logger.info('LDAP authenticate ' + opts.jid.toString());

    // authenticate with LDAP bind
    this.authenticateWithLDAP(username, opts.password, function (err, user) {
        if (err) {
            logger.error('Error with user ' + user + '. We got the following error: ' + err);
        }
        cb(err, opts);
    });
};

module.exports = LDAP;