'use strict';

var ltx = require('ltx'),
    util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xepcomponent'),
    XepComponent = require('../XepComponent'),
    JID = require('node-xmpp-core').JID;

var NS_MUC = "http://jabber.org/protocol/muc",
    NS_MUC_UNIQUE = "http://jabber.org/protocol/muc#unique",
    NS_MUC_USER = "http://jabber.org/protocol/muc#user",
    NS_DISCO_ITEMS = "http://jabber.org/protocol/disco#items",
    NS_DISCO_INFO = "http://jabber.org/protocol/disco#info";

/*
 * XEP-0045: Multi-User Chat
 * http://xmpp.org/extensions/xep-0045.html
 */
function Muc(options) {
    this.options = options;

    this.subdomain = options.subdomain;
    this.domain = options.domain;

    XepComponent.call(this);
}
util.inherits(Muc, XepComponent);

Muc.prototype.name = 'XEP-0045: Multi-User Chat';

Muc.prototype.features = function () {
    return [];
};

Muc.prototype.match = function (stanza) {

    var domain = this.subdomain + '.' + this.domain;
    var jid = new JID(stanza.attrs.to);

    // check that the domain fits
    if (jid.getDomain().toString().localeCompare(domain) !== 0){
        logger.debug('Muc ' + domain + ' does not accept ' + jid.toString());
        return false;
    }

    if (stanza.is('message') && stanza.attrs.type === 'groupchat') {
        logger.debug('detected muc ' + domain);
        return true;
    }

    if (stanza.is('presence')) {
        logger.debug('detected muc ' + domain);
        return true;
    }

    if (stanza.is('iq') && stanza.getChild('query', NS_DISCO_ITEMS)) {
        logger.debug('detected muc ' + domain);
        return true;
    }
    if (stanza.is('iq') && stanza.getChild('query', NS_DISCO_INFO)) {
        logger.debug('detected muc ' + domain);
        return true;
    }

    return false;
};

Muc.prototype.handle = function (stanza) {

};

module.exports = Muc;