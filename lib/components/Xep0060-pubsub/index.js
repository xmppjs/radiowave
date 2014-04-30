'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('xep-0060'),
    ltx = require('ltx'),
    util = require('util'),
    Promise = require('bluebird'),
    XComponent = require('../../core/XComponent'),
    JID = require('node-xmpp-core').JID,
    NS = require('./namespace');

var NodeHandler = require('./modules/node'),
    PublishHandler = require('./modules/publish'),
    SubscriptionHandler = require('./modules/subscription');

/*
 * XEP-0060: Publish-Subscribe
 * http://xmpp.org/extensions/xep-0060.html
 */

function PubSub(options) {
    this.options = options;

    this.subdomain = options.subdomain;
    this.domain = options.domain;

    XComponent.call(this);

    this.autoCreateChannel = false;

    this.storage = options.storage;

    // handler for specific operations
    this.nodeHandler = this.configureHandler(new NodeHandler(this.storage));
    this.publishHandler = this.configureHandler(new PublishHandler(this.storage));
    this.subscriptionHandler = this.configureHandler(new SubscriptionHandler(this.storage));
}
util.inherits(PubSub, XComponent);

PubSub.prototype.name = 'XEP-0060: Publish-Subscribe';

PubSub.prototype.Error = {};
PubSub.prototype.Error.NotFound = ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');

PubSub.prototype.initialize = function () {

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
    console.log(stanza + ' ' + detail);
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

PubSub.prototype.findUser = function (jid) {

    var userjid = null;
    if (jid instanceof JID) {
        userjid = jid;
    } else {
        userjid = new JID(jid.toString());
    }

    var self = this;
    return new Promise(function (resolve, reject) {
        self.storage.User.find({
            where: {
                jid: userjid.bare().toString()
            }
        }).success(function (user) {
            logger.debug('findUser: ' + JSON.stringify(user));
            resolve(user);
        }).error(function (err) {
            reject(err);
        });
    });
};

PubSub.prototype.findNode = function (nodename, user, doNotCreate) {
    doNotCreate = doNotCreate || false;
    console.log('search for node: ' + nodename);
    if (this.autoCreateChannel && !doNotCreate) {
        console.log('activate auto-create');
        return this.nodeHandler.findOrCreateNode(nodename, user);
    } else {
        console.log('just find this node');
        return this.nodeHandler.findNode(nodename);
    }
};


PubSub.prototype.handlePubSub = function (method, stanza, pubsubEl) {
    logger.debug('handlePubSub: ' + method + ' stanza: ' + stanza.toString() + ' pubsub: ' + pubsubEl.toString());
    var self = this;

    var fromJid = new JID(stanza.attrs.from);
    this.findUser(fromJid).then(function(user){
        // detect node name
        var nodename = pubsubEl.attrs.node;
        logger.debug('nodename: ' + nodename);


        // okay, we have the user
        switch (method) {
        case 'create' :
            self.nodeHandler.handleCreate(user, stanza, pubsubEl);
            break;
        case 'subscribe':
            self.findNode(nodename, user).then(function(node){
                console.log('found: ' + node);
                if (node) {
                    self.subscriptionHandler.handleSubscribe(user, node, stanza, pubsubEl);
                } else {
                    self.sendError(stanza, self.Error.NotFound);
                }
            });
            
            break;
        case 'unsubscribe':
            self.findNode(nodename, user, true).then(function(node){
                console.log('found: ' + node);
                if (node) {
                    self.subscriptionHandler.handleUnsubscribe(user, node, stanza, pubsubEl);
                } else {
                    self.sendError(stanza, self.Error.NotFound);
                }
            });
            break;
        case 'publish':
            self.findNode(nodename, user).then(function(node){
                console.log('found: ' + node);
                if (node) {
                    self.publishHandler.handlePublish(user, node, stanza, pubsubEl);
                } else {
                    self.sendError(stanza, self.Error.NotFound);
                }
            });
            break;
        case 'delete':
            self.findNode(nodename, user, true).then(function(node){
                console.log('found: ' + node);
                if (node) {
                    self.nodeHandler.handleDelete(user, node, stanza, pubsubEl);
                } else {
                    self.sendError(stanza, self.Error.NotFound);
                }
            });
            break;
        default:
            this.sendError(stanza, this.Error.NotFound);
        }
    });
};

/**
 * determine the operation we have to do, based on the given
 * xmpp request
 */
PubSub.prototype.detectMethod = function (stanza, pubsub) {
    logger.debug('detectMethod');

    var self = this;

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
        self.handlePubSub(method, stanza, pubsubEl);
    } else {
        logger.error('invalid method');
        self.sendError(stanza, self.Error.NotFound);
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