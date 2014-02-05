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

PresenceHandler.prototype.sendPresenceConfirmation = function (room, roomjid, userjid) {
    logger.debug('send presence confirmation to ' + userjid);
    var self = this;

    room.getMember(userjid).then(function (member) {
        console.log('confirmation for member: ' + JSON.stringify(member));
        // send client the confirmation
        var confirmMsg = new Presence({
            from: roomjid.toString(),
            to: userjid.toString()
        });
        var x = confirmMsg.c('x', {
            'xmlns': NS.MUC_USER
        });
        x.c('item', {
            'affiliation': member.affiliation.type,
            'role': member.role.type
        });
        x.c('status', {
            'code': '110'
        });
        self.send(confirmMsg);
    });
};

PresenceHandler.prototype.sendPresenceJoin = function (roomjid, userjid, usernick, room) {
    logger.debug('send join of ' + userjid + ' to all participants');
    var self = this;

    // iterate over existing members
    room.listMembers().then(
        function (members) {
            try {
                // send presence to each member
                var newPresence = self.generatePresence(NS.MUC_AFFILIATION_ADMIN, NS.MUC_ROLE_ADMIN);
                for (var i = 0, l = members.length; i < l; i++) {
                    var member = members[i];

                    // send existing room members the info about new user
                    if (member.jid.toString() !== userjid.toString()) {
                        var memberMessage = newPresence.clone();
                        var newuser = roomjid.bare();
                        newuser.setResource(usernick);
                        memberMessage.attrs.from = newuser.toString(); // must be with nickname of user
                        memberMessage.attrs.to = member.jid;
                        self.send(memberMessage);
                    }

                    // send presence of existing room members to new user
                    if (member.jid.toString() !== userjid.toString()) {
                        // read member details
                        var nickname = member.affiliation.nickname;
                        var affiliation = NS.MUC_AFFILIATION_ADMIN; // member.affiliation.type;
                        var role = NS.MUC_ROLE_ADMIN; // member.role.type;

                        var joinermsg = self.generatePresence(affiliation, role);

                        var memberroomjid = roomjid.bare();
                        memberroomjid.setResource(nickname);

                        joinermsg.attrs.from = memberroomjid.toString();
                        joinermsg.attrs.to = userjid.toString();
                        self.send(joinermsg, null);
                    }
                }
            } catch (err) {
                logger.error(err.toString());
            }
        }
    );
};

PresenceHandler.prototype.sendRoomHistory = function (roomjid, userjid, room) {
    logger.debug('send room ' + roomjid + ' history to ' + userjid);
    logger.debug(room);
    var self = this;
    room.listMessages().then(
        function (messages) {
            logger.debug(JSON.stringify(messages));
            // send room history
            for (var i = 0, l = messages.length; i < l; i += 1) {
                // extract message
                var el = ltx.parse(messages[i]);
                // el.attrs.from = roomjid;
                el.attrs.to = userjid;
                self.send(el);
            }
        }
    );
};

PresenceHandler.prototype.joinNewMember = function (room, roomjid, userjid, nickname) {
    var self = this;
    logger.debug('user ' + userjid + ' joins the room');

    // join room
    room.join(userjid, nickname).then(function () {
        // send presence confirmation to new member
        self.sendPresenceConfirmation(room, roomjid, userjid);

        // send presence of existing users to new member and 
        // inform the existing members about the new member
        self.sendPresenceJoin(roomjid, userjid, nickname, room);

        // send the new member the message history
        self.sendRoomHistory(roomjid, userjid, room);
    });
};


PresenceHandler.prototype.joinRoom = function (room, roomjid, userjid, nickname) {
    logger.debug('user joins the room');
    var self = this;
    // check if the user is already member
    room.isMember(userjid)
    .then(
        // user exists
        function () {
            logger.debug('join new member');

            return self.joinNewMember(room, roomjid, userjid, nickname);
        })
    // user is not member yet
    .catch (function () {
        logger.debug('user is not member of the room yet');
        room.addMember(userjid).then(
            function () {
                logger.debug('set affiliation');
                // set affiliation properly for creator
                return room.setMember(userjid);
            })
            .then(
                function () {
                    // user exists
                    self.joinNewMember(room, roomjid, userjid, nickname);
                });
    });

};


PresenceHandler.prototype.sendPresenceLeave = function (roomjid, userjid, room) {
    var self = this;

    // send client the confirmation
    var confirmMsg = new Presence({
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

PresenceHandler.prototype.leaveRoom = function (room, roomjid, userjid) {
    var self = this;
    logger.debug('user' + userjid + ' leaves the room');
    // leave room
    room.leave(userjid).then(
        function () {
            logger.debug('send unavailibility to all users');
            self.sendPresenceLeave(roomjid, userjid, room);
        });
};

PresenceHandler.prototype.handlePresence = function (room, stanza) {
    logger.debug('handle presence')
    var self = this;

    var userjid = new JID(stanza.attrs.from);
    var roomjid = new JID(stanza.attrs.to);
    // var roomname = roomjid.user;
    var nickname = roomjid.resource.toString();

    // user leaves the room 
    // @see http://xmpp.org/extensions/xep-0045.html#exit
    if (room && stanza.attrs.type === 'unavailable') {
        self.leaveRoom(room, roomjid, userjid);
    }
    // user joins the room
    else {
        self.joinRoom(room, roomjid, userjid, nickname);
    }
};

module.exports = PresenceHandler;