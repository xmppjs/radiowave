'use strict';

var util = require('util'),
    XepComponent = require('../../XepComponent');

/**
 * Implementation of
 * - http://xmpp.org/extensions/xep-0060.html#subscriber-retrieve
 * - http://xmpp.org/extensions/xep-0059.html
 */
var RetrievalHandler = function () {};

util.inherits(RetrievalHandler, XepComponent);

module.exports = RetrievalHandler;