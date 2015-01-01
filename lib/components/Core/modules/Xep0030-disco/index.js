'use strict';

var ltx = require('ltx'),
  util = require('util'),
  XModule = require('../../../../core/XModule'),
  logger = require('../../../../core/Logger')('disco');

var NS_DISCO_INFO = 'http://jabber.org/protocol/disco#info',
  NS_DISCO_ITEM = 'http://jabber.org/protocol/disco#items';

/*
 * XEP-0030: Service Discovery
 * http://xmpp.org/extensions/xep-0030.html
 *
 */
function Disco(settings) {
  XModule.call(this);

  logger.info('load ' + this.name);

  this.settings = settings ||  {};
}

util.inherits(Disco, XModule);

Disco.prototype.name = 'XEP-0030: Service Discovery';

Disco.prototype.version = '0.1.0';

Disco.prototype.features = function () {
  // TODO return features here
};

Disco.prototype.match = function (stanza) {

  if (stanza.is('iq') && stanza.attrs.type === 'get' && stanza.getChild('query', NS_DISCO_INFO)) {
    logger.debug('detected disco info request');
    return true;
  }

  if (stanza.is('iq') && stanza.attrs.type === 'get' && stanza.getChild('query', NS_DISCO_ITEM)) {
    logger.debug('detected disco item request');
    return true;
  }

  return false;
};

Disco.prototype.handle = function (stanza) {
  // stanza is already verified
  logger.debug('handle disco request ' + stanza.toString());

  var error = ltx.parse(stanza.toString());
  error.attrs.type = 'error';
  error.attrs.to = stanza.attrs.from;
  error.attrs.from = this.settings.domain;

  logger.debug('error send');
  this.send(error);

  return true;
};

module.exports = Disco;
