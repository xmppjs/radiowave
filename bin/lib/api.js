'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('xrocketd'),
    Promise = require('bluebird'),
    express = require('express'),
    xRocket = require('../../xrocket'),
    JID = require('node-xmpp-core').JID;

var passport = require('passport'),
    BearerStrategy = require('passport-http-bearer').Strategy,
    BasicStrategy = require('passport-http').BasicStrategy;

function API() {
    this.authMethods = [];
    this.domain = "";
}

API.prototype.addAuthMethod = function(method) {
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

API.prototype.verify = function(opts, cb) {
    var auth = this.findAuthMethod(opts.saslmech);
    if (auth.length > 0) {
        if (!opts.jid) {
            // we build a JID to escape the username properly
            opts.jid = new JID(opts.username + '@' + this.domain).toString();
        } 
        auth[0].authenticate(opts).then(function(user){
                logger.debug('api user authenticated: ');
                cb(null, user);
            }).catch(function(err){
                logger.error('api user authentication failed %s', err);
                cb(null, null);
            });
    } else {
        // throw error
        logger.error('cannot handle %s', opts.saslmech);
        cb(new Error('user not found'), false);
    }
};

API.prototype.configurePassport = function (passport) {
    var self = this;

    /**
     * BearerStrategy
     */
    passport.use(new BearerStrategy(
        function (accessToken, done) {
            logger.debug('API OAuth Request: %s', accessToken);

            var opts = {
                'saslmech' : 'X-OAUTH2',
                'oauth_token' : accessToken
            };

            self.verify(opts, done);
        }
    ));

    /**
     * BasicStrategy
     */
    passport.use(new BasicStrategy(
        function (userid, password, done) {
            logger.debug('API Basic Auth Request: %s', userid);

            var opts = {
                'saslmech' : 'PLAIN',
                'username' : userid,
                'password' : password
            };

            self.verify(opts, done);
        }
    ));

    return passport.authenticate(['basic', 'bearer'], {
        session: false
    });
};

API.prototype.configureRoutes = function (app, storage, settings) {
    var routes = xRocket.Api.Routes;
    // load xrocketd api
    routes(app, storage, settings);
};

API.prototype.startApi = function (storage, settings, multiport) {

    var app = null;
    var apisettings = settings.get('api');

    
    if (multiport && ( (apisettings.port === multiport.port) || (!apisettings.port))) {
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

    app.use(express.bodyParser());
    app.use(express.methodOverride());

    // initialize use passport
    app.use(passport.initialize());
    app.use(passport.session());

    var allowedHost = apisettings.cors.hosts;

    // check for cors
    app.all('*', function (req, res, next) {
        logger.debug('Valid CORS hosts : ' + JSON.stringify(allowedHost));
        logger.debug('Request from host: ' + req.headers.origin);
        if ((allowedHost.indexOf(req.headers.origin) > -1) || (process.env.NODE_ENV === 'development')) {
            res.header('Access-Control-Allow-Origin', req.headers.origin);
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Authorization, X-Requested-With, Content-Type, Content-Length, Content-MD5, Date, X-Api-Version');
            res.header('Access-Control-Allow-Credentials', true);
            logger.debug('CORS activated');
        }
        next();
    });

    // abort request if we got options request
    app.options('*', function (req, res) {
        res.send(200);
    });

    // check for authentication for api routes
    app.all('/api/*', this.configurePassport(passport));

    this.configureRoutes(app, storage, settings);

    // web client
    var path = require('path');
    logger.debug(path.resolve(__dirname, '../web'));
    app.use(express.static(path.resolve(__dirname, '../web')));

    // catch exceptions
    app.use(function (err, req, res, next) {
        console.log(err);
        res.status(err.status || 500);
        res.send({
            error: 'Your request is not valid.'
        });
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