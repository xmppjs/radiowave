'use strict';

var util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xep-0045'),
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

    // xmpp server settings
    this.settings = settings ||  {};
    this.subdomain = settings.subdomain;
    this.domain = settings.domain;
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
    return this.subdomain + '.' + this.domain;
};

Muc.prototype.initialize = function () {

    this.loadModule(new Admin(this.storage, this.options));
    this.loadModule(new Disco(this.storage, this.options));
    this.loadModule(new Invitation(this.storage, this.options));
    this.loadModule(new Message(this.storage, this.options));
    this.loadModule(new Presence(this.storage, this.options));
    this.loadModule(new Owner(this.storage, this.options));
    this.loadModule(new Unique(this.storage, this.options));

};

module.exports = Muc;