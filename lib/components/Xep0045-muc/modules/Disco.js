'use strict';

var util = require('util'),
    Router = require('../../../core/Router'),
    NS = require('../namespace');

function Disco(storage) {
    Router.call(this);
    this.storage = storage;
}

util.inherits(Disco, Router);

Disco.prototype.match = function (stanza) {
    // discovery
    return ((stanza.is('iq') && stanza.getChild('query', NS.DISCO_ITEMS)) ||
        (stanza.is('iq') && stanza.getChild('query', NS.DISCO_INFO)));
};

Disco.prototype.handle = function (stanza) {};

module.exports = Disco;