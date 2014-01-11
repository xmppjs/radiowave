'use strict';

var superagent = require('superagent'),
    winston = require('winston'),
    logger = winston.loggers.get('authentication');

/**
 * Server-side implementation of Oauth-2
 * {
 *   # server url that validates the token and returns json with userdata
 *   server: "http://example.com/user"
 * }
 */
function OAUTH2(settings) {
    this.settings = settings;
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

    // load user details
    superagent
        .post(this.settings.server)
        .send({})
        .set('content-type', "application/json")
        .set('Authorization', "Bearer " + opts.oauth_token)
        .end(function (error, res) {
            if (error) {
                cb(error);
            } else {

                // TODO check login with user in jid
                // verify the username from json with requested username
                // console.log(res.body.login);

                var user = opts;
                user.email = res.body.login;

                // TODO merge properties properly
                console.log(JSON.stringify(opts.jid));
                cb(null, user);
            }
        });
};

module.exports = OAUTH2;