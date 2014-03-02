'use strict';

var util = require('util'),
    ltx = require('ltx'),
    winston = require('winston'),
    logger = winston.loggers.get('xep-0045'),
    XepComponent = require('../../XepComponent'),
    Message = require('node-xmpp-core').Stanza.Message,
    Presence = require('node-xmpp-core').Stanza.Presence,
    JID = require('node-xmpp-core').JID,
    NS = require('../namespace');

function PresenceHandler() {}

util.inherits(PresenceHandler, XepComponent);

PresenceHandler.prototype.generatePresence = function (affiliation, role) {
    var presence = new Presence({
        from: '',
        to: ''
    });
    presence.c('x', {
        'xmlns': NS.MUC_USER
    }).c('item', {
        'affiliation': affiliation,
        'role': role
    });

    return presence;
};

PresenceHandler.prototype.sendPresenceConfirmation = function (room, member, roomjid) {
    logger.debug('send presence confirmation to ' + member.jid);

    // send client the confirmation
    var confirmMsg = new Presence({
        from: roomjid.toString(),
        to: member.jid.toString()
    });
    var x = confirmMsg.c('x', {
        'xmlns': NS.MUC_USER
    });
    x.c('item', {
        'affiliation': member.RoomMembers.affiliation,
        'role': member.RoomMembers.role
    });
    x.c('status', {
        'code': '110'
    });
    this.send(confirmMsg);
};

PresenceHandler.prototype.sendPresenceJoin = function (room, newMember, roomjid, nickname) {
    logger.debug('send join of ' + newMember.jid + ' to all participants');
    var self = this;

    // iterate over existing members
    room.getMembers().success(
        function (members) {
            try {
                // send presence to each member
                var newPresence = self.generatePresence(NS.MUC_AFFILIATION_ADMIN, NS.MUC_ROLE_ADMIN);
                for (var i = 0, l = members.length; i < l; i++) {
                    var member = members[i];

                    // send existing room members the info about new user
                    if (member.jid.toString() !== newMember.jid.toString()) {
                        var memberMessage = newPresence.clone();
                        var newuser = roomjid.bare();
                        newuser.setResource(nickname);
                        memberMessage.attrs.from = newuser.toString(); // must be with nickname of user
                        memberMessage.attrs.to = member.jid;
                        self.send(memberMessage);
                    }

                    // send presence of existing room members to new user
                    if (member.jid.toString() !== newMember.jid.toString()) {
                        // read member details
                        var nick = member.RoomMembers.nickname;
                        var affiliation = member.RoomMembers.affiliation;
                        var role = member.RoomMembers.role;

                        var joinermsg = self.generatePresence(affiliation, role);

                        var memberroomjid = roomjid.bare();
                        memberroomjid.setResource(nick);

                        joinermsg.attrs.from = memberroomjid.toString();
                        joinermsg.attrs.to = member.jid.toString();
                        self.send(joinermsg, null);
                    }
                }
            } catch (err) {
                logger.error(err.toString());
            }
        }
    );
};

PresenceHandler.prototype.sendRoomHistory = function (room, member, roomjid ) {
    logger.debug('send room ' + roomjid + ' history to ' + member.jid);
    var self = this;
    room.getMessages().then(
        function (messages) {
            // send room history
            for (var i = 0, l = messages.length; i < l; i += 1) {
                // extract message
                var el = ltx.parse(messages[i].content);
                // el.attrs.from = roomjid;
                el.attrs.to = member.jid;
                self.send(el);
            }
        }
    );
};

PresenceHandler.prototype.joinRoom = function (room, user, roomjid) {
    var nickname = roomjid.resource.toString();
    var self = this;

    logger.debug('user ' + user.jid + ' joins the room');

    // join room
    room.join(user, {
        role: 'visitor',
        affiliation:'member',
        nickname: nickname
    }).then(function (member) {
        // send presence confirmation to new member
        self.sendPresenceConfirmation(room, member, roomjid);

        // send presence of existing users to new member and 
        // inform the existing members about the new member
        self.sendPresenceJoin(room, member, roomjid, nickname);

        // send the new member the message history
        self.sendRoomHistory(room, member, roomjid);
    });

};


PresenceHandler.prototype.sendPresenceLeave = function (room, user, roomjid) {
    var self = this;

    // send client the confirmation
    var confirmMsg = new Presence({
        from: roomjid,
        to: user.jid,
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
    self.send(confirmMsg);

    // send new presense to exsting members
    var newPresence = new Presence({
        from: '',
        to: '',
        type: 'unavailable'
    });
    newPresence.c('x', {
        'xmlns': NS.MUC_USER
    }).c('item', {
        'affiliation': NS.MUC_AFFILIATION_ADMIN,
        'role': NS.MUC_ROLE_ADMIN
    });

    room.listMembers().then(
        function (members) {
            for (var i = 0, l = members.length; i < l; i += 1) {
                var member = members[i];

                // send existing room members the info
                var memberMessage = newPresence.clone();
                memberMessage.attrs.from = roomjid;
                memberMessage.attrs.to = member.jid;
                self.send(memberMessage);
            }
        }
    );
};

PresenceHandler.prototype.leaveRoom = function (room, user) {
    var self = this;
    logger.debug('user' + user.jid + ' leaves the room');
    // leave room
    room.leave(user).then(
        function () {
            logger.debug('send unavailibility to all users');
            self.sendPresenceLeave(room, user);
        }).catch(function (err) {
            console.error(err);
            logger.error(err);
        });
};

PresenceHandler.prototype.handlePresence = function (room, user, stanza) {
    logger.debug('handle presence');
    var self = this;

    var roomjid = new JID(stanza.attrs.to);

    // user leaves the room 
    // @see http://xmpp.org/extensions/xep-0045.html#exit
    if (room && stanza.attrs.type === 'unavailable') {
        self.leaveRoom(room, user, roomjid);
    }
    // user joins the room
    else {
        self.joinRoom(room, user, roomjid);
    }
};

module.exports = PresenceHandler;