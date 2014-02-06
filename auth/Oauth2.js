'use strict';

var util = require('util'),
    Authenticator = require('./Authenticator'),
    winston = require('winston'),
    Promise = require('bluebird'),
    superagent = require('superagent'),
    logger = winston.loggers.get('authentication');

/**
 * Server-side implementation of Oauth-2
 */
function OAUTH2(settings) {
    this.settings = settings;
}
util.inherits(OAUTH2, Authenticator);

OAUTH2.prototype.name = 'OAUTH2';

OAUTH2.prototype.match = function (method) {
    if (method === 'X-OAUTH2') {
        return true;
    }
    return false;
};

OAUTH2.prototype.verifyToken = function (oauthToken, cb) {
    var self = this;

    logger.debug('oauth2 call: ' + this.settings.url);

    // load user details
    superagent
        .post(this.settings.url)
        .send({})
        .set('content-type', 'application/json')
        .set('Authorization', 'Bearer ' + oauthToken)
        .end(function (error, res) {
            if (error ||  res.status !== 200) {
                logger.error(error);
                cb('oauth authentication failed');
            } else {
                cb(null, self.extractUser(res.body));
            }
        });
};

OAUTH2.prototype.extractUser = function(content) {
    logger.debug(JSON.stringify(content));
    return content;
};

OAUTH2.prototype.authenticate = function (opts) {
    var self = this;
    return new Promise(function (resolve, reject) {
        logger.info("OAUTH2 authenticate ", opts.oauth_token);
        self.verifyToken(opts.oauth_token, function (err, user){
            if (err) {
                reject('could not authenticate user');
            } else {
                resolve(user);
            }
        });
    });
};

module.exports = OAUTH2;