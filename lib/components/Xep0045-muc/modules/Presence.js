'use strict';

var util = require('util'),
  XModule = require('../../../core/XModule'),
  ltx = require('ltx'),
  XmppPresence = require('node-xmpp-core').Stanza.Presence,
  JID = require('node-xmpp-core').JID,
  NS = require('../namespace'),
  mucutil = require('../Util'),
  Promise = require('bluebird'),
  logger = require('../../../core/Logger')('xep-0045:presence');

function Presence(storage, options) {
  XModule.call(this);

  // storage
  this.storage = storage;

  // muc options
  this.options = options;
}

util.inherits(Presence, XModule);

Presence.prototype.name = 'XEP-0045: Presence';

Presence.prototype.match = function (stanza) {
  // presence
  return (stanza.is('presence'));
};

Presence.prototype.buildPresence = function (affiliation, role, jid) {

  var opts = {
    'affiliation': affiliation,
    'role': role
  };
  // send jid for non-anonymous rooms
  if (jid) {
    opts.jid = jid;
  }

  var presence = new XmppPresence({
    from: '',
    to: ''
  });
  presence.c('x', {
    'xmlns': NS.MUC_USER
  }).c('item', opts);

  return presence;
};

Presence.prototype.buildPresenceConfirmation = function (room, member, roomjid) {
  logger.debug('build presence confirmation from ' + roomjid + ' to ' + member.jid);

  // send client the confirmation
  var confirmMsg = new XmppPresence({
    from: roomjid.toString(),
    to: member.jid.toString()
  });
  var x = confirmMsg.c('x', {
    'xmlns': NS.MUC_USER
  });
  x.c('item', {
    'affiliation': member.affiliation,
    'role': member.role,
    'jid': member.jid
  });
  x.c('status', {
    'code': '110'
  });

  return confirmMsg;
};

Presence.prototype.buildPresenceLeave = function () {
  var presenceLeave = new XmppPresence({
    from: '',
    to: '',
    type: 'unavailable'
  });
  presenceLeave.c('x', {
    'xmlns': NS.MUC_USER
  }).c('item', {
    'affiliation': NS.MUC_AFFILIATION_ADMIN,
    'role': NS.MUC_ROLE_ADMIN
  });

  return presenceLeave;
}

Presence.prototype.buildPresenceLeaveConfirmation = function (roomjid, userjid) {

  var confirmMsg = new XmppPresence({
    from: roomjid,
    to: userjid,
    type: 'unavailable'
  });
  var x = confirmMsg.c('x', {
    'xmlns': NS.MUC_USER
  });
  x.c('item', {
    'affiliation': NS.MUC_AFFILIATION_ADMIN,
    'role': NS.MUC_ROLE_ADMIN
  });
  x.c('status', {
    'code': '110'
  });

  return confirmMsg;
}

Presence.prototype.sendJoinMessages = function (members, newMember, roomjid, nickname) {
  logger.debug('send join of ' + newMember.jid + ' to all participants');
  // iterate over existing members
  var newPresence = this.buildPresence(
    newMember.RoomMember.affiliation,
    newMember.RoomMember.role, 
    newMember.jid
  );
  var newuser = roomjid.bare();
  newuser.setResource(nickname);
  newPresence.attrs.from = newuser.toString(); // must be with nickname of user

  // send presence to each member
  for (var i = 0, l = members.length; i < l; i++) {
    var member = members[i];

    // send existing room members the info about new user
    if (member.jid.toString() !== newMember.jid.toString()) {
      var memberMessage = newPresence.clone();
      memberMessage.attrs.to = member.jid;
      this.send(memberMessage);
    }

    // send presence of existing room members to new user
    if (member.jid.toString() !== newMember.jid.toString()) {
      // read member details
      var joinermsg = this.buildPresence(
        member.RoomMember.affiliation,
        member.RoomMember.role, 
        member.jid
      );

      var memberroomjid = roomjid.bare();
      memberroomjid.setResource(member.RoomMember.nickname);

      joinermsg.attrs.from = memberroomjid.toString();
      joinermsg.attrs.to = newMember.jid.toString();
      this.send(joinermsg, null);
    }
  }
};

Presence.prototype.sendRoomHistory = function (messages, memberjid) {
  // send room history
  for (var i = 0, l = messages.length; i < l; i += 1) {
    // extract message
    var el = ltx.parse(messages[i].content);
    // el.attrs.from = roomjid;
    el.attrs.to = memberjid;
    this.send(el);
  }
};

Presence.prototype.joinRoom = function (room, user, roomjid, options) {
  var nickname = roomjid.resource.toString();
  var self = this;

  logger.debug('user ' + user.jid + ' joins the room ' + room.name);

  // join room
  return room.join(user, {
    role: 'visitor',
    affiliation: 'member',
    nickname: nickname
  }, options).then(function (member) {

    logger.debug('member joind room: ' + JSON.stringify(member));

    // send presence confirmation to new member
    var presenceConfirmation = self.buildPresenceConfirmation(room, {
      'jid': member.jid,
      'affiliation' : member.RoomMember.affiliation,
      'role' : member.RoomMember.role
    }, roomjid);
    self.send(presenceConfirmation);
    
    var promises = [];

    // send presence of existing users to new member and 
    // inform the existing members about the new member
    promises.push(room.getMembers({}, options).then(function (members) {
      self.sendJoinMessages(members, member, roomjid, nickname);
    }))

    // send the new member the message history
    promises.push(room.getMessages({}, options).then(function (messages) {
      logger.debug('send room ' + roomjid + ' history to ' + member.jid);
      self.sendRoomHistory(messages, member.jid);     
    }))

    return Promise.all(promises).then(function(){
      logger.warn('joinRoom finished')
    }).catch(function(err){
      logger.warn('joinRoom finished' + err);
    })
  });
};

Presence.prototype.leaveRoom = function (room, user, roomjid, options) {
  var self = this;
  logger.debug('user ' + user.jid + ' leaves the room');

  // leave room
  room.leave(user).then(function () {
    // send client the confirmation
    self.send(self.buildPresenceLeaveConfirmation(roomjid, user.jid));
  }, options).then(function(){
    return room.getMembers();
  }).then(function (members) {
    logger.debug('send unavailibility to all users');
    var presenceLeave = self.buildPresenceLeave();
    for (var i = 0, l = members.length; i < l; i += 1) {
      var member = members[i];

      // send existing room members the info
      var memberMessage = presenceLeave.clone();
      memberMessage.attrs.from = roomjid;
      memberMessage.attrs.to = member.jid;
      self.send(memberMessage);
    }
  }).catch(function (err) {
    logger.error(err);
  });
};

/**
 * @desc Implement Muc 7.2
 * @param stanza full pubsub message stanza
 * @see http://xmpp.org/extensions/xep-0045.html#enter
 */
Presence.prototype.handleOccupantPresence = function (stanza) {
  logger.debug('muc handle presence');

  var self = this;
  var storage = this.storage;
  var transaction = null;
  var dbopts = {};

  var roomname = mucutil.determineRoomname(stanza);
  var userjid = stanza.attrs.from;
  var roomjid = new JID(stanza.attrs.to);
  var user = null;
  
  // user leaves the room 
  // @see http://xmpp.org/extensions/xep-0045.html#exit
  if (stanza.attrs.type === 'unavailable') {
    logger.debug('handle leave messages')

    storage.sequelize.transaction().then(function (t) {
      transaction = t;
      dbopts = {
        transaction: transaction
      }
      return storage.findUser(mucutil.getBareJid(userjid), dbopts)
    }).then(function (u) {
      user = u;
      // find room
      return storage.findRoom(roomname, dbopts)
    }).then(function (room) {
      return self.leaveRoom(room, user, roomjid, dbopts);
    }).then(function(){
      return transaction.commit();
    }).catch(function(err){
      logger.error(err);
      transaction.rollback();
      self.sendError(stanza, mucutil.Error.NotFound);
    })
  }
  // user joins the room
  else {
    logger.debug('handle join messages')

    storage.sequelize.transaction().then(function (t) {
      transaction = t;
      dbopts = {
        transaction: transaction
      }
      return storage.findUser(mucutil.getBareJid(userjid), dbopts)
    }).then(function (u) {
      user = u;
      // find room
      if (self.options.RoomAutoCreate) {
        logger.debug('auto create if missing')
        return storage.findOrCreateRoom(user, roomname, dbopts);
      } else {
        logger.debug('do not auto create')
        return storage.findRoom(roomname, dbopts)
      }
    }).then(function (room) {
      return self.joinRoom(room, user, roomjid, dbopts);
    }).then(function(){
      return transaction.commit();
    }).catch(function(err){
      logger.error(err);
      transaction.rollback();
      self.sendError(stanza, mucutil.Error.NotFound);
    })
  }

  return true;
};

Presence.prototype.handle = function (stanza) {
  var handled = false;
  var to = new JID(stanza.attrs.to);

  if (stanza.is('presence')) {
    // handle presence request for specific room
    if (to.getDomain().toString().localeCompare(this.getDomain) !== 0) {
      handled = this.handleOccupantPresence(stanza);
    }

    // TODO handle normal presence request
    // 1. check if user is already offline
    // 2. make user offline in all active rooms
  }

  return handled;
};

module.exports = Presence;
