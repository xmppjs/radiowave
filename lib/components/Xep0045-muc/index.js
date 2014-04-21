'use strict';

var util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xep-0045'),
    XepModule = require('../../core/XepModule'),
    JID = require('node-xmpp-core').JID;

// routes
var Admin = require('./router/Admin'),
    Disco = require('./router/Disco'),
    Invitation = require('./router/Invitation'),
    Message = require('./router/Message'),
    Owner = require('./router/Owner'),
    Presence = require('./router/Presence'),
    Unique = require('./router/Unique');

/*
 * XEP-0045: Multi-User Chat
 * http://xmpp.org/extensions/xep-0045.html
 */
function Muc(settings) {
    XepModule.call(this);

    // xmpp server settings
    this.settings = settings ||  {};
    this.subdomain = settings.subdomain;
    this.domain = settings.domain;
    this.storage = settings.storage;

    // muc specific options
    this.options = {
        domain : this.getDomain(),
        RoomAutoCreate : true
    };

    console.log('initialize muc router');
    this.routes = [
        new Admin(this.storage, this.options),
        new Disco(this.storage, this.options),
        new Invitation(this.storage, this.options),
        new Message(this.storage, this.options),
        new Presence(this.storage, this.options),
        new Owner(this.storage, this.options),
        new Unique(this.storage, this.options)
    ];

    // chain routes to this component
    var self = this;
    this.routes.forEach(function(route){
        self.chain(route);
    });

}
util.inherits(Muc, XepModule);

Muc.prototype.name = 'XEP-0045: Multi-User Chat';

Muc.prototype.getDomain = function ()  {
    return this.subdomain + '.' + this.domain;
};

Muc.prototype.features = function () {
    return [];
};

Muc.prototype.initialize = function () {};

Muc.prototype.match = function (stanza) {

    var jid = new JID(stanza.attrs.to);
    var domain = this.getDomain();

    console.log('muc match check for domain: ' + domain);

    // check that the domain fits
    if (jid.getDomain().toString().localeCompare(domain) !== 0) {
        console.log('muc does not match domain');
        return false;
    }

    // iterate over array of router and check if some one matches true
    var match = true;
    
    this.routes.forEach(function(route) {
        if (route.match(stanza)) {
            logger.debug('detected meesage for Xep-0045 ' + domain);
            match = true;
        }
    });

    return match;
};

Muc.prototype.handle = function (stanza) {
    logger.debug('muc route');

    var handled = false;

    // find proper component to handle the request
    this.routes.forEach(function(route) {
        if (route.match(stanza)) {
            handled = route.handle(stanza);
        }
    });

    if (!handled) {
        logger.error('cound not process: ' + stanza.toString());
    }

    return handled;
};

module.exports = Muc;