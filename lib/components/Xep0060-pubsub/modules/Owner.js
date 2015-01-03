'use strict';

var util = require('util'),
  ltx = require('ltx'),
  Promise = require('bluebird'),
  XModule = require('../../../core/XModule'),
  NS = require('../namespace'),
  JID = require('node-xmpp-core').JID,
  uuid = require('node-uuid'),
  pubutil = require('../Util'),
  logger = require('../../../core/Logger')('xep-0060:owner');

/**
 * Implements the owner use cases
 * @see http://www.xmpp.org/extensions/xep-0060.html#owner
 */
var Owner = function (storage, options) {
  XModule.call(this);

  // storage
  this.storage = storage;

  // pubsub options
  this.options = options;
};

util.inherits(Owner, XModule);

Owner.prototype.name = 'XEP-0060: Owner';

Owner.prototype.match = function (stanza) {
  // owner requests
  return (
    stanza.is('iq') &&
    stanza.getChild('pubsub', NS.PUBSUB) &&
    stanza.getChild('pubsub', NS.PUBSUB).getChild('create')
  ) ||
  // configure requests
  (
    stanza.is('iq') &&
    stanza.getChild('pubsub', NS.PUBSUB_OWNER) &&
    stanza.getChild('pubsub', NS.PUBSUB_OWNER).getChild('delete')
  );
};

/**
 * extracts the configuration from a xml stanza
 */
Owner.prototype.XMLtoJSONConfiguration = function (pubsubEl) {
  var configuration = [];
  try {
    // extract configuration
    var configure = pubsubEl.getChild('configure');
    if (configure) {
      var x = configure.getChild('x', 'jabber:x:data');
      if (x) {
        var fields = x.getChildren('field');
        for (var i = 0, l = fields.length; i < l; i++) {
          configuration.push({
            key: fields[i].attrs['var'],
            value: fields[i].getChild('value').text()
          });
        }
      }
    }
  } catch (err) {
    logger.error(err);
  }
  return configuration;
};

/**
 * handle xmpp create stanza for a user
 */
Owner.prototype.handleCreate = function (stanza) {
  logger.debug('handleCreate');

  var self = this;
  var storage = this.storage;
  var detail = null;

  // extract nodename
  var pubsub = stanza.getChild('pubsub', NS.PUBSUB);
  var create = pubsub.getChild('create');
  var nodename = create.attrs.node;

  if (nodename === undefined) {
    nodename = null;
  }

  // generate instant nodename
  if (nodename === null) {
    nodename = uuid.v4();

    // generate response message
    detail = new ltx.Element(
      'pubsub', {
        'xmlns': 'http://jabber.org/protocol/pubsub'
      }
    ).c(
      'create', {
        node: nodename
      }).up();
  }

  logger.debug('nodename: ' + nodename);

  var configuration = this.XMLtoJSONConfiguration(pubsub);
  logger.debug('configuration: ' + JSON.stringify(configuration));

  var fromJid = new JID(stanza.attrs.from).bare().toString();
  var transaction = null;
  var dbopts = {}

  storage.sequelize.transaction().then(function (t) {
    transaction = t;
    dbopts = {
      transaction: transaction
    }
    return storage.findUser(fromJid, dbopts)
  }).then(function (user) {
    return storage.addChannel(user, {
      name: nodename
    }, dbopts)
  }).then(function (channel) {
    return channel.setConfig(configuration, dbopts);
  }).then(function () {
    self.sendSuccess(stanza, detail);
  }).then(function(){
    return transaction.commit();
  }).catch(function (err) {
    logger.warn(err);
    self.sendError(stanza, pubutil.Error.Conflict);
    transaction.rollback();
  });
};

/**
 * handle xmpp delete stanza
 */
Owner.prototype.handleDelete = function (stanza) {
  logger.debug('handleDelete');

  var self = this;
  var storage = this.storage;

  var pubsub = stanza.getChild('pubsub', NS.PUBSUB_OWNER);
  var deleteEl = pubsub.getChild('delete', NS.PUBSUB_OWNER)
  var nodename = deleteEl.attrs.node;

  var fromJid = new JID(stanza.attrs.from).bare().toString();
  var node, user, transaction = null;
  var dbopts = {};

  storage.sequelize.transaction().then(function (t) {
    transaction = t;
    dbopts = {
      transaction: transaction
    }
    return storage.findUser(fromJid, dbopts)
  }).then(function (u) {
    user = u;
    logger.debug('found user ' + JSON.stringify(user))
    return storage.findChannel(nodename, dbopts)
  }).then(function (n) {
    node = n
    if (!node) {
      throw new Error ('node not found')
    }

    logger.debug('found node ' + JSON.stringify(node))
    return node.isOwner(user, dbopts);
  }).then(function () {
    return node.destroy(dbopts)
  }).then(function () {
    logger.debug('node removed');
    self.sendSuccess(stanza);
  }).then(function(){
    return transaction.commit();
  }).catch(function (err) {
    logger.error('node could not be removed', err);

    if (err.message === 'node not found') {
      self.sendError(stanza, pubutil.Error.NotFound);
    } else {
      self.sendError(stanza);
    }

    transaction.rollback();
  });
};

Owner.prototype.handle = function (stanza) {

  var pubsub = stanza.getChild('pubsub', NS.PUBSUB);

  if (!pubsub) {
    pubsub = stanza.getChild('pubsub', NS.PUBSUB_OWNER);
  }

  // detect method
  var method = null;
  if (pubsub.getChild('create')) {
    method = 'create';
  } else if (pubsub.getChild('delete', NS.PUBSUB_OWNER)) {
    method = 'delete';
  }

  switch (method) {
  case 'create':
    this.handleCreate(stanza);
    break;
  case 'delete':
    this.handleDelete(stanza);
    break;
  default:
    this.sendError(stanza, pubutil.Error.NotFound);
  }

  return true;
};

module.exports = Owner;
