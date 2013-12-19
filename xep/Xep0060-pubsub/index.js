'use strict';

var ltx = require('ltx'),
    util = require('util'),
    winston = require('winston'),
    uuid = require('node-uuid'),
    logger = winston.loggers.get('xepcomponent'),
    XepComponent = require('../XepComponent'),
    Iq = require('node-xmpp-core').Stanza.Iq,
    Message = require('node-xmpp-core').Stanza.Message,
    JID = require('node-xmpp-core').JID;

// namespaces
var NS_PUBSUB = 'http://jabber.org/protocol/pubsub',
    NS_PUBSUB_OWNER = 'http://jabber.org/protocol/pubsub#owner',
    NS_PUBSUB_CONFIG = 'http://jabber.org/protocol/pubsub#node_config';
//    NS_JABBER_DATA =    'jabber:x:data';

var PubSubNode = require('./PubSubNode');

var Storage = require('./storage');

/*
 * XEP-0060: Publish-Subscribe
 * http://xmpp.org/extensions/xep-0060.html
 */

function PubSub(options) {
    this.subdomain = options.subdomain;
    this.domain = options.domain;

    XepComponent.call(this);

    this.Storage = {};
    this.Storage.Nodes = new Storage.Nodes(options.storage);
    this.Storage.Items = new Storage.Items(options.storage);
}
util.inherits(PubSub, XepComponent);

PubSub.prototype.name = 'XEP-0060: Publish-Subscribe';

PubSub.prototype.match = function(stanza) {
    // TODO verify that this stanza is for this message

    // normal pubsub request
    if (stanza.is('iq') && stanza.getChild('pubsub', NS_PUBSUB)) {
        logger.debug('detected pubsub request');
        return true;
    }
    // owner requests
    else if (stanza.is('iq') && stanza.getChild('pubsub', NS_PUBSUB_OWNER)) {
        logger.debug('detected pubsub request');
        return true;
    }
    // configure requests
    else if (stanza.is('iq') && stanza.getChild('pubsub', NS_PUBSUB_CONFIG)) {
        logger.debug('detected pubsub request');
        return true;
    }

    return false;
};

PubSub.prototype.getDomain = function() {
    return this.domain;
};

PubSub.prototype.getSubdomain = function() {
    return this.subdomain;
};

/**
 * creates a new pubsub node
 * @param node name of the pubsub node
 */
PubSub.prototype.createNode = function(name, features, callback) {
    logger.debug('create new pubsub node ' + name);

    // create a new pub sub node description
    var node = new PubSubNode({
        name: name,
        subdomain: this.getSubdomain()
    });

    // TODO handle with features
    // node.setConfiguration(NodeConfig.PUBSUB_NODE_Title, "my node title");

    this.Storage.Nodes.add(node.getNodeDescription(), callback);
};


PubSub.prototype.sendError = function(stanza, err) {
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

PubSub.prototype.sendSuccess = function(stanza, detail) {
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

PubSub.prototype.handleCreate = function(stanza) {
    var pubsub = stanza.getChild('pubsub', NS_PUBSUB);
    var create = pubsub.getChild('create');
    var nodename = create.attrs.node;
    var detail = null;

    if (nodename === undefined) {
        nodename = null;
    }

    var self = this;

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
    this.getNode(nodename, function(err, node) {
        // no node found, let's create it
        if (node === null) {
            self.createNode(nodename, null, function(err) {
                // answer with error
                if (err) {
                    logger.error(err);
                    self.sendError(stanza);
                }
                // send success
                else {
                    self.sendSuccess(stanza, detail);
                }
                logger.debug('send pubsub create response');
            });
        }
        // send error node found
        else {
            var errXml = ltx.parse('<error type=\'cancel\'><conflict xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
            self.sendError(stanza, errXml);
        }

    });
};


PubSub.prototype.handleDelete = function(stanza, pubsub) {
    logger.debug(stanza.root().toString());
    var deleteNode = pubsub.getChild('delete', NS_PUBSUB_OWNER);

    var nodename = deleteNode.attrs.node;
    var self = this;

    // try to get node
    this.getNode(nodename, function(err, node) {
        // no node found, let's create it
        if (node === null) {
            // send error
            var errXml = ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
            self.sendError(stanza, errXml);
        } else {
            self.Storage.Nodes.delete(node, function(err) {
                if (!err) {
                    self.sendSuccess(stanza);
                } else {
                    self.sendError(stanza);
                }
            });
        }
    });
};

/**
 * @description subscribes a new jiid
 * @param stanza full pubsub message stanza
 * @param pubsub already extracted pubsub child node
 * @see @see http://xmpp.org/extensions/xep-0060.html#subscriber-subscribe
 */
PubSub.prototype.handleSubscribe = function(node, stanza, pubsub) {

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

    logger.debug('SUBSCRIBE: ' + jid + ' -> ' + node.name);

    // store new subscriber
    // TODO add barejid instead of full jid
    node.subscribe(subscriber.bare().toString());

    // store change
    this.Storage.Nodes.update(node.getNodeDescription());

    // Success Case, send confirmation
    var msg = new Iq({
        from: this.domain,
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
    this.send(msg);

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
};

PubSub.prototype.getNode = function(nodename, callback) {
    this.Storage.Nodes.get(this.getSubdomain(), nodename, callback);
};

/**
 * @description closes a subscription
 * @param stanza full pubsub message stanza
 * @param pubsub already extracted pubsub child node
 * @see http://xmpp.org/extensions/xep-0060.html#subscriber-unsubscribe
 */
PubSub.prototype.handleUnSubscribe = function(node, stanza, pubsub) {
    var errorXml = null;
    var sub = pubsub.getChild('unsubscribe');

    var from = new JID(stanza.attrs.from);
    var subscriber = new JID(sub.attrs.jid);

    // check that jids match
    if (!from.bare().equals(subscriber)) {
        // this is a wrong stanza
        errorXml = ltx.parse('<error type=\'modify\'><bad-request xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/><invalid-jid xmlns=\'http://jabber.org/protocol/pubsub#errors\'/></error>');
        this.sendError(stanza, errorXml);
        return;
    }

    // unregister subscriber
    if (node.isSubscribed(subscriber)) {

        // unsubscribe user
        node.unsubscribe(subscriber);

        // store change
        this.Storage.Nodes.update(node.getNodeDescription());

        this.sendSuccess(stanza);
    } else {
        errorXml = ltx.parse('<error type=\'cancel\'><unexpected-request xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/><not-subscribed xmlns=\'http://jabber.org/protocol/pubsub#errors\'/></error>');
        this.sendError(stanza, errorXml);
    }

};

/**
 * @description publishes a new event
 * @param stanza full pubsub message stanza
 * @param pubsub already extracted pubsub child node
 * @see http://xmpp.org/extensions/xep-0060.html#publisher-publish
 */
PubSub.prototype.handlePublish = function(node, stanza, publish) {
    var self = this;

    logger.debug(stanza.toString());
    logger.debug(publish.toString());

    // if node is available
    if (node) {
        logger.debug('PUBLISH to ' + node.name());

        var itemswithoutpayload = [];
        var itemswithpayload = [];

        var childs = publish.getChildren('item');
        childs.forEach(function(item) {
            // check for id
            if (!item.attrs.id) {
                item.attrs.id = uuid.v4();
            }

            itemswithpayload.push(item.clone());

            // clear payload from items
            item.children = [];
            item.text('');

            itemswithoutpayload.push(item);
        })

        logger.debug(itemswithpayload.toString());
        logger.debug(itemswithoutpayload.toString());

        var msg = new Message({
            from: this.domain,
            to: ''
        });
        msg.c('body').t('PubSubMessage.');
        msg.c('event', {
            'xmlns': 'http://jabber.org/protocol/pubsub#event'
        }).c('items', {
            'node': node
        }).children = itemswithpayload;

        // store message if this option is activated
        /*if (item && item[0] && item[0].attrs && item[0].attrs.type) {

            var type = item[0].attrs.type;

            if (type === 'meeting') {
                // we store messages
                logger.debug('we store message');
                node.addMessage(msg);
            }
        }*/

        // send message to subscriber
        node.eachSubscriber(function(subscriber) {
            var submsg = msg.clone();
            submsg.attrs.to = subscriber;

            logger.debug(submsg.root().toString());

            self.send(submsg);
        });


        // send response to sender
        var publishDetail = new ltx.Element('publish', {
            node: node.name()
        });
        publishDetail.children = itemswithoutpayload;

        var detail = new ltx.Element(
            'pubsub', {
                'xmlns': 'http://jabber.org/protocol/pubsub'
            }).cnode(publishDetail).up();


        this.sendSuccess(stanza, detail);

    } else {
        // TODO send error that the node is not available
        logger.error('node not there');
    }
};

PubSub.prototype.handlePubSub = function(stanza, pubsub) {
    var self = this,
        nodename = null,
        sub = null,
        errorXml;

    // handle create a new node
    if (pubsub.getChild('create')) {
        this.handleCreate(stanza);
    }

    // handle subscribe item
    if (pubsub.getChild('subscribe')) {

        sub = pubsub.getChild('subscribe');
        nodename = sub.attrs.node;
        console.log(nodename);
        self.getNode(nodename, function(err, node) {
            if (!err) {
                // no node found
                if (node === null) {
                    errorXml = ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
                    self.sendError(stanza, errorXml);
                }
                // node exists 
                else {
                    self.handleSubscribe(new PubSubNode(node), stanza, pubsub);
                }
            } else {
                // TODO send error
                logger.error('something went wrong');
            }
        });
    }

    // handle unsubscribe
    if (pubsub.getChild('unsubscribe')) {
        sub = pubsub.getChild('unsubscribe');
        nodename = sub.attrs.node;
        console.log(nodename);
        self.getNode(nodename, function(err, node) {
            if (!err) {
                // no node found
                if (node === null) {
                    errorXml = ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
                    self.sendError(stanza, errorXml);
                }
                // node exists 
                else {
                    self.handleUnSubscribe(new PubSubNode(node), stanza, pubsub);
                }
            } else {
                // TODO send error
                logger.error('something went wrong');
            }
        });
    }

    // handle publish and send items, emit event to server
    if (pubsub.getChild('publish')) {

        var publish = pubsub.getChild('publish');
        nodename = publish.attrs.node;
        self.getNode(nodename, function(err, node) {
            if (!err) {


                if (node === null) {
                    var errorXml = ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
                    self.sendError(stanza, errorXml);
                }
                // node exists 
                else {
                    self.handlePublish(new PubSubNode(node), stanza, publish);
                }
            } else {
                // TODO send error
                logger.error('something went wrong');
            }
        });

        /*
                /*else {

            var pubnode = null;
            if (node) {
                pubnode = new PubSubNode(node);
                callback(null, pubnode);
            }
            else {
                // check the default configuration if we send an error or 
                // create a new node
                self.createNode(nodename, function (err, node) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, node);
                    }
                });
            }
        }*/
    }
    // TODO send error if we reach here
};

PubSub.prototype.handlePubSubOwner = function(stanza, pubsub) {
    // handle delete
    if (pubsub.getChild('delete')) {
        this.handleDelete(stanza, pubsub);
    }
    // TODO send error if we reach here
};

PubSub.prototype.handle = function(stanza) {

    var pubsub = stanza.getChild('pubsub', NS_PUBSUB);
    if (pubsub) {
        this.handlePubSub(stanza, pubsub);
    }

    pubsub = stanza.getChild('pubsub', NS_PUBSUB_OWNER);
    if (pubsub) {
        this.handlePubSubOwner(stanza, pubsub);
    }

    // TODO send error if we reach here
};

module.exports = PubSub;
