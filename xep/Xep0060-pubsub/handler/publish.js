'use strict';

var util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xep-0060'),
    XepComponent = require('../../XepComponent'),
    ltx = require('ltx'),
    uuid = require('node-uuid'),
    Message = require('node-xmpp-core').Stanza.Message;

var PublishHandler = function () {
};

util.inherits(PublishHandler, XepComponent);

/**
 * @description publishes a new event
 * @param stanza full pubsub message stanza
 * @param pubsub already extracted pubsub child node
 * @see http://xmpp.org/extensions/xep-0060.html#publisher-publish
 */
PublishHandler.prototype.handlePublish = function (node, stanza, publish) {
    logger.debug('handlePublish');
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
                logger.debug('error' + error);
            }
        );
    } else {
        // TODO send error that the node is not available
        logger.error('node not there');
    }
};

module.exports = PublishHandler;