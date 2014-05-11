'use strict';

var util = require('util'),
    XRoute = require('../core/XRoute'),
    Promise = require('bluebird');

var JID = require('node-xmpp-core').JID,
    XmppVerify = require('../core/XmppVerify');

/**
 * Manages connections and route the requests to other routes
 *
 * TODO: check that to and from values fit to stream, reject messages where the from value does not fit
 */
function ConnectionRouter(storage) {
    XRoute.call(this);

    this.logger = require('../core/Logger')('connrouter');

    this.storage = storage;
    this.authMethods = [];
    this.sessions = {};
    this.count = 0;
}
util.inherits(ConnectionRouter, XRoute);

ConnectionRouter.prototype.name = 'ConnectionRouter';

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

/**
 * additional step to verify user information
 * @param opts key values information about the user
 */
ConnectionRouter.prototype.verifyUser = function (opts) {
    this.logger.debug('verify user');
    return new Promise(function(resolve) {
        resolve();
    });
};

ConnectionRouter.prototype.authenticate = function (opts, cb) {
    var self = this;

    try {
        
        for (var attr in opts) {
            if (opts.hasOwnProperty(attr)) {
                this.logger.debug(attr + ' -> ' + opts[attr]);
            }
        }
        
        this.logger.debug('start authentication process');
        var auth = this.findAuthMethod(opts.saslmech);
        if (auth.length > 0) {
            auth[0].authenticate(opts).then(function(user){
                self.logger.debug('xmpp user authenticated');

                // merge properties
                for (var property in user) {
                    if (user.hasOwnProperty(property)) {
                        opts[property] = user[property];
                    }
                }
                
                self.verifyUser(opts).then(function(){
                    // call callback
                    cb(null, opts);
                }).catch(function(err){
                    cb('user verification failed');
                });

            }).catch(function(err){
                self.logger.error('xmpp user authentication failed' + err);
                cb('xmpp could not authenticate user');
            });

        } else {
            // throw error
            this.logger.error('cannot handle %s', opts.saslmech);
            cb(new Error('user not found'));
        }

    } catch (err) {
        this.logger.error(err.stack);
        cb(new Error('user not found'));
    }
};

ConnectionRouter.prototype.register = function (opts, cb) {
    // is not implemented, but only relevant for server
    this.logger.debug('register');

    var err = new Error('not allowed');
    err.code = 123;
    err.type = 'abort';
    cb(err);
};

/**
 * inbound communication
 */
ConnectionRouter.prototype.handle = function (stanza) {
    this.logger.debug('emit stanza: ' + stanza.toString());
    this.emit('stanza', stanza);
};

/**
 * outbound communication
 */
ConnectionRouter.prototype.send = function (stanza) {
    try {
        this.logger.debug('deliver:' + stanza.root().toString());
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
                        this.logger.debug('send message to resource: ' + resource);
                        self.sessions[toJid.bare().toString()][resource].send(stanza);
                        sent = true;
                    }
                }

                // we couldn't send the stanza
                if (!sent) {
                    this.logger.error(stanza.root().toString() + ' could not be delivered');
                }
            } else {
                this.logger.warn('could not deliver: ' + stanza.toString);
            }
        }
    } catch (err) {
        this.logger.error(err.stack);
    }
};

/**
 * Registers a route (jid client connection)
 */
ConnectionRouter.prototype.registerRoute = function (jid, client) {
    try {
        this.logger.debug('register jid ' + jid);
        // TODO check for conflicts
        if (!this.sessions.hasOwnProperty(jid.bare().toString())) {
            this.sessions[jid.bare().toString()] = {};
        }

        this.sessions[jid.bare().toString()][jid.resource] = client;
    } catch (err) {
        this.logger.error(err.stack);
    }
    return true;
};

/**
 * Unregisters a route (jid client connection)
 */
ConnectionRouter.prototype.unregisterRoute = function (jid) {
    try {
        this.logger.debug('unregister jid ' + jid);
        if (jid && jid.bare()) {
            if (this.sessions.hasOwnProperty(jid.bare().toString())) {
                delete this.sessions[jid.bare().toString()][jid.resource];
            }
        }
    } catch (err) {
        this.logger.error(err.stack);
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
        this.logger.error(err.stack);
        return [];
    }
};

ConnectionRouter.prototype.connect = function (jid, stream) {
    try {
        if (jid) {
            this.registerRoute(jid, stream);
            this.emit('connect', jid);
        }
    } catch (err) {
        this.logger.error(err);
    }
};

ConnectionRouter.prototype.disconnect = function (jid, stream) {
    try {
        this.unregisterRoute(jid, stream);
        this.emit('disconnect', jid);
    } catch (err) {
        this.logger.error(err.stack);
    }
};

ConnectionRouter.prototype.verifyStanza = function (stream, stanza) {
    try {
        // verify xmpp stanza
        var error = XmppVerify.invalidfrom(stream, stanza);
        
        if (error) {
            this.logger.warn(error);
            // stream.error(error);
        }

        // forward stanza to route
        this.handle(stanza);

    } catch (err) {
        this.logger.error(err.stack);
    }
};

/**
 * Takes a stream and registers event handler
 * @param   stream node-xmpp stream
 */
ConnectionRouter.prototype.registerStream = function (stream) {
    
    this.count++;

    this.logger.debug('register new stream' + this.count);

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
        self.logger.debug('client connection end');
    });

    stream.on('online', function () {
        self.logger.debug('ONLINE: ' + stream.jid.toString());
        // forward event to router
        self.connect(stream.jid, stream);
    });

    stream.on('close', function () {
        // forward event to router
        self.disconnect(stream.jid, stream);
    });

    stream.on('stanza', function (stanza) {
        self.logger.debug('incomming message: ' + stanza.toString());
        self.verifyStanza(stream, stanza);
    });

    // base router events
    stream.on('connect', function () {
        self.count--;
        self.connect(stream.jid, stream);
    });

    stream.on('disconnect', function () {
        self.disconnect(stream.jid, stream);
    });

};

ConnectionRouter.prototype.unregisterStream = function () {
    // TODO implement
};

ConnectionRouter.prototype.messageHandler = function () {
    var self = this;
    return function (stream) {
        self.registerStream(stream);
    };
};

module.exports = ConnectionRouter;