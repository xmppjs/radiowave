'use strict';

var util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xep-0045'),
    XepComponent = require('../../XepComponent'),
    Message = require('node-xmpp-core').Stanza.Message,
    JID = require('node-xmpp-core').JID;

function MessageHandler() {}

util.inherits(MessageHandler, XepComponent);

/**
 * Implement 7.4
 * @see http://xmpp.org/extensions/xep-0045.html#message
 */
MessageHandler.prototype.sendMessage = function (stanza, room, member) {
    var self = this;
    logger.debug('send message to all members' + JSON.stringify(member));

    // find nickname for user
    var nickname = member.affiliation.nickname;
    logger.debug(nickname);

    // extract message body
    var messagebody = stanza.children;
    var msg = new Message({
        'from': new JID(room.getName(), self.getDomain(), nickname),
        'to': '',
        'type': 'groupchat'
    });
    msg.children = messagebody;

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

module.exports = MessageHandler;