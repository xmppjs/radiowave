
'use strict';

var util = require('util'),
    logger = require('./Logger')('core'),
    JID = require('node-xmpp-core').JID,
    XRoute = require('./XRoute');

function XComponent() {
    this.modules = [];
    this.domain = '';
}

util.inherits(XComponent, XRoute);

XComponent.prototype.name = 'XComponent';
XComponent.prototype.version = '0.0.0';

XComponent.prototype.features = function () {
    return [];
};

XComponent.prototype.initialize = function () {};

XComponent.prototype.loadModule = function (module) {

    logger.debug('load module: ' + module.name);

    // add module to collection
    this.modules.push(module);

    // chain events
    this.chain(module);
};

XComponent.prototype.getDomain = function ()  {
    return this.domain;
};

XComponent.prototype.verifyDomain = function (stanza)  {

    var jid = new JID(stanza.attrs.to);
    var domain = this.getDomain();

    logger.debug('check for domain: ' + domain);

    // check that the domain fits
    if (jid.getDomain().toString().localeCompare(domain) !== 0) {
        logger.debug('stanza does not match domain');
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
    logger.debug('check stanza');
    this.modules.forEach(function (route) {
        logger.debug('check ' + route.name);
        if (route.match(stanza)) {
            logger.debug('detected message for ' + self.getDomain() + ' with route ' + route.name);
            match = true;
        }
    });

    return match;
};

XComponent.prototype.handle = function (stanza) {

    var handled = false;

    // find proper component to handle the request
    this.modules.forEach(function (route) {
        if (route.match(stanza)) {
            handled = route.handle(stanza);
        }
    });

    if (!handled) {
        logger.error('could not process: ' + stanza.toString());
    }

    return handled;
};

module.exports = XComponent;