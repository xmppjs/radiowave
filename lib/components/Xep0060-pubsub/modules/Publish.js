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
  return (stanza.is('iq') && stanza.getChild('pubsub', NS.PUBSUB) && stanza.getChild('pubsub', NS.PUBSUB).getChild('publish')) ||
    // configure requests
    (stanza.is('iq') && stanza.getChild('pubsub', NS.PUBSUB) && stanza.getChild('pubsub', NS.PUBSUB).getChild('retract'));
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
    items: itemswithoutpayload,
    payload: itemswithpayload
  };
};

/**
 * determine if the node has payload delivery activated
 */
Publish.prototype.deliverPayload = function (node, publishEl) {
  var self = this;
  return new Promise(function (resolve) {

    node.getConfigurations({
      where: {
        key: 'pubsub#deliver_payloads'
      }
    }).then(function (conf) {
      logger.debug('preference of node: ' + JSON.stringify(conf));
      var deliver = true;

      if (conf && conf.length === 1) {
        if (conf[0].value === '0') {
          deliver = false;
        }
      }

      resolve(deliver);
    }).catch(function () {
      resolve(true);
    });
  });
};

/**
 * @see http://xmpp.org/extensions/xep-0060.html#publisher-publish-success-withpayload
 */
Publish.prototype.generateMessageStanza = function (node, attachment) {
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
Publish.prototype.generatePublishedStanza = function (node, items) {
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

/** 
 * stores an event to database
 */
Publish.prototype.storeEvent = function (node, msg) {

  // store message in history
  this.storage.ChannelEvent.create({
    content: msg.toString()
  }).then(function (message) {
    node.addEvent(message).then(function () {
      // message is added
    });
  });
};

/**
 * @description publishes a new event
 * @param stanza full pubsub message stanza
 * @param pubsub already extracted pubsub child node
 * @see http://xmpp.org/extensions/xep-0060.html#publisher-publish
 */
Publish.prototype.handlePublish = function (user, node, stanza, publish) {
  logger.debug('handlePublish');
  var self = this;
  logger.debug(stanza.toString());

  // if node is available
  if (node) {
    logger.debug('PUBLISH to ' + node.name);
    logger.debug(stanza.toString());

    // extract all items
    var extractedItems = this.extractItems(publish);

    // check if we need to deliver the payload to subscriber
    this.deliverPayload(node).then(function (deliver) {
      logger.debug('deliver payload: ' + deliver);

      var attachment = null;
      if (deliver) {
        attachment = extractedItems.payload;
      } else {
        attachment = extractedItems.items;
      }

      // generate message for all subscribers
      var msg = self.generateMessageStanza(node, attachment);

      // store event
      // TODO: only send history if persistence is activated
      // self.storeEvent(node, msg);

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

  // process
  var self = this;
  var fromJid = new JID(stanza.attrs.from).bare().toString();
  this.storage.findUser(fromJid).then(function (user) {
    // detect node name
    var nodename = pubsubEl.attrs.node;
    logger.debug('nodename: ' + nodename);

    // okay, we have the user
    switch (method) {
    case 'publish':
      pubutil.findChannel(self.storage, nodename, user, self.options.autoCreateChannel).then(function (node) {
        logger.debug('found: ' + node);
        if (node) {
          self.handlePublish(user, node, stanza, pubsubEl);
        } else {
          self.sendError(stanza, pubutil.Error.NotFound);
        }
      });
      break;
    default:
      self.sendError(stanza, pubutil.Error.NotFound);
    }

  }).
  catch(function (err) {
    logger.error(err);
  });

  if (method) {
    return true;
  } else {
    return false;
  }
};

module.exports = Publish;
