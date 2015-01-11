'use strict';

var Promise = require('bluebird'),
  ltx = require('ltx'),
  uuid = require('node-uuid'),
  JID = require('node-xmpp-core').JID;

var helper = require('./helper');


function createNodeStanza(jid, node, id) {
  id = id || uuid.v4();
  var create = new ltx.Element('iq', {
    to: 'pubsub.example.net',
    from: jid,
    type: 'set',
    id: id
  }).c('pubsub', {
    'xmlns': 'http://jabber.org/protocol/pubsub'
  }).c('create', {
    'node': node
  });

  return create.root();
}

function deleteNodeStanza(jid, node, id) {
  id = id || uuid.v4();
  var deleteIq = new ltx.Element('iq', {
    to: 'pubsub.example.net',
    from: jid,
    type: 'set',
    id: id
  }).c('pubsub', {
    'xmlns': 'http://jabber.org/protocol/pubsub#owner'
  }).c('delete', {
    'node': node
  });

  return deleteIq.root();
}

function subscribeNodeStanza(jid, node, id) {
  id = id || uuid.v4();

  var subscribe = new ltx.Element('iq', {
    to: 'pubsub.example.net',
    from: jid,
    type: 'set',
    id: id
  }).c('pubsub', {
    'xmlns': 'http://jabber.org/protocol/pubsub'
  }).c('subscribe', {
    'node': node,
    'jid': new JID(jid.toString()).bare()
  });

  return subscribe;
}



module.exports = {
  'createNodeStanza': createNodeStanza,
  'deleteNodeStanza': deleteNodeStanza,
  'subscribeNodeStanza': subscribeNodeStanza
};