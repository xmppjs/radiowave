'use strict';

var util = require('util'),
    XModule = require('../../../core/XModule'),
    NS = require('../namespace');

function Disco(storage) {
    XModule.call(this);
    this.storage = storage;
}

util.inherits(Disco, XModule);

Disco.prototype.name = 'XEP-0045: Disco';

Disco.prototype.match = function (stanza) {
    // discovery
    return ((stanza.is('iq') && stanza.getChild('query', NS.DISCO_ITEMS)) ||
        (stanza.is('iq') && stanza.getChild('query', NS.DISCO_INFO)));
};

Disco.prototype.handle = function (stanza) {
    this.sendError(stanza);
    return true;
};

module.exports = Disco;