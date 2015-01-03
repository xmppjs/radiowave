'use strict';

var util = require('util'),
  XModule = require('../../../core/XModule'),
  JID = require('node-xmpp-core').JID,
  XmppMessage = require('node-xmpp-core').Stanza.Message,
  uuid = require('node-uuid'),
  mucutil = require('../Util'),
  logger = require('../../../core/Logger')('xep-0045:message');

function Message(storage, options) {
  XModule.call(this);
  this.storage = storage;
  this.options = options;
}

util.inherits(Message, XModule);

Message.prototype.name = 'XEP-0045: Message';

Message.prototype.match = function (stanza) {

  // message
  return ((stanza.is('message') && stanza.attrs.type === 'groupchat'));

};

/**
 * @description stores a given message in the given room
 * @param room muc room
 * @param msg xml message
 */
Message.prototype.storeMessage = function (room, msg, options) {
  // store message in history
  return this.storage.RoomMessage.create({
    content: msg.toString()
  }, options).then(function (message) {
    return room.addMessage(message, options)
  })
};

/**
 * builds a group message
 */
Message.prototype.buildMessage = function (params) {

  // extract message body
  var msg = new XmppMessage({
    'from': params.from,
    'to': '',
    'type': 'groupchat'
  });
  msg.children = params.body;

  return msg;
}

/**
 * Sens a message to all participants of a room
 */
Message.prototype.sendMessage = function (members, msg) {

  logger.debug('send message to all members');
  
  for (var i = 0, l = members.length; i < l; i += 1) {
    var member = members[i];

    var clientmsg = msg.clone();
    clientmsg.attrs.to = member.jid;
    // assign a new tracking id
    clientmsg.attrs.id = uuid.v4();
    this.send(clientmsg);
  }
};

/**
 * Implement 7.4
 * @see http: //xmpp.org/extensions/xep-0045.html#message
 */
Message.prototype.handleOccupantMessage = function (stanza) {
  logger.debug('muc handle message');
  var self = this;
  var storage = this.storage;

  var roomname = mucutil.determineRoomname(stanza);
  var userjid = stanza.attrs.from;

  var user = null;
  var room = null;
  var msg = null;

  var transaction = null;

  storage.sequelize.transaction().then(function (t) {
    transaction = t;
    // find user (may not be a member of the room)
    return storage.findUser(mucutil.getBareJid(userjid), {
      transaction: transaction
    })
  }).then(function (u) {
    user = u;
    // find a roo
    return storage.findRoom(roomname, {
      transaction: transaction
    });
  }).then(function (r) {
    room = r;
    // found room, check that the user is a member of the room
    return room.isMember(user, {
      transaction: transaction
    });
  }).then(function (member) {

    // find nickname for user
    var nickname = member.RoomMember.nickname;

    // build message
    msg = self.buildMessage({
      'from' : new JID(room.name, self.options.domain, nickname),
      'body' : stanza.children
    })

    // save message
    return self.storeMessage(room, msg, {
      transaction: transaction
    });
  }).then(function(){
    // read all members of room
    return room.getMembers({}, {
      transaction: transaction
    })
  }).then(function (members) {
    // iterate over room members and submit message
    self.sendMessage(members, msg);
  }).then(function(){
    return transaction.commit();
  }).catch(function (err) {
    logger.error(err);
    transaction.rollback();
    // room does not exists
    self.sendError(stanza, mucutil.Error.NotFound);
  });

  return true;
};

Message.prototype.handle = function (stanza) {
  var handled = false;

  // handle messages
  var msg = stanza.is('message');
  if (msg && stanza.attrs.type === 'groupchat') {
    handled = this.handleOccupantMessage(stanza);
  }

  return handled;
};

module.exports = Message;
