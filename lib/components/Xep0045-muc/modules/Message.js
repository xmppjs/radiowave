'use strict';

var util = require('util'),
    XModule = require('../../../core/XModule'),
    JID = require('node-xmpp-core').JID,
    XmppMessage = require('node-xmpp-core').Stanza.Message,
    NS = require('../namespace'),
    uuid = require('node-uuid'),
    mucutil = require('../Util');

function Message(storage, options) {
    XModule.call(this);
    this.logger = require('../../../core/Logger')('xep-0045:message');
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
Message.prototype.storeMessage = function (room, msg) {
    var self = this;

    // store message in history
    this.storage.RoomMessage.create({
        content: msg.toString()
    }).success(function (message) {
        room.addMessage(message).success(function () {
            // message is added
        });
    }).error(function(err){
        self.logger.error(err);
    });
};

/**
 * Implement 7.4
 * @see http://xmpp.org/extensions/xep-0045.html#message
 */
Message.prototype.sendMessage = function (room, member, stanza) {
    var self = this;
    this.logger.debug('send message to all members' + JSON.stringify(member));

    // find nickname for user
    var nickname = member.RoomMembers.nickname;
    this.logger.debug(nickname);

    // extract message body
    var messagebody = stanza.children;
    var msg = new XmppMessage({
        'from': new JID(room.name, self.options.domain, nickname),
        'to': '',
        'type': 'groupchat'
    });
    msg.children = messagebody;


    this.storeMessage(room, msg);

    this.logger.debug('send message to all members');
    // iterate over room members and submit message
    room.getMembers().success(
        function (members) {
            for (var i = 0, l = members.length; i < l; i += 1) {
                var member = members[i];

                var clientmsg = msg.clone();
                clientmsg.attrs.to = member.jid;
                // assign a new tracking id
                clientmsg.attrs.id = uuid.v4();
                self.send(clientmsg);
            }
        }
    ).error(function(err){
        self.logger.error(err);
    });
};


/**
 * Implement 7.4
 * @see http: //xmpp.org/extensions/xep-0045.html#message
 */
Message.prototype.handleOccupantMessage = function (stanza) {
    this.logger.debug('muc handle message');
    var self = this;

    var roomname = mucutil.determineRoomname(stanza);
    var userjid = stanza.attrs.from;

    var user = null;
    var room = null;

    // find user (may not be a member of the room)
    this.storage.findUser(mucutil.getBareJid(userjid)).then(function (u) {
        user = u;
        // find a room
        return self.storage.findRoom(roomname);
    }).then(function (r) {
        room = r;
        // found room, check that the user is a member of the room
        return room.isMember(user);
    }).then(function (member) {
        // we found the member
        self.sendMessage(room, member, stanza);
    }).
    catch (function (err) {
        self.logger.error(err);
        // room does not exists
        self.sendError(stanza, mucutil.Error.NotFound);
    });

    return true;
};

Message.prototype.handle = function (stanza) {
    var handled = false;
    if (stanza.is('message')) {
        // handle messages
        var msg = stanza.is('message');
        if (msg && stanza.attrs.type === 'groupchat') {
            handled = this.handleOccupantMessage(stanza);
        }
    }

    return handled;
};

module.exports = Message;