'use strict';

var util = require('util'),
    XComponent = require('../../core/XComponent'),
    JID = require('node-xmpp-core').JID;

// modules
var Admin = require('./modules/Admin'),
    Disco = require('./modules/Disco'),
    Invitation = require('./modules/Invitation'),
    Message = require('./modules/Message'),
    Owner = require('./modules/Owner'),
    Presence = require('./modules/Presence'),
    Unique = require('./modules/Unique');

/*
 * XEP-0045: Multi-User Chat
 * http://xmpp.org/extensions/xep-0045.html
 */
function Muc(settings) {
    XComponent.call(this);
    this.logger = require('../../core/Logger')('xep-0045');

    // xmpp server settings
    this.settings = settings ||  {};
    this.xmppsubdomain = settings.subdomain;
    this.xmppdomain = settings.domain;
    this.storage = settings.storage;

    // muc specific options
    this.options = {
        domain: this.getDomain(),
        RoomAutoCreate: true
    };
}
util.inherits(Muc, XComponent);

Muc.prototype.name = 'XEP-0045: Multi-User Chat';

Muc.prototype.getDomain = function ()  {
    return this.xmppsubdomain + '.' + this.xmppdomain;
};

Muc.prototype.initialize = function () {

    this.logger.debug('initialize muc components');

    this.loadModule(new Admin(this.storage, this.options));
    this.loadModule(new Disco(this.storage, this.options));
    this.loadModule(new Invitation(this.storage, this.options));
    this.loadModule(new Message(this.storage, this.options));
    this.loadModule(new Presence(this.storage, this.options));
    this.loadModule(new Owner(this.storage, this.options));
    this.loadModule(new Unique(this.storage, this.options));

};

module.exports = Muc;