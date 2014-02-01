'use strict';

var ltx = require('ltx'),
    util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xep-0045'),
    XepComponent = require('../XepComponent'),
    Message = require('node-xmpp-core').Stanza.Message,
    Presence = require('node-xmpp-core').Stanza.Presence,
    JID = require('node-xmpp-core').JID,
    NS = require('./namespace');

var MUC_ROLE_ADMIN = 'admin',
    MUC_AFFILIATION_ADMIN = 'admin';

/*
    MUC_ROLE_NONE = 'none',
    MUC_ROLE_PARTICIPANT = 'participant',
    MUC_ROLE_VISITOR = 'visitor',
    MUC_AFFILIATION_OWNER = 'owner',
    MUC_AFFILIATION_MEMBER = 'member',
    MUC_AFFILIATION_OUTCAST = 'outcast',
    MUC_AFFILIATION_NONE = 'none';
*/

/*
 * XEP-0045: Multi-User Chat
 * http://xmpp.org/extensions/xep-0045.html
 */
function Muc(options) {
    this.options = options ||  {};

    this.subdomain = options.subdomain;
    this.domain = options.domain;

    XepComponent.call(this);

    this.autoCreateRoom = true;

    this.Users = options.storage.users;
    this.Lookup = options.storage.lookup;
}
util.inherits(Muc, XepComponent);

Muc.prototype.name = 'XEP-0045: Multi-User Chat';

Muc.prototype.getDomain = function ()  {
    return this.subdomain + '.' + this.domain;
};

Muc.prototype.features = function () {
    return [];
};

Muc.prototype.initialize = function () {};

Muc.prototype.match = function (stanza) {
    var jid = new JID(stanza.attrs.to);
    var domain = this.getDomain();

    // check that the domain fits
    if (jid.getDomain().toString().localeCompare(domain) !== 0) {
        return false;
    }

    if (
        // message
        (stanza.is('message') && stanza.attrs.type === 'groupchat') ||
        // mediated invitation
        (stanza.is('message') && (stanza.getChild('x', NS.MUC_USER) && stanza.getChild('x', NS.MUC_USER).getChild('invite'))) ||
        // presence
        (stanza.is('presence')) ||
        // discovery
        (stanza.is('iq') && stanza.getChild('query', NS.DISCO_ITEMS)) ||
        (stanza.is('iq') && stanza.getChild('query', NS.DISCO_INFO))
    ) {
        logger.debug('detected meesage for Xep-0045 ' + domain);
        return true;
    }

    return false;
};

Muc.prototype.getNode = function (nodename, callback) {
    this.Storage.Nodes.get(this.getSubdomain(), nodename, callback);
};

/**
 * creates a new room
 * @param node name of the pubsub node
 */
/*Muc.prototype.createRoom = function (name, configuration, callback) {
    logger.debug('create new pubsub node ' + name);

    // create a new pub sub node description
    var room = new MucRoom({
        name: name,
        subdomain: this.getSubdomain()
    });

    // set default parameter
    room.setConfiguration('muc#roomconfig_roomname', 'Title');

    // overwrite configuration
    for (var i = 0; i < configuration.length; i++) {
        logger.debug('set ' + name + ' key: ' + configuration[i].key + ' ' + configuration[i].value);
        room.setConfiguration(configuration[i].key, configuration[i].value);
    }

    // this.Storage.Rooms.add(room.getRoomDescription(), callback);

    callback(null, room);
};

Muc.prototype.handleOwnerCreate = function (stanza) {

};

Muc.prototype.handleOwnerDelete = function (stanza) {

};
*/

Muc.prototype.sendPresenceLeave = function (roomjid, userjid, room) {
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
        'affiliation': MUC_AFFILIATION_ADMIN,
        'role': MUC_ROLE_ADMIN
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
        'affiliation': MUC_AFFILIATION_ADMIN,
        'role': MUC_ROLE_ADMIN
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

Muc.prototype.generatePresence = function (affiliation, role) {
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

Muc.prototype.sendPresenceJoin = function (roomjid, userjid, usernick, room) {
    logger.debug('send join of ' + userjid + ' to all participants');
    var self = this;

    // iterate over existing members
    room.listMembers().then(
        function (members) {
            try {
                // send presence to each member
                var newPresence = self.generatePresence(MUC_AFFILIATION_ADMIN, MUC_ROLE_ADMIN);
                for (var i = 0, l = members.length; i < l; i++) {
                    var member = members[i];

                    // send existing room members the info about new user
                    if (member.jid !== userjid) {
                        var memberMessage = newPresence.clone();
                        var newuser = roomjid.bare();
                        newuser.setResource(usernick);
                        memberMessage.attrs.from = newuser.toString(); // must be with nickname of user
                        memberMessage.attrs.to = member.jid;
                        self.send(memberMessage);
                    }

                    // read member details
                    var nickname = member.affiliation.nickname;
                    var affiliation = MUC_AFFILIATION_ADMIN; // member.affiliation.type;
                    var role = MUC_ROLE_ADMIN; // member.role.type;
                    //logger.debug('JID: ' + member.jid);
                    //logger.debug('NICK: ' + nickname);
                    //logger.debug('AFFILIATION: ' + affiliation);
                    //logger.debug('ROLE: ' + role);

                    // send presence of existing room members to new user
                    var joinermsg = self.generatePresence(affiliation, role);

                    var memberroomjid = roomjid.bare();
                    memberroomjid.setResource(nickname);

                    joinermsg.attrs.from = memberroomjid.toString();
                    joinermsg.attrs.to = userjid.toString();
                    self.send(joinermsg, null);
                }
            } catch (err) {
                logger.error(err.toString());
            }
        }
    );
};

Muc.prototype.sendPresenceConfirmation = function (roomjid, userjid) {
    logger.debug('send presence confirmation to ' + userjid);

    // send client the confirmation
    var confirmMsg = new Presence({
        from: roomjid.toString(),
        to: userjid.toString()
    });
    var x = confirmMsg.c('x', {
        'xmlns': NS.MUC_USER
    });
    x.c('item', {
        'affiliation': MUC_AFFILIATION_ADMIN,
        'role': MUC_ROLE_ADMIN
    });
    x.c('status', {
        'code': '110'
    });
    this.send(confirmMsg);
};

Muc.prototype.sendRoomHistory = function (roomjid, userjid, room) {
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

/**
 * @desc Implement Muc 7.2
 * @param stanza full pubsub message stanza
 * @see http://xmpp.org/extensions/xep-0045.html#enter
 */
Muc.prototype.handleOccupantPresence = function (stanza) {
    logger.debug('muc handle presence');
    var self = this;
    var roomjid = new JID(stanza.attrs.to);

    // extract data
    var userjid = new JID(stanza.attrs.from);
    var roomname = roomjid.user;
    var nickname = roomjid.resource.toString();

    function joinMember(room, roomjid, userjid, nickname) {
        logger.debug('user' + userjid + ' joins the room');

        // join room
        room.join(userjid, nickname).then(function () {
            self.sendPresenceJoin(roomjid, userjid, nickname, room);
            self.sendPresenceConfirmation(roomjid, userjid);
            self.sendRoomHistory(roomjid, userjid, room);
        });
    }

    function ro(room) {
        // room is there
        logger.debug('found room: ' + roomname);

        // user leaves the room 
        // @see http://xmpp.org/extensions/xep-0045.html#exit
        if (room && stanza.attrs.type === 'unavailable') {
            logger.debug('user' + userjid + ' leaves the room');
            // leave room
            room.leave(userjid).then(
                function () {
                    logger.debug('send unavailibility to all users');
                    self.sendPresenceLeave(roomjid, userjid, room);
                });
        }
        // user joins the room
        else {
            // check if the user is already member
            room.isMember(userjid).then(
                function () {
                    // user exists
                    joinMember(room, roomjid, userjid, nickname);
                },
                function () {
                    logger.debug('user is not member of the room yet');
                    // user does not exist
                    return room.addMember(userjid).then(
                        function () {
                            // user exists
                            joinMember(room, roomjid, userjid, nickname);
                        }
                    );
                }
            );
        }
    }

    this.Lookup.find('muc', roomname).then(
        function (identifier) {
            // room exists
            self.Users.user(identifier.user).then(
                function (user) {
                    user.getRoom(identifier.resource).then(
                        function (room) {
                            ro(room);
                        },
                        function () {
                            // we should not be able to reach this
                            logger.error('could not find room');
                        }
                    );
                },
                function () {
                    // user does not exist, we close the stream;
                    logger.error('user ' + identifier.user + 'does not exist');
                });
        },
        function () {
            // room does not exist
            // if flag is not set, create a room, otherwise we send an error
            if (self.autoCreateRoom) {
                // extract new owner from jid
                self.Users.user(userjid.getLocal()).then(
                    function (user) {
                        // create room
                        self.Lookup.add('muc', userjid.getLocal(), roomname, roomname).then(function (identifier) {
                            user.createRoom(roomname).then(
                                function (room) {
                                    ro(room);
                                }
                            );
                        });
                    });
            } else {
                // room does not exists
                var errXml = ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
                self.sendError(stanza, errXml);
            }
        });
};/**



 * Implement 7.4
 * @see http://xmpp.org/extensions/xep-0045.html#message
 */
Muc.prototype.handleOccupantMessage = function (stanza) {
    logger.debug('muc handle message');
    var self = this;
    var roomjid = new JID(stanza.attrs.to);

    // route messages to room members
    var sendmessage = function (stanza, room, member) {

        logger.debug('send message to all members');

        // find nickname for user
        var nickname = member.affiliation.nickname;

        // extract message body
        var messagebody = stanza.children;

        var msg = new Message({
            'from': new JID(room.getName(), self.getDomain(), nickname),
            'to': '',
            'type': 'groupchat'
        });
        msg.children = messagebody;

        logger.debug(msg.attrs.from);

        logger.debug('store mesage');
        // store message in history
        room.createMessage(msg.root().toString());

        logger.debug('send message to all members');
        // iterate over room members and submit message
        room.listMembers().then(
            function (members) {
                for (var i = 0, l = members.length; i < l; i += 1) {
                    var member = members[i];

                    var clientmsg = msg.clone();
                    clientmsg.attrs.to = member.jid;
                    self.send(clientmsg);
                }
            }
        );
    };

    // extract all data
    var userjid = stanza.attrs.from;
    var roomname = roomjid.getLocal();

    this.Lookup.find('muc', roomname).then(
        function (identifier) {

            self.Users.user(identifier.user).then(
                function (user) {
                    return user.getRoom(identifier.resource);
                }).then(
                function (room) {
                    // check if user is part of this room
                    room.getMember(userjid).then(
                        function (member) {
                            sendmessage(stanza, room, member);

                        }, function () {
                            // room does not exists
                            var errXml = ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
                            self.sendError(stanza, errXml);
                        });
                });

        }
    ).then(function () {}, function () {
        // room does not exists
        var errXml = ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
        self.sendError(stanza, errXml);
    });
};

/*
 * Implement 7.8
 * @see http://xmpp.org/extensions/xep-0045.html
 * <message 
 *     from=’crone1@shakespeare.lit/desktop’ 
 *     id=’nzd143v8’ 
 *     to=’coven@chat.shakespeare.lit’>
 *     <x xmlns=’http://jabber.org/protocol/muc#user’> 
 *         <invite to=’hecate@shakespeare.lit’>
 *             <reason>
 *             Hey Hecate, this is the place for all good witches!
 *             </reason> 
 *         </invite>
 *     </x> 
 * </message>
 */
Muc.prototype.handleInvitations = function (stanza, x) {
    var roomjid = new JID(stanza.attrs.to);
    var from = new JID(stanza.attrs.from);

    // extract reason
    var invite = x.getChild('invite');
    var member = x.attrs.to;
    var reason = invite.getChild('reason');

    // password

    // send client the confirmation
    var confirmMsg = new Message({
        from: roomjid.toString(),
        to: member
    });
    var xEl = confirmMsg.c('x', {
        'xmlns': NS.MUC_USER
    });
    var inviteEl = xEl.c('invite', {
        'from': from
    });
    inviteEl.cnode(reason);
    
    this.send(confirmMsg);

};

Muc.prototype.handle = function (stanza) {
    logger.debug('muc route');

    var to = new JID(stanza.attrs.to);

    // handle presence request for specific room
    if (stanza.is('presence') && (to.getDomain().toString().localeCompare(this.getDomain) !== 0)) {
        this.handleOccupantPresence(stanza);
    }

    // handle messages
    var msg = stanza.is('message');
    if (msg && stanza.attrs.type === 'groupchat') {
        this.handleOccupantMessage(stanza);
    }

    // handle invitations
    var x = stanza.getChild('x', NS.MUC_USER);
    if (msg && x && x.getChild('invite')) {
        this.handleInvitations(stanza, x);
    }

    // TODO handle normal presence request
    // 1. check if user is already offline
    // 2. make user offline in all active rooms

};

module.exports = Muc;