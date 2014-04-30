'use strict';

var util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xep-0060'),
    XModule = require('../../../core/XModule'),
    ltx = require('ltx'),
    JID = require('node-xmpp-core').JID,
    NS = require('../namespace'),
    Iq = require('node-xmpp-core').Stanza.Iq;

var SubscriptionHandler = function (storage) {
    XModule.call(this);
    this.storage = storage;
};

util.inherits(SubscriptionHandler, XModule);

SubscriptionHandler.prototype.Error = {};
SubscriptionHandler.prototype.Error.NotSubscribed = ltx.parse('<error type=\'cancel\'><unexpected-request xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/><not-subscribed xmlns=\'http://jabber.org/protocol/pubsub#errors\'/></error>');
SubscriptionHandler.prototype.Error.BadRequest = ltx.parse('<error type=\'modify\'><bad-request xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/><invalid-jid xmlns=\'http://jabber.org/protocol/pubsub#errors\'/></error>');

/** 
 * @description sends the history to the given jid
 * @param node pub sub node
 * @param jid reciever of the histroy events
 *
 * TODO make dependend on node default
 * @see http://xmpp.org/extensions/xep-0060.html#subscriber-subscribe-last
 */
SubscriptionHandler.prototype.sendHistory = function (node, jid) {
    console.log('send history');
    var self = this;
    node.getEvents().success(function (events) {
        // console.log(JSON.stringify(events));
        if (events && events.length && events.length > 0) {

            events.forEach(function(evt){
                // console.log(JSON.stringify(evt));
                try {
                    // extract message
                    var el = ltx.parse(evt.content);

                    // send to  jid
                    el.attrs.to = jid;

                    // route message
                    self.send(el, null);

                } catch (err) {
                    console.error(err);
                }
            });
        }
    }).error(function(err){
        console.error(err);
    });
};

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

    logger.debug('Subscribe ' + subscriberJid.toString() + ' to ' + node.name);

    // store new subscriber
    node.subscribe(user, {
        affiliation: self.storage.ChannelSub.Affiliation.Member,
        substate: self.storage.ChannelSub.SubState.Subscribed
    }).then(
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

            // send old itemes to new subscriber
            self.sendHistory(node, subcribeEl.attrs.jid);

        }).
    catch (
        function (err) {
            // error
            logger.error(err);
            self.sendError(stanza, self.Error.BadRequest);
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
    node.unsubscribe(user).then(
        function () {
            self.sendSuccess(stanza);
        }).
    catch (
        function () {
            self.sendError(stanza, self.Error.NotSubscribed);
        });
};

module.exports = SubscriptionHandler;