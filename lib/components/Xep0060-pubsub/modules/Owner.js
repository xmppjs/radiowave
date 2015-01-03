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
 * create a new node in our database
 */
Owner.prototype.createNewNode = function (user, nodename, configuration) {
  logger.debug('create node ' + nodename + ' with ' + JSON.stringify(configuration));
  var self = this;

  var channel = null;

  // create new channel
  return self.storage.Channel.create({
    name: nodename
  }).then(function (chan) {
    logger.debug('channel ' + chan.name + ' created');
    channel = chan;

    // add assiciation between channel and user
    return user.addChannel(channel, {
      affiliation: self.storage.ChannelSub.Affiliation.Owner,
      substate: self.storage.ChannelSub.SubState.Member
    })
  }).then(function () {
    logger.debug('start configuring node');
    return channel.setConfig(configuration);
  }).then(function () {
    logger.debug('node configured');
  })
};

/**
 * handle xmpp create stanza for a user
 */
Owner.prototype.handleCreate = function (user, stanza) {
  logger.debug('handleCreate');
  var self = this;
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

  this.createNewNode(user, nodename, configuration).then(function () {
    self.sendSuccess(stanza, detail);
  }).catch(function (err) {
    logger.error(err);
    self.sendError(stanza, pubutil.Error.Conflict);
  });
};

/**
 * handle xmpp delete stanza
 */
Owner.prototype.handleDelete = function (user, node, stanza) {
  logger.debug('handleDelete');

  // TODO verify that delete request is from owner

  var self = this;

  node.destroy().then(function () {
    logger.debug('node removed');
    self.sendSuccess(stanza);
  }).catch(function (err) {
    logger.debug('node could not be removed', err);
    self.sendError(stanza);
  });
};

Owner.prototype.handle = function (stanza) {

  var pubsub = stanza.getChild('pubsub', NS.PUBSUB);

  if (!pubsub) {
    pubsub = stanza.getChild('pubsub', NS.PUBSUB_OWNER);
  }

  // detect method
  var method, pubsubEl = null;
  if (pubsub.getChild('create')) {
    method = 'create';
    pubsubEl = pubsub.getChild('create');
  } else if (pubsub.getChild('delete', NS.PUBSUB_OWNER)) {
    method = 'delete';
    pubsubEl = pubsub.getChild('delete');
  }

  // process
  var self = this;
  var fromJid = new JID(stanza.attrs.from).bare().toString();
  this.storage.findOrCreateUser(fromJid).spread(function (user, created) { // jshint ignore:line
    // detect node name
    var nodename = pubsubEl.attrs.node;
    logger.debug('nodename: ' + nodename);

    // okay, we have the user
    switch (method) {
    case 'create':
      self.handleCreate(user, stanza, pubsubEl);
      break;

    case 'delete':
      pubutil.findChannel(self.storage, nodename, user, false).then(function (node) {
        logger.debug('found: ' + node);
        if (node) {
          self.handleDelete(user, node, stanza, pubsubEl);
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

module.exports = Owner;
