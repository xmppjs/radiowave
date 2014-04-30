'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('xep-0060'),
    util = require('util'),
    XComponent = require('../../core/XComponent');

// modules
var Disco = require('./modules/Disco'),
    Owner = require('./modules/Owner'),
    Publish = require('./modules/Publish'),
    Retrieval = require('./modules/Retrieval'),
    Subscription = require('./modules/Subscription');

/*
 * XEP-0060: Publish-Subscribe
 * http://xmpp.org/extensions/xep-0060.html
 */

function PubSub(settings) {
    XComponent.call(this);

    // xmpp server settings
    this.settings = settings ||  {};
    this.subdomain = settings.subdomain;
    this.domain = settings.domain;
    this.storage = settings.storage;

    // muc specific options
    this.options = {
        domain: this.getDomain(),
        autoCreateChannel: false
    };
}

util.inherits(PubSub, XComponent);

PubSub.prototype.name = 'XEP-0060: Publish-Subscribe';

PubSub.prototype.initialize = function () {

    this.loadModule(new Disco(this.storage, this.options));
    this.loadModule(new Owner(this.storage, this.options));
    this.loadModule(new Publish(this.storage, this.options));
    this.loadModule(new Retrieval(this.storage, this.options));
    this.loadModule(new Subscription(this.storage, this.options));
};

PubSub.prototype.features = function () {
    return ["http://jabber.org/protocol/pubsub#auto-create"];
};

PubSub.prototype.getDomain = function ()  {
    return this.subdomain + '.' + this.domain;
};

// send error if the message could not be handled
// self.sendError(stanza, self.Error.NotFound);


module.exports = PubSub;