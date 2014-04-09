'use strict';

var util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xep-0060'),
    XepComponent = require('../../XepComponent'),
    ltx = require('ltx'),
    Promise = require('bluebird'),
    uuid = require('node-uuid'),
    Message = require('node-xmpp-core').Stanza.Message;

var PublishHandler = function (storage) {
    this.storage = storage;
};

util.inherits(PublishHandler, XepComponent);

PublishHandler.prototype.extractItems = function (publishEl) {
    var itemswithoutpayload = [];
    var itemswithpayload = [];

    var childs = publishEl.getChildren('item');
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

    return {
        items : itemswithoutpayload,
        payload : itemswithpayload
    };
};

/**
 * determine if the node has payload delivery activated
 */
PublishHandler.prototype.deliverPayload = function (node, publishEl) {
    var self = this;
    return new Promise(function(resolve) {

        node.getConfigurations({
            where: {
                key: 'pubsub#deliver_payloads'
            }
        }).success(function(conf) {
            console.log('preference of node: ' + JSON.stringify(conf));
            var deliver = true;

            if (conf && conf.length === 1) {
                if (conf[0].value === '0') {
                    deliver = false;
                }
            }

            resolve(deliver);
        }).error(function(){
            resolve(true);
        });
    });
};

/**
 * @see http://xmpp.org/extensions/xep-0060.html#publisher-publish-success-withpayload
 */
PublishHandler.prototype.generateMessageStanza = function (node, attachment) {
    var msg = new Message({
        from: this.domain,
        to: ''
    });
    msg.c('event', {
        'xmlns': 'http://jabber.org/protocol/pubsub#event'
    }).c('items', {
        'node': node.name
    }).children = attachment;

    return msg.root();
};

/**
 * @see http://xmpp.org/extensions/xep-0060.html#publisher-publish-success
 */
PublishHandler.prototype.generatePublishedStanza = function (node, items) {
    // send response to sender
    var publishDetail = new ltx.Element('publish', {
        node: node.name
    });
    publishDetail.children = items;

    var detail = new ltx.Element(
        'pubsub', {
            'xmlns': 'http://jabber.org/protocol/pubsub'
        }).cnode(publishDetail).up();

    return detail;
};

PublishHandler.prototype.storeEvent = function (msg) {
    // store message in history
    /*this.storage.Event.create({
        content: msg.toString()
    }).success(function (message) {
        node.addEvent(message).success(function () {
            // message is added
        });
    });*/
};

/**
 * @description publishes a new event
 * @param stanza full pubsub message stanza
 * @param pubsub already extracted pubsub child node
 * @see http://xmpp.org/extensions/xep-0060.html#publisher-publish
 */
PublishHandler.prototype.handlePublish = function (user, node, stanza, publish) {
    logger.debug('handlePublish');
    var self = this;
    logger.debug('handlePublish');
    logger.debug(stanza.toString());

    // if node is available
    if (node) {
        logger.debug('PUBLISH to ' + node.name);
        logger.debug(stanza.toString());

        // extract all items
        var extractedItems = this.extractItems(publish);
        
        // check if we need to deliver the payload to subscriber
        this.deliverPayload(node).then(function (deliver) {
            console.log('deliver payload: ' + deliver);

            var attachment= null;
            if (deliver) {
                attachment = extractedItems.payload;
            } else {
                attachment = extractedItems.items;
            }

            // generate message for all subscribers
            var msg = self.generateMessageStanza(node, attachment );

            // store event
            self.storeEvent(msg);

            // send response to sender
            self.sendSuccess(stanza, self.generatePublishedStanza(node, extractedItems.items));

            // send notification message to subscriber
            node.getSubscribers().then(
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
                    logger.debug('error' + error);
                }
            );

        });

    } else {
        // TODO send error that the node is not available
        logger.error('node not there');
    }
};

module.exports = PublishHandler;