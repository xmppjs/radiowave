'use strict';

var util = require('util'),
    Authenticator = require('./Authenticator'),
    Promise = require('bluebird'),
    JID = require('node-xmpp-core').JID,
    superagent = require('superagent'),
    logger = require('../core/Logger')('authentication');

/**
 * Server-side implementation of Oauth-2
 */
function OAUTH2(settings) {
    this.settings = settings;
    this.url = settings.url;
    this.contentType = settings.contentType || 'application/json';
    this.tokenType = settings.tokenType ||  'Bearer';
    this.uidTag = settings.uidTag ||  'login';

}
util.inherits(OAUTH2, Authenticator);

OAUTH2.prototype.name = 'OAUTH2';

OAUTH2.prototype.match = function (method) {
    if (method === 'X-OAUTH2') {
        return true;
    }
    return false;
};

OAUTH2.prototype.verifyToken = function (username, oauthToken, cb) {
    var self = this;

    logger.debug('oauth2 call: ' + this.settings.url);

    // load user details
    superagent
        .get(self.url)
        .send({})
        .set('content-type', self.contentType)
        .set('Authorization', self.tokenType + ' ' + oauthToken)
        .end(function (error, res) {
            if (error ||  res.status !== 200) {
                logger.error(error);
                cb('oauth authentication failed');
            } else {
                // we know the token is valid
                // verify it against a username
                var usr = self.verifyUser(username, res.body);
                // var usr = res.body;

                cb(null, usr);
            }
        });
};

/** 
 * @param username username that was submitted
 * @param user user object we got from token verification
 * @returns null, if user does not match username, otherwise the userobject
 */
OAUTH2.prototype.verifyUser = function (username, content) {
    logger.debug('verify user: ' + username + ' -> ' + content[this.uidTag]);

    logger.debug(username);

    function compareUser(username1, username2) {
        if (!username1 ||  !username2) {
            return false;
        }
        try {
            return username1.toString().toLowerCase() === username2.toString().toLowerCase();
        } catch (err) {
            return false;
        }
    }

    // if we use xmpp, we verify the jid against the username
    if (username && compareUser(content[this.uidTag], username)) {
        logger.debug('usernames fit');
        content.username = username;
        return content;
    } // for api request we have only a token, but thats enough
    else if (!username && content[this.uidTag]) {
        logger.debug('no username');
        content.username = content[this.uidTag];
        return content;
    } else {
        logger.debug('verify user else');
        return null;
    }
};

OAUTH2.prototype.authenticate = function (opts) {

    var username = null;

    // generate ldap username 
    if (opts.jid) {
        logger.debug(username);
        username = new JID(opts.jid.toString(), false).getLocal(true);
    } else if (opts.username) {
        username = opts.username;
    }

    opts.username = username;

    var self = this;
    return new Promise(function (resolve, reject) {
        logger.info("OAUTH2 authenticate ", opts.oauth_token);
        self.verifyToken(opts.username, opts.oauth_token, function (err, user) {
            // error
            if (err) {
                reject('OAUTH2 could not authenticate user: ' + opts.username);
            }
            // token does not match username
            else if (user === null) {
                reject('OAUTH2 could not authenticate user: ' + opts.username);
            }
            // everything is okay
            else {
                logger.debug('OAUTH2: token ' + opts.oauth_token + ' is valid ' + JSON.stringify(user));
                resolve(user);
            }
        });
    });
};

module.exports = OAUTH2;