'use strict';

var util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xepcomponent'),
    XepComponent = require('./XepComponent');

/*
 * RFC 3921:  Exchanging Messages
 * http://xmpp.org/rfcs/rfc3921.html#messaging
 */
function Messaging() {
    XepComponent.call(this);
}
util.inherits(Messaging, XepComponent);

Messaging.prototype.name = 'RFC 3921:  Exchanging Messages';

Messaging.prototype.version = '0.1.0';

Messaging.prototype.match = function (stanza) {
    if (stanza.is('message') && stanza.attrs.type === 'chat') {
        logger.debug('detected message request');
        return true;
    }
    return false;
};

Messaging.prototype.handle = function (stanza) {
    logger.debug('Message: send message');
    this.send(stanza);
};

module.exports = Messaging;