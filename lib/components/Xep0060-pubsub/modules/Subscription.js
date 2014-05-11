'use strict';

var util = require('util'),
    XModule = require('../../../core/XModule'),
    ltx = require('ltx'),
    JID = require('node-xmpp-core').JID,
    NS = require('../namespace'),
    Iq = require('node-xmpp-core').Stanza.Iq,
    pubutil = require('../Util');

var Subscription = function (storage, options) {
    XModule.call(this);
    this.logger = require('../../../core/Logger')('xep-0060:subscription');

    // storage
    this.storage = storage;

    // pubsub options
    this.options = options;
};

util.inherits(Subscription, XModule);

Subscription.prototype.name = 'XEP-0060: Subscription';

Subscription.prototype.match = function (stanza) {
    // owner requests
    return (stanza.is('iq') && stanza.getChild('pubsub', NS.PUBSUB) && stanza.getChild('pubsub', NS.PUBSUB).getChild('subscribe')) ||
    // configure requests
    (stanza.is('iq') && stanza.getChild('pubsub', NS.PUBSUB) && stanza.getChild('pubsub', NS.PUBSUB).getChild('unsubscribe'));
};

/** 
 * @description sends the history to the given jid
 * @param node pub sub node
 * @param jid reciever of the histroy events
 *
 * TODO make dependend on node default
 * @see http://xmpp.org/extensions/xep-0060.html#subscriber-subscribe-last
 */
Subscription.prototype.sendHistory = function (node, jid) {
    this.logger.debug('send history');
    var self = this;
    node.getEvents().success(function (events) {
        // logger.debug(JSON.stringify(events));
        if (events && events.length && events.length > 0) {

            events.forEach(function(evt){
                // logger.debug(JSON.stringify(evt));
                try {
                    // extract message
                    var el = ltx.parse(evt.content);

                    // send to  jid
                    el.attrs.to = jid;

                    // route message
                    self.send(el, null);

                } catch (err) {
                    self.logger.error(err);
                }
            });
        }
    }).error(function(err){
        self.logger.error(err);
    });
};

/**
 * @description subscribes a new jid
 * @param stanza full pubsub message stanza
 * @param pubsub already extracted pubsub child node
 * @see http://xmpp.org/extensions/xep-0060.html#subscriber-subscribe
 */
Subscription.prototype.handleSubscribe = function (user, node, stanza, subcribeEl) {
    this.logger.debug('handleSubscribe');
    var self = this;
    
    var fromJid = new JID(stanza.attrs.from);
    var subscriberJid = new JID(subcribeEl.attrs.jid);

    // check that jids match
    if (!fromJid.bare().equals(subscriberJid.bare())) {
        this.logger.error('subscriptions jids do not match : ' + fromJid.toString() + ' != ' + subscriberJid.toString());
        // this is a wrong stanza
        this.sendError(stanza, pubutil.Error.BadRequest);
        return;
    }

    this.logger.debug('Subscribe ' + subscriberJid.toString() + ' to ' + node.name);

    // store new subscriber
    node.subscribe(user, {
        affiliation: self.storage.ChannelSub.Affiliation.Member,
        substate: self.storage.ChannelSub.SubState.Subscribed
    }).then(
        function () {
            // Success Case, send confirmation
            var msg = new Iq({
                from: self.options.domain,
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
            self.logger.error(err);
            self.sendError(stanza, pubutil.Error.BadRequest);
        }
    );
};

/**
 * @description closes a subscription
 * @param stanza full pubsub message stanza
 * @param pubsub already extracted pubsub child node
 * @see http://xmpp.org/extensions/xep-0060.html#subscriber-unsubscribe
 */
Subscription.prototype.handleUnsubscribe = function (user, node, stanza, unsubscribeEl) {
    this.logger.debug('handleUnsubscribe');
    var self = this;

    var fromJid = new JID(stanza.attrs.from);
    var subscriberJid = new JID(unsubscribeEl.attrs.jid);

    // check that jids match
    if (!fromJid.bare().equals(subscriberJid)) {
        // this is a wrong stanza
        this.sendError(stanza, pubutil.Error.BadRequest);
        return;
    }

    // unregister subscriber
    this.logger.debug('user' + fromJid.bare().toString() + ' unsubscribe the node');
    node.unsubscribe(user).then(
        function () {
            self.sendSuccess(stanza);
        }).
    catch (
        function () {
            self.sendError(stanza, pubutil.Error.NotSubscribed);
        });
};

Subscription.prototype.handle = function (stanza) {
    var pubsub = stanza.getChild('pubsub', NS.PUBSUB);

    // detect method
    var method, pubsubEl = null;
    if (pubsub.getChild('subscribe')) {
        method = 'subscribe';
        pubsubEl = pubsub.getChild('subscribe');
    } else if (pubsub.getChild('unsubscribe')) {
        method = 'unsubscribe';
        pubsubEl = pubsub.getChild('unsubscribe');
    }

    // process
    var self = this;
    var fromJid = new JID(stanza.attrs.from).bare().toString();
    this.storage.findOrCreateUser(fromJid).then(function (user) {
        // detect node name
        var nodename = pubsubEl.attrs.node;
        self.logger.debug('nodename: ' + nodename);

        // okay, we have the user
        switch (method) {
        case 'subscribe':
            // todo use options
            pubutil.findChannel(self.storage, nodename, user, self.options.autoCreateChannel).then(function(node){
                self.logger.debug('found: ' + node);
                if (node) {
                    self.handleSubscribe(user, node, stanza, pubsubEl);
                } else {
                    self.sendError(stanza, pubutil.Error.NotFound);
                }
            });
            
            break;
        case 'unsubscribe':
            pubutil.findChannel(self.storage, nodename, user, false).then(function(node){
                self.logger.debug('found: ' + node);
                if (node) {
                    self.handleUnsubscribe(user, node, stanza, pubsubEl);
                } else {
                    self.sendError(stanza, pubutil.Error.NotFound);
                }
            });
            break;
        default:
            self.sendError(stanza, pubutil.Error.NotFound);
        }

    });

    return true;
};

module.exports = Subscription;