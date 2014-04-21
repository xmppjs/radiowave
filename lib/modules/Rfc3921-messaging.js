'use strict';

var util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('module'),
    XepModule = require('../core/XepModule');

/*
 * RFC 3921:  Exchanging Messages
 * http://xmpp.org/rfcs/rfc3921.html#messaging
 */
function Messaging() {
    XepModule.call(this);
}
util.inherits(Messaging, XepModule);

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