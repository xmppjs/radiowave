'use strict';

var util = require('util'),
  XModule = require('../../../core/XModule');

/*
 * RFC 3921:  Exchanging Messages
 * http://xmpp.org/rfcs/rfc3921.html#messaging
 */
function Messaging() {
  XModule.call(this);

  this.logger = require('../../../core/Logger')('rfcmessaging');
  this.logger.info('load ' + this.name);
}
util.inherits(Messaging, XModule);

Messaging.prototype.name = 'RFC 3921: Exchanging Messages';

Messaging.prototype.version = '0.1.0';

Messaging.prototype.match = function (stanza) {
  if (stanza.is('message') && stanza.attrs.type === 'chat') {
    this.logger.debug('detected message request');
    return true;
  }
  return false;
};

Messaging.prototype.handle = function (stanza) {
  this.logger.debug('Message: send message');
  this.send(stanza);

  return true;
};

module.exports = Messaging;