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

SubscriptionHandler.prototype.Error = {};
SubscriptionHandler.prototype.Error.NotSubscribed = ltx.parse('<error type=\'cancel\'><unexpected-request xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/><not-subscribed xmlns=\'http://jabber.org/protocol/pubsub#errors\'/></error>');
SubscriptionHandler.prototype.Error.BadRequest = ltx.parse('<error type=\'modify\'><bad-request xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/><invalid-jid xmlns=\'http://jabber.org/protocol/pubsub#errors\'/></error>');
/**
 * @description subscribes a new jid
 * @param stanza full pubsub message stanza
 * @param pubsub already extracted pubsub child node
 * @see http://xmpp.org/extensions/xep-0060.html#subscriber-subscribe
 */
SubscriptionHandler.prototype.handleSubscribe = function (user, node, stanza, subcribeEl) {
    logger.debug('handleSubscribe');
    var self = this;
    
    var fromJid = new JID(stanza.attrs.from);
    var subscriberJid = new JID(subcribeEl.attrs.jid);

    // check that jids match
    if (!fromJid.bare().equals(subscriberJid.bare())) {
        logger.error('subscriptions jids do not match : ' + fromJid.toString() + ' != ' + subscriberJid.toString());
        // this is a wrong stanza
        this.sendError(stanza, self.Error.BadRequest);
        return;
    }

    logger.debug('SUBSCRIBE: ' + subscriberJid.toString() + ' -> ' + node.name);

    // store new subscriber
    node.subscribe(subscriberJid.bare().toString()).then(
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
                'node': subcribeEl.attrs.node,
                'jid': subcribeEl.attrs.jid,
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
SubscriptionHandler.prototype.handleUnsubscribe = function (user, node, stanza, unsubscribeEl) {
    logger.debug('handleUnsubscribe');
    var self = this;

    var fromJid = new JID(stanza.attrs.from);
    var subscriberJid = new JID(unsubscribeEl.attrs.jid);

    // check that jids match
    if (!fromJid.bare().equals(subscriberJid)) {
        // this is a wrong stanza
        this.sendError(stanza, self.Error.BadRequest);
        return;
    }

    // unregister subscriber
    logger.debug('user' + fromJid.bare().toString() + ' unsubscribe the node');
    node.unsubscribe(fromJid.bare().toString()).then(
        function () {
            self.sendSuccess(stanza);
        }).
    catch (
        function () {
            self.sendError(stanza, self.Error.NotSubscribed);
        });
};

module.exports = SubscriptionHandler;