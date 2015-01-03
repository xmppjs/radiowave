'use strict';

var util = require('util'),
  XModule = require('../../../core/XModule'),
  ltx = require('ltx'),
  Promise = require('bluebird'),
  uuid = require('node-uuid'),
  NS = require('../namespace'),
  JID = require('node-xmpp-core').JID,
  Message = require('node-xmpp-core').Stanza.Message,
  pubutil = require('../Util'),
  logger = require('../../../core/Logger')('xep-0060:publish');

var Publish = function (storage, options) {
  XModule.call(this);

  // storage
  this.storage = storage;

  // pubsub options
  this.options = options;
};

util.inherits(Publish, XModule);

Publish.prototype.name = 'XEP-0060: Publish';

Publish.prototype.match = function (stanza) {
  // publish requests
  return (
    stanza.is('iq') &&
    stanza.getChild('pubsub', NS.PUBSUB) &&
    stanza.getChild('pubsub', NS.PUBSUB).getChild('publish')
  ) ||
  // configure requests
  (
    stanza.is('iq') &&
    stanza.getChild('pubsub', NS.PUBSUB) &&
    stanza.getChild('pubsub', NS.PUBSUB).getChild('retract')
  );
};

/**
 * @see http://xmpp.org/extensions/xep-0060.html#publisher-publish-success-withpayload
 */
Publish.prototype.buildMessageStanza = function (node, attachment) {
  var msg = new Message({
    from: this.options.domain,
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
Publish.prototype.buildPublishedStanza = function (node, items) {
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

Publish.prototype.extractItems = function (publishEl) {
  var itemswithoutpayload = [];
  var itemswithpayload = [];

  var childs = publishEl.getChildren('item');
  logger.debug('found items:  ' + childs.length);
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
    withoutPayload: itemswithoutpayload,
    payload: itemswithpayload
  };
};

/**
 * determine if the node has payload delivery activated
 */
Publish.prototype.isDeliveryWithPayload = function (node, options) {
  return new Promise(function (resolve) {
    var deliver = true;

    node.getConfigurations({
      where: {
        key: 'pubsub#deliver_payloads'
      }
    }, options).then(function (conf) {
      logger.debug('preference of node: ' + JSON.stringify(conf));

      if (conf && conf.length === 1) {
        if (conf[0].value === '0') {
          deliver = false;
        }
      }

      resolve(deliver);
    }).catch(function () {
      resolve(deliver);
    });
  });
};

/** 
 * stores an event to database
 */
Publish.prototype.storeEvent = function (node, msg, options) {

  // store message in history
  return this.storage.ChannelEvent.create({
    content: msg.toString()
  }, options).then(function (message) {
    return node.addEvent(message, options);
  });
};

/**
 * @description publishes a new event
 * @param stanza full pubsub message stanza
 * @param pubsub already extracted pubsub child node
 * @see http://xmpp.org/extensions/xep-0060.html#publisher-publish
 */
Publish.prototype.handlePublish = function (stanza) {
  logger.debug('handlePublish: ' + stanza.toString());

  var self = this;
  var storage = this.storage;
  var pubsub = stanza.getChild('pubsub', NS.PUBSUB);
  var publish = pubsub.getChild('publish');
  var nodename = publish.attrs.node; 
  var fromJid = new JID(stanza.attrs.from).bare().toString();

  var node, user, msg, transaction = null;
  var dbopts = {};

  storage.sequelize.transaction().then(function (t) {
    transaction = t;
    dbopts = {
      transaction: transaction
    }
    return storage.findUser(fromJid, dbopts)
  }).then(function (u) {
    user = u;
    return pubutil.findChannel(storage, nodename, user, self.options.autoCreateChannel, dbopts)
  }).then(function (n) {
    node = n;
    if (!node) {
      throw new Error ('node not found');
    }
    // check if sender is subsciber of channel
    return node.isSubscriber(user, dbopts);
   }).then(function () {
    // check if we need to deliver the payload to subscriber
    return self.isDeliveryWithPayload(node, dbopts);
  }).then(function (deliver) {
    logger.debug('deliver payload: ' + deliver);

    // extract all items
    var extractedItems = self.extractItems(publish);

    var attachment = null;
    if (deliver) {
      attachment = extractedItems.payload;
    } else {
      attachment = extractedItems.withoutPayload;
    }

    // generate message for all subscribers
    msg = self.buildMessageStanza(node, attachment);

    // store event
    // TODO: only send history if persistence is activated
    // self.storeEvent(node, msg, dbopts);

    // send response to sender
    self.sendSuccess(stanza, self.buildPublishedStanza(node, extractedItems.withoutPayload));

    // send notification message to subscriber
    return node.getSubscribers({}, dbopts);
  }).then(function (subscribers) {
    logger.debug('send events to subs ' + JSON.stringify(subscribers));
    for (var i = 0, l = subscribers.length; i < l; i += 1) {
      var subscriber = subscribers[i];

      var clientmsg = msg.clone();
      clientmsg.attrs.to = subscriber.jid;
      self.send(clientmsg);
    }
  }).then(function(){
    return transaction.commit();
  }).catch(function(err){
    logger.error(err);
    if (err.message === 'node not found') {
      self.sendError(stanza, pubutil.Error.NotFound);
    } else {
      self.sendError(stanza, pubutil.Error.BadRequest);
    }
    transaction.rollback();
  });
};

Publish.prototype.handle = function (stanza) {
  var pubsub = stanza.getChild('pubsub', NS.PUBSUB);

  // detect method
  var method, pubsubEl = null;
  if (pubsub.getChild('publish')) {
    method = 'publish';
    pubsubEl = pubsub.getChild('publish');
  }
  // retract is not supported yet
  else if (pubsub.getChild('retract')) {
    method = 'retract';
    pubsubEl = pubsub.getChild('retract');
  }
 
  // okay, we have the user
  switch (method) {
  case 'publish':
    this.handlePublish(stanza);
    break;
  default:
    this.sendError(stanza, pubutil.Error.NotFound);
  }

  return true;
};

module.exports = Publish;
