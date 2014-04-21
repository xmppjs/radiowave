'use strict';

var util = require('util'),
    Router = require('../../../core/Router'),
    NS = require('../namespace'),
    winston = require('winston'),
    logger = winston.loggers.get('xep-0045');

function Owner() {
    Router.call(this);
}

util.inherits(Owner, Router);

Owner.prototype.match = function (stanza) {
    // owner
    return (stanza.is('iq') && stanza.getChild('query', NS.MUC_OWNER));
};

Owner.prototype.handle = function (stanza) {

    var handled = false;

    if (stanza.is('iq')) {
        // owner request
        if (stanza.getChild('query', NS.MUC_OWNER)) {
            logger.error('owner request not implemented yet' + stanza.toString());
        }
    }
    
    return handled;
};

module.exports = Owner;