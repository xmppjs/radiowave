'use strict';

var util = require('util'),
    XModule = require('../../../core/XModule'),
    NS = require('../namespace'),
    winston = require('winston'),
    logger = winston.loggers.get('xep-0045');

function Owner() {
    XModule.call(this);
}

util.inherits(Owner, XModule);

Owner.prototype.name = 'XEP-0045: Owner';

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