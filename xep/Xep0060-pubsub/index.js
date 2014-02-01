'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('xep-0060'),
    ltx = require('ltx'),
    util = require('util'),
    XepComponent = require('../XepComponent'),
    JID = require('node-xmpp-core').JID,
    NS = require('./namespace');

var NodeHandler = require('./handler/node'),
    PublishHandler = require('./handler/publish'),
    SubscriptionHandler = require('./handler/subscription');

/*
 * XEP-0060: Publish-Subscribe
 * http://xmpp.org/extensions/xep-0060.html
 */

function PubSub(options) {
    this.options = options;

    this.subdomain = options.subdomain;
    this.domain = options.domain;

    XepComponent.call(this);

    this.autoCreateChannel = true;

    this.Users = options.storage.users;
    this.Lookup = options.storage.lookup;

    // handler for specific operations
    this.nodeHandler = this.configureHandler(new NodeHandler(this.Users, this.Lookup));
    this.publishHandler = this.configureHandler(new PublishHandler());
    this.subscriptionHandler = this.configureHandler(new SubscriptionHandler());
}
util.inherits(PubSub, XepComponent);

PubSub.prototype.name = 'XEP-0060: Publish-Subscribe';

PubSub.prototype.initialize = function () {
    //var filename = path.resolve(__dirname , '../../storage/postgre/pubsub/schema.json');
    //(new PGSchema(this.options.storage.client)).run(filename);
};

PubSub.prototype.features = function () {
    return ["http://jabber.org/protocol/pubsub#auto-create"];
};

PubSub.prototype.match = function (stanza) {
    var domain = this.subdomain + '.' + this.domain;
    var jid = new JID(stanza.attrs.to);

    // check that the domain fits
    if (jid.getDomain().toString().localeCompare(domain) !== 0) {
        // logger.debug('Pubsub ' + domain + ' does not accept ' + jid.toString());
        return false;
    }

    // normal pubsub request
    if (
        (stanza.is('iq') && stanza.getChild('pubsub', NS.PUBSUB)) ||
        // owner requests
        (stanza.is('iq') && stanza.getChild('pubsub', NS.PUBSUB_OWNER)) ||
        // configure requests
        (stanza.is('iq') && stanza.getChild('pubsub', NS.PUBSUB_CONFIG)) ||
        // disco
        (stanza.is('iq') && stanza.getChild('query', NS.DISCO_ITEMS)) ||
        (stanza.is('iq') && stanza.getChild('query', NS.DISCO_INFO))
    ) {
        logger.debug('detected meesage for Xep-0060 ' + domain);
        return true;
    }

    return false;
};

PubSub.prototype.configureHandler = function (handler) {
    var self = this;

    handler.sendError = function ()  {
        self.sendError.apply(self, arguments);
    };
    handler.sendSuccess = function () {
        self.sendSuccess.apply(self, arguments);
    };
    handler.send = function () {
        self.send.apply(self, arguments);
    };

    return handler;
};

PubSub.prototype.getDomain = function () {
    return this.domain;
};

PubSub.prototype.getSubdomain = function () {
    return this.subdomain;
};

// overwrite XepComponent sendError() method
PubSub.prototype.sendError = function (stanza, err) {
    logger.debug('sendError');

    var response = new ltx.Element('iq', {
        from: stanza.attrs.to,
        to: stanza.attrs.from,
        id: stanza.attrs.id,
        type: 'error'
    });

    // attach error detail
    if (err) {
        response.cnode(err);
    }

    this.send(response);
};

// overwrite XepComponent sendSuccess() method
PubSub.prototype.sendSuccess = function (stanza, detail) {
    logger.debug('sendSucces');
    console.log(stanza + ' ' +detail);
    var response = new ltx.Element('iq', {
        from: stanza.attrs.to,
        to: stanza.attrs.from,
        id: stanza.attrs.id,
        type: 'result'
    });

    // attach error detail
    if (detail) {
        response.cnode(detail);
    }

    this.send(response);
};

PubSub.prototype.handlePubSub = function (method, identifier, stanza, pubsubEl) {
    logger.debug('handlePubSub');

    var errorXml = null;
    var self = this;
    self.Users.user(identifier.user).then(
        function (user) {
            return user.getChannel(identifier.resource);
        }).then(
        function (channel) {
            // okay, we have the channel
            switch (method) {
            case 'subscribe':
                self.subscriptionHandler.handleSubscribe(channel, stanza, pubsubEl);
                break;
            case 'unsubscribe':
                self.subscriptionHandler.handleUnsubscribe(channel, stanza, pubsubEl);
                break;
            case 'publish':
                self.publishHandler.handlePublish(channel, stanza, pubsubEl);
                break;
            case 'delete':
                self.nodeHandler.handleDelete(channel, stanza, pubsubEl);
                break;
            }
        }).then(
        function () {},
        function (err) {
            logger.error(err);
            // channel does not exist
            errorXml = ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
            self.sendError(stanza, errorXml);
        });
};

/**
 * determine the operation we have to do, based on the given
 * xmpp request
 */
PubSub.prototype.detectMethod = function (stanza, pubsub) {
    logger.debug('detectMethod');

    var self = this,
        errorXml = null;

    // detect what we have to do
    var method = null;
    var pubsubEl = null;
    if (pubsub.getChild('subscribe')) {
        method = 'subscribe';
        pubsubEl = pubsub.getChild('subscribe');
    } else if (pubsub.getChild('unsubscribe')) {
        method = 'unsubscribe';
        pubsubEl = pubsub.getChild('unsubscribe');
    } else if (pubsub.getChild('publish')) {
        method = 'publish';
        pubsubEl = pubsub.getChild('publish');
    } else if (pubsub.getChild('create')) {
        method = 'create';
        pubsubEl = pubsub.getChild('create');
    } else if (pubsub.getChild('delete', NS.PUBSUB_OWNER)) {
        method = 'delete';
        pubsubEl = pubsub.getChild('delete');
    } else {
        // if we reach here, we do not understand what we should do ;-)
        this.sendError(stanza);
    }

    // only continue if we have detected a method
    if (method) {

        // detect node name
        var nodename = pubsubEl.attrs.node;
        logger.debug(nodename);

        if (method === 'create') {
            // TODO do not forward Users and Lookup
            self.nodeHandler.handleCreate(stanza, pubsubEl, self.Users, self.Lookup);
        } else {

            // lookup,if we have the nodename stored otherwise the execution does not make sense
            this.Lookup.find('pubsub', nodename).then(function (identifier) {
                self.handlePubSub(method, identifier, stanza, pubsubEl);
            }, function (err) {
                logger.error(err);

                // create node and handle the original message
                if (self.autoCreateChannel && method === 'publish') {
                    logger.debug('auto-create channel');
                    var jid = new JID(stanza.attrs.from).bare();
                    var username = jid.getLocal();
                    logger.debug(username + '->' + nodename);
                    self.Users.user(username).then(function (user) {
                        self.nodeHandler.createNode(user, nodename, [], function () {
                            logger.debug('handle original request');
                            self.handlePubSub(method, {
                                'user': username,
                                'resource': nodename
                            }, stanza, pubsubEl);
                        }, function () {
                            self.sendError(stanza);
                        });
                    });
                }
                // send error
                else {
                    // channel does not exist
                    errorXml = ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
                    self.sendError(stanza, errorXml);
                }
            });
        }
    }
};

PubSub.prototype.handle = function (stanza) {
    logger.debug('handle');

    // handle occupant requests
    var pubsub = stanza.getChild('pubsub', NS.PUBSUB);
    if (pubsub) {
        this.detectMethod(stanza, pubsub);
    }

    // handle pubsub owner request
    pubsub = stanza.getChild('pubsub', NS.PUBSUB_OWNER);
    if (pubsub) {
        this.detectMethod(stanza, pubsub);
    }

    // TODO send error if we reach here
};

module.exports = PubSub;