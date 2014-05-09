'use strict';

var util = require('util'),
    XComponent = require('../../core/XComponent');

/*
 * XEP-0060: Publish-Subscribe
 * http://xmpp.org/extensions/xep-0060.html
 */

function PubSub(settings) {
    XComponent.call(this);
    this.logger = require('../../core/Logger')('xep-0060');

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

// modules
PubSub.prototype.Module = {
    Disco : require('./modules/Disco'),
    Owner : require('./modules/Owner'),
    Publish : require('./modules/Publish'),
    Retrieval : require('./modules/Retrieval'),
    Subscription : require('./modules/Subscription')
};

PubSub.prototype.initialize = function () {

    this.loadModule(new this.Module.Disco(this.storage, this.options));
    this.loadModule(new this.Module.Owner(this.storage, this.options));
    this.loadModule(new this.Module.Publish(this.storage, this.options));
    this.loadModule(new this.Module.Retrieval(this.storage, this.options));
    this.loadModule(new this.Module.Subscription(this.storage, this.options));
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