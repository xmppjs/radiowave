'use strict';

var util = require('util'),
  XModule = require('../../../core/XModule'),
  NS = require('../namespace');

/**
 * Implementation of
 * - http://xmpp.org/extensions/xep-0060.html#subscriber-retrieve
 * - http://xmpp.org/extensions/xep-0059.html
 */
var Retrieval = function () {
  XModule.call(this);
  this.logger = require('../../../core/Logger')('xep-0060:retrieval');
};

util.inherits(Retrieval, XModule);

Retrieval.prototype.name = 'XEP-0060: Retrieval';

Retrieval.prototype.match = function (stanza) {
  // discovery
  return ((stanza.is('iq') && stanza.getChild('query', NS.DISCO_ITEMS)) ||
    (stanza.is('iq') && stanza.getChild('query', NS.DISCO_INFO)));
};

Retrieval.prototype.handle = function (stanza) {
  return false;
};

module.exports = Retrieval;