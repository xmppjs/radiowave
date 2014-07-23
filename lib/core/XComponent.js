
'use strict';

var util = require('util'),
    JID = require('node-xmpp-core').JID,
    XModule = require('./XModule');

function XComponent() {
    this.modules = [];
    this.xmppdomain = '';
    this.logger = require('./Logger')('xcomponent');
}

util.inherits(XComponent, XModule);

XComponent.prototype.name = 'XComponent';
XComponent.prototype.version = '0.0.0';

XComponent.prototype.features = function () {
    return [];
};

XComponent.prototype.initialize = function () {};

XComponent.prototype.loadModule = function (module) {

    this.logger.debug('load module: ' + module.name);

    // add module to collection
    this.modules.push(module);

    // chain events
    this.chain(module);
};

XComponent.prototype.getDomain = function ()  {
    return this.xmppdomain;
};

XComponent.prototype.verifyDomain = function (stanza)  {

    var jid = new JID(stanza.attrs.to);
    var xmppdomain = this.getDomain();

    this.logger.debug('check for domain: ' + xmppdomain);

    // check that the domain fits
    if (jid.getDomain().toString().localeCompare(xmppdomain) !== 0) {
        this.logger.debug('stanza does not match domain');
        return false;
    } else {
        return true;
    }
};

XComponent.prototype.match = function (stanza) {

    if (!this.verifyDomain(stanza)) {
        return false;
    }

    // iterate over array of router and check if some one matches true
    var match = false;

    var self = this;
    this.logger.debug('check stanza ' + stanza.toString());
    this.modules.forEach(function (route) {
        if (match === false) {
            self.logger.debug('check ' + route.name);
            if (route.match(stanza)) {
                self.logger.debug('detected message for ' + self.getDomain() + ' with route ' + route.name);
                match = true;
            }
        }
    });

    return match;
};

XComponent.prototype.handle = function (stanza) {

    var self = this;
    self.logger.debug('handle message ' + stanza.toString());

    var handled = false;

    // find proper component to handle the request
    this.modules.forEach(function (route) {
        if (handled === false) {
            if (route.match(stanza)) {
                self.logger.debug('handle message with ' + route.name);
                handled = route.handle(stanza);
            }
        }
    });

    if (!handled) {
        this.logger.error('could not process: ' + stanza.toString());
    }

    return handled;
};

module.exports = XComponent;