'use strict';

var util = require('util'),
    XModule = require('../../../core/XModule');

/**
 * Implementation of
 * - http://xmpp.org/extensions/xep-0060.html#subscriber-retrieve
 * - http://xmpp.org/extensions/xep-0059.html
 */
var RetrievalHandler = function () {
    XModule.call(this);
};

util.inherits(RetrievalHandler, XModule);

module.exports = RetrievalHandler;