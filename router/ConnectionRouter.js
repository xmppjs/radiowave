'use strict';

var util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('connrouter'),
    BaseRouter = require('./BaseRouter');

var JID = require('node-xmpp-core').JID,
    XmppVerify = require('../core/XmppVerify');

/**
 * Manages connections and route the requests to other routes
 *
 * TODO: check that to and from values fit to stream, reject messages where the from value does not fit
 */
function ConnectionRouter() {
    BaseRouter.call(this);

    this.authMethods = [];

    this.sessions = {};
}
util.inherits(ConnectionRouter, BaseRouter);

ConnectionRouter.prototype.addAuthMethod = function(method) {
    this.authMethods.push(method);
};

ConnectionRouter.prototype.findAuthMethod = function (method) {
    var found = [];
    for (var i = 0; i < this.authMethods.length; i++) {
        if (this.authMethods[i].match(method)) {
            found.push(this.authMethods[i]);
        }
    }
    return found;
};

ConnectionRouter.prototype.authenticate = function (opts, cb) {
    try {
        /*
        for (var attr in opts) {
            if (opts.hasOwnProperty(attr)) {
                logger.debug(attr + ' -> ' + opts[attr]);
            }
        }
        */
        var auth = this.findAuthMethod(opts.saslmech);
        if (auth.length > 0) {
            auth[0].authenticate(opts).then(function(user){
                logger.debug('xmpp user authenticated' + JSON.stringify(user));

                // merge properties
                for (var property in user) {
                    if (user.hasOwnProperty(property)) {
                        opts[property] = user[property];
                    }
                }
                
                // call callback
                cb(null, opts);
            }).catch(function(err){
                logger.debug('xmpp user authentication failed');
                logger.error(err);
                cb('xmpp could not authenticate user');
            });

        } else {
            // throw error
            logger.error('cannot handle %s', opts.saslmech);
            cb(new Error('user not found'));
        }

    } catch (err) {
        logger.error(err.stack);
        cb(new Error('user not found'));
    }
};

ConnectionRouter.prototype.register = function (opts, cb) {
    // is not implemented, but only relevant for server
    logger.debug('register');

    var err = new Error('not allowed');
    err.code = 123;
    err.type = 'abort';
    cb(err);
};

ConnectionRouter.prototype.send = function (stanza) {
    try {
        logger.debug('deliver:' + stanza.root().toString());
        var self = this;

        if (stanza.attrs && stanza.attrs.to) {
            var toJid = new JID(stanza.attrs.to);

            // send to all local clients, check if jid is there
            if (self.sessions.hasOwnProperty(toJid.bare().toString())) {
                // Now loop over all the sesssions and only send to the right jid(s)
                var sent = false,
                    resource;
                for (resource in self.sessions[toJid.bare().toString()]) {
                    if (toJid.bare().toString() === toJid.toString() || toJid.resource === resource) {
                        self.sessions[toJid.bare().toString()][resource].send(stanza);
                        sent = true;
                    }
                }

                // we couldn't send the stanza
                if (!sent) {
                    logger.error(stanza.root().toString() + 'could not be delivered');
                }
            }
        }
    } catch (err) {
        logger.error(err.stack);
    }
};

/**
 * Registers a route (jid client connection)
 */
ConnectionRouter.prototype.registerRoute = function (jid, client) {
    try {
        logger.debug('register jid ' + jid);
        // TODO check for conflicts
        if (!this.sessions.hasOwnProperty(jid.bare().toString())) {
            this.sessions[jid.bare().toString()] = {};
        }

        this.sessions[jid.bare().toString()][jid.resource] = client;
    } catch (err) {
        logger.error(err.stack);
    }
    return true;
};

/**
 * Unregisters a route (jid client connection)
 */
ConnectionRouter.prototype.unregisterRoute = function (jid) {
    try {
        logger.debug('unregister jid ' + jid);
        if (jid && jid.bare()) {
            if (this.sessions.hasOwnProperty(jid.bare().toString())) {
                delete this.sessions[jid.bare().toString()][jid.resource];
            }
        }
    } catch (err) {
        logger.error(err.stack);
    }

    return true;
};

/**
 * Returns the list of jids connected for a specific jid.
 */
ConnectionRouter.prototype.connectedClientsForJid = function (jid) {
    try {
        jid = new JID(jid);
        if (!this.sessions.hasOwnProperty(jid.bare().toString())) {
            return [];
        } else {
            var jids = [];
            var resources = this.sessions[jid.bare().toString()];
            for (var resource in resources) {
                if (resources.hasOwnProperty(resource)) {
                    jids.push(new JID(jid.bare().toString() + '/' + resource));
                }
            }
            return jids;
        }
    } catch (err) {
        logger.error(err.stack);
        return [];
    }
};

ConnectionRouter.prototype.connect = function (jid, stream) {
    try {
        if (jid) {
            this.registerRoute(jid, stream);
            BaseRouter.prototype.connect.call(this, jid);
        }
    } catch (err) {
        logger.error(err);
    }
};

ConnectionRouter.prototype.disconnect = function (jid, stream) {
    try {
        this.unregisterRoute(jid, stream);
        BaseRouter.prototype.disconnect.call(this, jid);
    } catch (err) {
        logger.error(err.stack);
    }
};

ConnectionRouter.prototype.verifyStanza = function (stream, stanza) {
    try {
        // verify xmpp stanza
        var error = XmppVerify.invalidfrom(stream, stanza);
        
        if (error) {
            logger.warn(error);
            // stream.error(error);
        }

        // forward stanza to route
        this.stanza(stanza);

    } catch (err) {
        logger.error(err.stack);
    }
};

/**
 * Takes a stream and registers event handler
 * @param   stream node-xmpp stream
 */
ConnectionRouter.prototype.registerStream = function (stream) {
    console.log('register new stream');

    var self = this;

    // Allows the developer to authenticate users against anything they
    // want.
    stream.on('authenticate', function (opts, cb) {
        self.authenticate(opts, cb);
    });

    // Allows the developer to register the jid against anything they want
    stream.on('register', function (opts, cb) {
        self.register(opts, cb);
    });

    // socket events from node-xmpp connection
    stream.on('end', function () {
        // connection is ended, then closed
        // @see http://nodejs.org/api/net.html#net_event_end
        console.log('client connection end');
    });

    stream.on('online', function () {
        console.log('ONLINE: ' + stream.jid.toString());
        // forward event to router
        self.connect(stream.jid, stream);
    });

    stream.on('close', function () {
        // forward event to router
        self.disconnect(stream.jid, stream);
    });

    stream.on('stanza', function (stanza) {
        self.verifyStanza(stream, stanza);
    });

    // base router events
    stream.on('connect', function () {
        self.connect(stream.jid, stream);
    });

    stream.on('disconnect', function () {
        self.disconnect(stream.jid, stream);
    });

};

module.exports = ConnectionRouter;