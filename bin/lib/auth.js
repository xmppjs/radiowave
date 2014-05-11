'use strict';

var logger = require('../../lib/core/Logger')('zrocketd'),
    xRocket = require('../../lib'),
    Promise = require('bluebird');

function Auth() {}

Auth.prototype.oauth2 = function (settings) {

    var oauth2Auth = new xRocket.Auth.OAuth2({
        'url' : settings.server
    });

    return oauth2Auth;
};

Auth.prototype.ldap = function (settings) {

    var ldapConfig = {
        'suffix': settings.suffix,
        'url'   : settings.url,
        'uidTag': settings.uidTag
    };

    return new xRocket.Auth.LDAP(ldapConfig);

};

Auth.prototype.simple = function (settings) {
    
    var simpleAuth = new xRocket.Auth.Simple();

    // register users
    if (settings.users) {
        settings.users.forEach(function(user){
            simpleAuth.addUser(user.user, user.password);
        });
    }

    // register test user
    if (settings.testusers) {

        var usrbase = 'load';
        var usrpwd = 'passwd';
        var number = 10000;

        for (var i = 1; i <= number; i++) {
            simpleAuth.addUser(usrbase+i, usrpwd+i);
        }

    }

    return simpleAuth;
};

Auth.prototype.load = function (connectionRouter, API, settings) {
    var self = this;
    return new Promise(function (resolve, reject) {
        logger.debug('auth');
        var auth = settings.get('auth');

        if (auth && auth.length > 0) {
            auth.forEach(function (module){
                logger.debug('load auth module ' + module.type );
                var m = self[module.type](module);

                // add auth to xRocket
                connectionRouter.addAuthMethod(m);

                // add auth to API
                if (API) {
                    API.addAuthMethod(m);
                }
            });
            resolve();
        } else {
            reject();
        }
    });
};

module.exports = Auth;