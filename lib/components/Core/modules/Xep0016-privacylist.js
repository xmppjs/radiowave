'use strict';

var ltx = require('ltx'),
  util = require('util'),
  XModule = require('../../../core/XModule'),
  logger = require('../../../core/Logger')('privacylist');

var NS_PRIVACY = 'jabber:iq:privacy';

/*
 * XEP-0016: Privacy Lists
 * http://xmpp.org/extensions/xep-0016.html
 *
 * Status: Not Implemented
 */
function PrivacyLists() {
  XModule.call(this);

  logger.info('load ' + this.name);
}
util.inherits(PrivacyLists, XModule);

PrivacyLists.prototype.name = 'XEP-0016: Privacy Lists';

PrivacyLists.prototype.version = '0.1.0';

/**
 * check if this component handles this type of message
 *
 * <iq type='get' from='romeo@example.net' id='get1' xmlns='jabber:client'>
 * <query xmlns='jabber:iq:privacy'>
 * <list name='ignore'/></query>
 * </iq>
 */
PrivacyLists.prototype.match = function (stanza) {
  if (stanza.is('iq') && (stanza.getChild('query', NS_PRIVACY))) {
    logger.debug('detected XEP-0016 request');
    return true;
  }
  return false;
};

/**
 * handle message, only applied after match
 */
PrivacyLists.prototype.handle = function (stanza) {

  var error = ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
  this.sendError(stanza, error);

  return true;
};

module.exports = PrivacyLists;
