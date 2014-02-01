'use strict';

var util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xep-0060'),
    XepComponent = require('../../XepComponent'),
    ltx = require('ltx'),
    JID = require('node-xmpp-core').JID,
    NS = require('../namespace'),
    Iq = require('node-xmpp-core').Stanza.Iq;

var SubscriptionHandler = function () {};

util.inherits(SubscriptionHandler, XepComponent);

/**
 * @description subscribes a new jiid
 * @param stanza full pubsub message stanza
 * @param pubsub already extracted pubsub child node
 * @see http://xmpp.org/extensions/xep-0060.html#subscriber-subscribe
 */
SubscriptionHandler.prototype.handleSubscribe = function (node, stanza, sub) {
    logger.debug('handleSubscribe');
    var self = this;
    var jid = sub.attrs.jid;

    var from = new JID(stanza.attrs.from);
    var subscriber = new JID(sub.attrs.jid);

    // check that jids match
    if (!from.bare().equals(subscriber.bare())) {
        logger.error('subscriptions jids do not match : ' + from.toString() + ' != ' + subscriber.toString());
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
                'xmlns': NS.PUBSUB
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
        }).
    catch (
        function (err) {
            // error
            logger.error(err);
        }
    );
};

/**
 * @description closes a subscription
 * @param stanza full pubsub message stanza
 * @param pubsub already extracted pubsub child node
 * @see http://xmpp.org/extensions/xep-0060.html#subscriber-unsubscribe
 */
SubscriptionHandler.prototype.handleUnsubscribe = function (node, stanza, unsubscribe) {
    logger.debug('handleUnsubscribe');
    var self = this;
    var errorXml = null;

    var userjid = new JID(stanza.attrs.from);
    var subscriber = new JID(unsubscribe.attrs.jid);

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
        }).
    catch (
        function () {
            errorXml = ltx.parse('<error type=\'cancel\'><unexpected-request xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/><not-subscribed xmlns=\'http://jabber.org/protocol/pubsub#errors\'/></error>');
            self.sendError(stanza, errorXml);
        });
};

module.exports = SubscriptionHandler;