'use strict';

var ltx = require('ltx'),
    util = require('util'),
    winston = require('winston'),
    uuid = require('node-uuid'),
    logger = winston.loggers.get('xep-0060'),
    XepComponent = require('../XepComponent'),
    Iq = require('node-xmpp-core').Stanza.Iq,
    Message = require('node-xmpp-core').Stanza.Message,
    JID = require('node-xmpp-core').JID;

/*
var path = require('path'),
    PGSchema = require('../../storage/postgre/PGSchema');

var PubSubNode = require('./PubSubNode'),
    Storage = require('../../storage/postgre/pubsub');
 */

// namespaces
var NS_PUBSUB = 'http://jabber.org/protocol/pubsub',
    NS_PUBSUB_OWNER = 'http://jabber.org/protocol/pubsub#owner',
    NS_PUBSUB_CONFIG = 'http://jabber.org/protocol/pubsub#node_config',
    NS_DISCO_ITEMS = "http://jabber.org/protocol/disco#items",
    NS_DISCO_INFO = "http://jabber.org/protocol/disco#info";
//    NS_JABBER_DATA =    'jabber:x:data';


/*
 * XEP-0060: Publish-Subscribe
 * http://xmpp.org/extensions/xep-0060.html
 */

function PubSub(options) {
    this.options = options;

    this.subdomain = options.subdomain;
    this.domain = options.domain;

    XepComponent.call(this);

    this.Users = options.storage.users;
    this.Lookup = options.storage.lookup;
}
util.inherits(PubSub, XepComponent);

PubSub.prototype.name = 'XEP-0060: Publish-Subscribe';

PubSub.prototype.initialize = function () {
    //var filename = path.resolve(__dirname , '../../storage/postgre/pubsub/schema.json');
    //(new PGSchema(this.options.storage.client)).run(filename);
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
        (stanza.is('iq') && stanza.getChild('pubsub', NS_PUBSUB)) ||
        // owner requests
        (stanza.is('iq') && stanza.getChild('pubsub', NS_PUBSUB_OWNER)) ||
        // configure requests
        (stanza.is('iq') && stanza.getChild('pubsub', NS_PUBSUB_CONFIG)) ||
        // disco
        (stanza.is('iq') && stanza.getChild('query', NS_DISCO_ITEMS)) ||
        (stanza.is('iq') && stanza.getChild('query', NS_DISCO_INFO))
    ) {
        logger.debug('detected meesage for Xep-0060 ' + domain);
        return true;
    }

    return false;
};

PubSub.prototype.getDomain = function () {
    return this.domain;
};

PubSub.prototype.getSubdomain = function () {
    return this.subdomain;
};

PubSub.prototype.sendError = function (stanza, err) {
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

PubSub.prototype.sendSuccess = function (stanza, detail) {
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

PubSub.prototype.handleCreate = function (stanza) {
    logger.debug('handleCreate');
    var self = this;
    var jid = new JID(stanza.attrs.from).bare();
    var pubsub = stanza.getChild('pubsub', NS_PUBSUB);
    var create = pubsub.getChild('create');
    var nodename = create.attrs.node;
    var detail = null;

    if (nodename === undefined) {
        nodename = null;
    }

    if (nodename === null) {
        // generate instant nodename
        nodename = uuid.v4();
        detail = new ltx.Element(
            'pubsub', {
                'xmlns': 'http://jabber.org/protocol/pubsub'
            }
        ).c(
            'create', {
                node: nodename
            }).up();
    }

    // try to get node
    function ch(node) {
        logger.debug('ch' + node);
        // no node found, let's create it
        if (node) {
            // extract features
            var configuration = [];
            var configure = pubsub.getChild('configure');
            if (configure) {
                var x = configure.getChild('x', 'jabber:x:data');
                if (x) {
                    var fields = x.getChildren('field');
                    for (var i = 0, l = fields.length; i < l; i++) {
                        configuration.push({
                            key: fields[i].attrs['var'],
                            value: fields[i].getChild('value').text()
                        });
                    }
                }
            }

            // set default parameter
            node.setConfiguration('pubsub#deliver_payloads', 1);
            node.setConfiguration('pubsub#deliver_notifications', 1);
            node.setConfiguration('pubsub#persist_items', 1);
            node.setConfiguration('pubsub#access_model', 'open');
            node.setConfiguration('pubsub#notify_delete', 1);

            // overwrite configuration
            for (var j = 0; j < configuration.length; j++) {
                logger.debug('set ' + nodename + ' key: ' + configuration[j].key + ' ' + configuration[j].value);
                node.setConfiguration(configuration[j].key, configuration[j].value);
            }

            self.sendSuccess(stanza, detail);
        }
    }

    // if we found a node with this name, we cannot create it
    this.Lookup.find('pubsub', nodename).then(
        function () {
            // channel exists, error
            var errXml = ltx.parse('<error type=\'cancel\'><conflict xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
            self.sendError(stanza, errXml);
        },
        function () {
            var username = jid.getLocal();

            // check if the room exists, if not create it
            self.Users.user(username).then(
                function (user) {
                    user.getChannel(nodename).then(
                        function () {
                            // channel exists, error
                            var errXml = ltx.parse('<error type=\'cancel\'><conflict xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
                            self.sendError(stanza, errXml);
                        },
                        function () {
                            // channel does not exist
                            user.createChannel(nodename).then(
                                function (channel) {
                                    // store lookup
                                    self.Lookup.add('pubsub', username, nodename, nodename).then(function (identifier) {
                                        ch(channel);
                                    });
                                }
                            );
                        });
                });
        });
};


PubSub.prototype.handleDelete = function (node, stanza) {
    var self = this;
    logger.debug(stanza.root().toString());
    logger.debug(node);
    node.remove().then(
        function () {
            logger.debug('node removed');
            self.sendSuccess(stanza);
        },
        function () {
            logger.debug('node could not be removed');
            self.sendError(stanza);
        }
    );
};

/**
 * @description subscribes a new jiid
 * @param stanza full pubsub message stanza
 * @param pubsub already extracted pubsub child node
 * @see @see http://xmpp.org/extensions/xep-0060.html#subscriber-subscribe
 */
PubSub.prototype.handleSubscribe = function (node, stanza, pubsub) {
    var self = this;
    var sub = pubsub.getChild('subscribe');
    var jid = sub.attrs.jid;

    var from = new JID(stanza.attrs.from);
    var subscriber = new JID(sub.attrs.jid);

    // check that jids match
    if (!from.bare().equals(subscriber)) {
        logger.error('subscriptions jids do not match : ' + from.bare().toString() + ' != ' + subscriber.toString());
        // this is a wrong stanza
        var errorXml = ltx.parse('<error type=\'modify\'><bad-request xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/><invalid-jid xmlns=\'http://jabber.org/protocol/pubsub#errors\'/></error>');
        this.sendError(stanza, errorXml);
        return;
    }

    // check that node exists
    logger.debug('SUBSCRIBE: ' + jid + ' -> ' + node.getName());

    // store new subscriber
    node.subscribe(subscriber.bare().toString()).then(
    function () {
        // Success Case, send confirmation
        var msg = new Iq({
            from: self.domain,
            to: stanza.attrs.from,
            id: stanza.attrs.id,
            type: 'result'
        });

        //var humanname = node.getConfiguration(NodeConfig.PUBSUB_NODE_Title);

        msg.c('pubsub', {
            'xmlns': NS_PUBSUB
        }).c('subscription', {
            'node': sub.attrs.node,
            'jid': sub.attrs.jid,
            'subscription': 'subscribed'
        });

        // send subscribe response
        self.send(msg);

        /*
         * send old items to new subscriber
         * TODO make dependend on node default
         * @see http://xmpp.org/extensions/xep-0060.html#subscriber-subscribe-last
         */
        /*node.eachMessage(function (el) {
        el.attrs.to = sub.attrs.jid;
        // route message
        this.send(el, null);
    });*/
    },
    function () {
        // error
    }
    );
};

/**
 * @description closes a subscription
 * @param stanza full pubsub message stanza
 * @param pubsub already extracted pubsub child node
 * @see http://xmpp.org/extensions/xep-0060.html#subscriber-unsubscribe
 */
PubSub.prototype.handleUnsubscribe = function (node, stanza, pubsub) {
    var self = this;
    var errorXml = null;
    var sub = pubsub.getChild('unsubscribe');

    var userjid = new JID(stanza.attrs.from);
    var subscriber = new JID(sub.attrs.jid);

    // check that jids match
    if (!userjid.bare().equals(subscriber)) {
        // this is a wrong stanza
        errorXml = ltx.parse('<error type=\'modify\'><bad-request xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/><invalid-jid xmlns=\'http://jabber.org/protocol/pubsub#errors\'/></error>');
        this.sendError(stanza, errorXml);
        return;
    }

    // unregister subscriber
    logger.debug('user' + userjid.bare() + ' unsubscribe the node');
    node.unsubscribe(userjid.bare().toString()).then(
        function () {
            self.sendSuccess(stanza);
        },
        function () {
            errorXml = ltx.parse('<error type=\'cancel\'><unexpected-request xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/><not-subscribed xmlns=\'http://jabber.org/protocol/pubsub#errors\'/></error>');
            self.sendError(stanza, errorXml);
        });
};

/**
 * @description publishes a new event
 * @param stanza full pubsub message stanza
 * @param pubsub already extracted pubsub child node
 * @see http://xmpp.org/extensions/xep-0060.html#publisher-publish
 */
PubSub.prototype.handlePublish = function (node, stanza, publish) {
    var self = this;
    logger.debug('handlePublish');
    logger.debug(stanza.toString());

    // if node is available
    if (node) {
        logger.debug('PUBLISH to ' + node.getName());
        logger.debug(stanza);

        var itemswithoutpayload = [];
        var itemswithpayload = [];

        var childs = publish.getChildren('item');
        childs.forEach(function (item) {
            // check for id
            if (!item.attrs.id) {
                item.attrs.id = uuid.v4();
            }

            itemswithpayload.push(item.clone());

            // clear payload from items
            item.children = [];
            item.text('');

            itemswithoutpayload.push(item);
        });

        logger.debug('With Payload:  ' + itemswithpayload.toString());
        logger.debug('W/out Payload: ' + itemswithoutpayload.toString());

        // generate notification message
        var attachment = [];
        if (node.getConfiguration('pubsub#deliver_payloads') === 1) {
            attachment = itemswithpayload;
        } else {
            attachment = itemswithoutpayload;
        }

        var msg = new Message({
            from: this.domain,
            to: ''
        });
        msg.c('event', {
            'xmlns': 'http://jabber.org/protocol/pubsub#event'
        }).c('items', {
            'node': node.getName()
        }).children = attachment;

        // store message in history
        node.trigger(msg.root().toString());

        // send response to sender
        var publishDetail = new ltx.Element('publish', {
            node: node.getName()
        });
        publishDetail.children = itemswithoutpayload;

        var detail = new ltx.Element(
            'pubsub', {
                'xmlns': 'http://jabber.org/protocol/pubsub'
            }).cnode(publishDetail).up();

        this.sendSuccess(stanza, detail);

        // send notification message to subscriber
        node.listSubscribers().then(
            function (subscribers) {
                logger.debug('send events to subs ' + JSON.stringify(subscribers));
                for (var i = 0, l = subscribers.length; i < l; i += 1) {
                    var subscriber = subscribers[i];

                    var clientmsg = msg.clone();
                    clientmsg.attrs.to = subscriber.jid;
                    self.send(clientmsg);
                }
            },
            function (error) {
                logger.debug('error' + error)
            }
        );
    } else {
        // TODO send error that the node is not available
        logger.error('node not there');
    }
};

PubSub.prototype.handlePubSub = function (stanza, pubsub) {
    var self = this,
        errorXml;

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
    } else if (pubsub.getChild('delete', NS_PUBSUB_OWNER)) {
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
            self.handleCreate(stanza, pubsubEl);
        } else {

            // lookup,if we have the nodename stored
            this.Lookup.find('pubsub', nodename).then(function (identifier) {

                // check if the channel exists, if not create it
                self.Users.user(identifier.user).then(
                    function (user) {
                        return user.getChannel(identifier.resource);
                    }).then(
                    function (channel) {
                        // okay, we have the channel
                        switch (method) {
                        case 'subscribe':
                            self.handleSubscribe(channel, stanza, pubsub);
                            break;
                        case 'unsubscribe':
                            self.handleUnsubscribe(channel, stanza, pubsub);
                            break;
                        case 'publish':
                            self.handlePublish(channel, stanza, pubsubEl);
                            break;
                        case 'delete':
                            self.handleDelete(channel, stanza, pubsubEl);
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
            }, function (err) {
                logger.error(err);
                // channel does not exist
                errorXml = ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
                self.sendError(stanza, errorXml);
            });
        }
    }
};

PubSub.prototype.handle = function (stanza) {

    // handle occupant requests
    var pubsub = stanza.getChild('pubsub', NS_PUBSUB);
    if (pubsub) {
        this.handlePubSub(stanza, pubsub);
    }

    // handle pubsub owner request
    pubsub = stanza.getChild('pubsub', NS_PUBSUB_OWNER);
    if (pubsub) {
        this.handlePubSub(stanza, pubsub);
    }

    // TODO send error if we reach here
};

module.exports = PubSub;