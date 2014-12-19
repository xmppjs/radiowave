'use strict';

var logger = require('../core/Logger')('xrocketd'),
    Promise = require('bluebird'),
    path = require('path'),
    express = require('express'),
    cors = require('cors'),
    xRocket = require('..'),
    JID = require('node-xmpp-core').JID;

var passport = require('passport'),
    BearerStrategy = require('passport-http-bearer').Strategy,
    BasicStrategy = require('passport-http').BasicStrategy;

function API() {
    this.authMethods = [];
    this.domain = "";
}

API.prototype.addAuthMethod = function (method) {
    this.authMethods.push(method);
};

API.prototype.findAuthMethod = function (method) {
    var found = [];
    for (var i = 0; i < this.authMethods.length; i++) {
        if (this.authMethods[i].match(method)) {
            found.push(this.authMethods[i]);
        }
    }
    return found;
};

API.prototype.verify = function (storage, opts, cb) {
    var self = this;
    var auth = this.findAuthMethod(opts.saslmech);
    if (auth.length > 0) {

        // if we got a username but no jid (e.g. LDAP requests)
        if (!opts.jid && opts.username) {
            // we build a JID to escape the username properly
            opts.jid = new JID(opts.username + '@' + this.domain).toString();
        }

        var usr = null;
        auth[0].authenticate(opts).then(function (user) {
            logger.debug('api user authenticated ');

            // for api request we may not got the jid, but need it, generate jid 
            // from username (e.g. OAuth API requests)
            if (!user.jid && user.username) {
                // we build a JID to escape the username properly
                user.jid = new JID(user.username + '@' + self.domain).toString();
            }

            usr = user;
            // create user on-the-fly
            return storage.findOrCreateUser(user.jid.toString());
        }).then(function () {
            logger.info('api authentication finalized with user: ' + JSON.stringify(usr));
            cb(null, usr);
        }).catch (function (err) {
            logger.error('api user authentication failed %s', err);
            cb(null, null);
        });
    } else {
        // throw error
        logger.error('cannot handle %s', opts.saslmech);
        cb(new Error('user not found'), false);
    }
};

API.prototype.configurePassport = function (passport, storage) {
    var self = this;

    /**
     * BearerStrategy
     */
    passport.use(new BearerStrategy(
        function (accessToken, done) {
            logger.debug('API OAuth Request: %s', accessToken);

            var opts = {
                'saslmech': 'X-OAUTH2',
                'oauth_token': accessToken
            };

            self.verify(storage, opts, done);
        }
    ));

    /**
     * BasicStrategy
     */
    passport.use(new BasicStrategy(
        function (userid, password, done) {
            logger.debug('API Basic Auth Request: %s', userid);

            var opts = {
                'saslmech': 'PLAIN',
                'username': userid,
                'password': password
            };

            self.verify(storage, opts, done);
        }
    ));

};

API.prototype.configureRoutes = function (app, storage, settings) {

    // check for authentication for api routes
    var subpath = settings.get('subpath') || "";
    var apipath = path.join('/' , subpath , 'api');

    var passport = app.get('passport');

    // the following routes are authenticated
    app.all(apipath + '/*', passport.authenticate(['basic', 'bearer'], {
        session: false
    }));

    // load xrocketd api
    var apiroutes = xRocket.Api.Routes(storage, settings);

    // call our router we just created
    app.use(apipath, apiroutes.user);
    app.use(apipath, apiroutes.orgs);
    app.use(apipath, apiroutes.room);
    app.use(apipath, apiroutes.channel);
    app.use(apipath, apiroutes.pub);
};

API.prototype.startApi = function (storage, settings, multiport) {
    
    this.storage = storage;

    var app = null;
    var apisettings = settings.get('api');

    if (multiport && ((apisettings.port === multiport.port) || (!apisettings.port))) {
        app = multiport.app;
        logger.debug('use multiport for api');
    } else if (apisettings.port) {
        app = express();
        app.listen(apisettings.port);
    } else {
        logger.error('could not determine a port for api');
    }

    // REST API
    app.use(function (req, res, next) {
        res.removeHeader('X-Powered-By');
        next();
    });

    // initialize use passport
    app.use(passport.initialize());
    this.configurePassport(passport, storage);
    app.set('passport', passport);

    // check for cors
    var whitelist = apisettings.cors.hosts;
    var corsOptions = {
        origin: function(origin, callback){
            var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
            callback(null, originIsWhitelisted);
        },
        credentials : true
    };
    app.use(cors(corsOptions));

    // enable preflight
    app.options('*', [cors(corsOptions), function (req, res) {
        res.send(200);
    }]);

    this.configureRoutes(app, storage, settings);

    // web client
    // logger.debug(path.resolve(__dirname, '../web'));
    // app.use(express.static(path.resolve(__dirname, '../web')));

    // catch exceptions
    app.use(function (err, req, res, next) {
        logger.error(err);
        res.send(err.status || 400);
    });
};

/*
 * load the Rest API
 */
API.prototype.load = function (settings, storage) {

    // determine domain
    this.domain = settings.get('domain');

    // load express
    var self = this;
    return new Promise(function (resolve, reject) {
        var multiport = settings.get('multiport');
        if (settings.get('api:activate') === true) {
            self.startApi(storage, settings, multiport);
        }
    });
};

module.exports = API;