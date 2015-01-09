'use strict';

var util = require('util'),
  XModule = require('../../../core/XModule'),
  ltx = require('ltx'),
  JID = require('node-xmpp-core').JID,
  NS = require('../namespace'),
  Iq = require('node-xmpp-core').Stanza.Iq,
  pubutil = require('../Util'),
  logger = require('../../../core/Logger')('xep-0060:subscription');

var Subscription = function (storage, options) {
  XModule.call(this);

  // storage
  this.storage = storage;

  // pubsub options
  this.options = options;
};

util.inherits(Subscription, XModule);

Subscription.prototype.name = 'XEP-0060: Subscription';

Subscription.prototype.match = function (stanza) {
  // owner requests
  return (
    stanza.is('iq') &&
    stanza.getChild('pubsub', NS.PUBSUB) &&
    stanza.getChild('pubsub', NS.PUBSUB).getChild('subscribe')
  ) ||
  // configure requests
  (
    stanza.is('iq') &&
    stanza.getChild('pubsub', NS.PUBSUB) &&
    stanza.getChild('pubsub', NS.PUBSUB).getChild('unsubscribe')
  );
};

/** 
 * @description sends the history to the given jid
 * @param node pub sub node
 * @param jid reciever of the histroy events
 *
 * TODO make dependend on node default
 * @see http://xmpp.org/extensions/xep-0060.html#subscriber-subscribe-last
 */
Subscription.prototype.sendHistory = function (node, jid, options) {
  logger.debug('send history');
  var self = this;
  return node.getEvents({}, options).then(function (events) {
    // logger.debug(JSON.stringify(events));
    if (events && events.length && events.length > 0) {

      events.forEach(function (evt) {
        // logger.debug(JSON.stringify(evt));
        try {
          // extract message
          var el = ltx.parse(evt.content);

          // send to  jid
          el.attrs.to = jid;

          // route message
          self.send(el, null);

        } catch (err) {
          logger.error(err);
        }
      });
    }
  }).catch(function (err) {
    logger.error(err);
  });
};

/**
 * @description subscribes a new jid
 * @param stanza full pubsub message stanza
 * @param pubsub already extracted pubsub child node
 * @see http://xmpp.org/extensions/xep-0060.html#subscriber-subscribe
 */
Subscription.prototype.handleSubscribe = function (stanza, subcribeEl) {
  logger.debug('handleSubscribe');

  var self = this;
  var storage = this.storage;

  var fromJid = new JID(stanza.attrs.from).bare();
  var subscriberJid = new JID(subcribeEl.attrs.jid);

  // check that jids match
  if (!fromJid.equals(subscriberJid.bare())) {
    logger.error('subscriptions jids do not match : ' + fromJid.toString() + ' != ' + subscriberJid.toString());
    // this is a wrong stanza
    this.sendError(stanza, pubutil.Error.BadRequest);
    return;
  }

  // detect node name
  var nodename = subcribeEl.attrs.node;
  logger.debug('nodename: ' + nodename);

  var user, node, transaction = null;
  var dbopts = {};

  storage.sequelize.transaction().then(function (t) {
    transaction = t;
    dbopts = {
      transaction: transaction
    }
    return storage.findUser(fromJid.toString(), dbopts)
  }).then(function (u) {
    user = u;
    return pubutil.findChannel(storage, nodename, user, self.options.autoCreateChannel, dbopts)
  }).then(function (n) {
    node = n;

    if (!node) {
      throw new Error ('node-not-found');
    }

    logger.debug('Subscribe ' + subscriberJid.toString() + ' to ' + node.name);

    // store new subscriber
    return node.subscribe(user, {
      affiliation: self.storage.ChannelSub.Affiliation.Member,
      substate: self.storage.ChannelSub.SubState.Subscribed
    }, dbopts);
  }).then(function () {
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
    // TODO: only send history if persistence is activated
    return self.sendHistory(node, subcribeEl.attrs.jid, dbopts);
  }).then(function(){
    return transaction.commit();
  }).catch(function(err){
    logger.error(err);
    if (err.message === 'node-not-found') {
      self.sendError(stanza, pubutil.Error.NotFound);
    } else {
      self.sendError(stanza, pubutil.Error.BadRequest);
    }
    transaction.rollback();
  });
};

/**
 * @description closes a subscription
 * @param stanza full pubsub message stanza
 * @param pubsub already extracted pubsub child node
 * @see http://xmpp.org/extensions/xep-0060.html#subscriber-unsubscribe
 */
Subscription.prototype.handleUnsubscribe = function (stanza, unsubscribeEl) {
  logger.debug('handleUnsubscribe');
  var self = this;
  var storage = this.storage;

  var fromJid = new JID(stanza.attrs.from).bare();
  var subscriberJid = new JID(unsubscribeEl.attrs.jid).bare();

  // check that jids match
  if (!fromJid.equals(subscriberJid)) {
    logger.warn('Sender and subsciber do not match: ' + stanza.toString());
    // this is a wrong stanza
    this.sendError(stanza, pubutil.Error.BadRequest);
    return;
  }

  // detect node name
  var nodename = unsubscribeEl.attrs.node;
  logger.debug('nodename: ' + nodename);

  var user, node, transaction = null;
  var dbopts = {};

  storage.sequelize.transaction().then(function (t) {
    transaction = t;
    dbopts = {
      transaction: transaction
    }
    return storage.findUser(fromJid.toString(), dbopts)
  }).then(function (u) {
    user = u;
    return pubutil.findChannel(storage, nodename, user, false, dbopts)
  }).then(function (n) {
    node = n;
    logger.debug('unsubscribe: ' + JSON.stringify(node));
    if (!node) {
      throw new Error ('node-not-found');
    }

    // check if sender is subsciber of channel
    return node.isSubscriber(user, dbopts).catch(function(){
      throw new Error('not-subscribed');
    })
  }).then(function () {
    // unregister subscriber
    logger.debug('user ' + fromJid.toString() + ' unsubscribes the node ' + node.name);
    return node.unsubscribe(user, dbopts)
  }).then(function () {
    self.sendSuccess(stanza);
  }).then(function(){
    return transaction.commit();
  }).catch(function (err) {
    logger.warn(err);

    if (err.message === 'node-not-found') {
      self.sendError(stanza, pubutil.Error.NotFound);
    } else if (err.message === 'not-subscribed') {
      self.sendError(stanza, pubutil.Error.NotSubscribed);
    }
    else {
      self.sendError(stanza, pubutil.Error.BadRequest);
    }

    transaction.rollback();
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

  // okay, we have the user
  switch (method) {
  case 'subscribe':
    this.handleSubscribe(stanza, pubsubEl);
    break;
  case 'unsubscribe':
    this.handleUnsubscribe(stanza, pubsubEl);
    break;
  default:
    this.sendError(stanza, pubutil.Error.NotFound);
  }

  return true;
};

module.exports = Subscription;
