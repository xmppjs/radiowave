'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('authentication');

/**
 * Server-side implementation of Oauth-2
 */
function OAUTH2(handler, settings) {
    this.settings = settings;
    this.handler = handler ||   function (settings, opts, cb) {
        cb('Authentication not possible');
    };
}

OAUTH2.prototype.name = 'OAUTH2';

OAUTH2.prototype.match = function (method) {
    if (method === 'X-OAUTH2') {
        return true;
    }
    return false;
};

OAUTH2.prototype.authenticate = function (opts, cb) {
    logger.info("OAUTH2 authenticate ", opts.oauth_token);
    this.handler(this.settings, opts, cb);
};

module.exports = OAUTH2;