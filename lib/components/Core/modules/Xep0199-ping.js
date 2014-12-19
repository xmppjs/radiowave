'use strict';

var ltx = require('ltx'),
  util = require('util'),
  XModule = require('../../../core/XModule');

var NS_PING = 'urn:xmpp:ping';

/*
 * XEP-0199: XMPP Ping
 * http://xmpp.org/extensions/xep-0199.html
 *
 * Current Implementation:
 * - covers http://xmpp.org/extensions/xep-0199.html#c2s
 */
function Ping() {
  XModule.call(this);
  this.logger = require('../../../core/Logger')('ping');
  this.logger.info('load ' + this.name);
}
util.inherits(Ping, XModule);

Ping.prototype.name = 'XEP-0199: XMPP Ping';

Ping.prototype.version = '0.1.0';

/**
 * check if this component handles this type of message
 *
 * <iq from='juliet@capulet.lit/balcony' to='capulet.lit' id='c2s1' type='get'>
 *   <ping xmlns='urn:xmpp:ping'/>
 * </iq>
 */
Ping.prototype.match = function (stanza) {
  if (stanza.is('iq') && stanza.attrs.type === 'get' && (stanza.getChild('ping', NS_PING))) {
    this.logger.debug('detected ping request');
    return true;
  }
  return false;
};

/**
 * handle message, only applied after match
 *
 * <iq from='capulet.lit' to='juliet@capulet.lit/balcony' id='c2s1' type='result'/>
 */
Ping.prototype.handle = function (stanza) {
  // stanza is already verified

  var pong = new ltx.Element('iq', {
    from: stanza.attrs.to,
    to: stanza.attrs.from,
    id: stanza.attrs.id,
    type: 'result'
  });
  this.logger.debug('PING: send pong');
  this.send(pong);

  return true;
};

module.exports = Ping;
