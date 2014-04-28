'use strict';

var util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('core'),
    XepModule = require('../../core/XepModule'),
    JID = require('node-xmpp-core').JID;

// modules
var Rfc3921Messaging = require('./modules/Rfc3921-messaging'),
    Rfc3921Roaster = require('./modules/Rfc3921-roaster'),
    Xep0016 = require('./modules/Xep0016-privacylist'),
    Xep0030 = require('./modules/Xep0030-disco'),
    Xep0049 = require('./modules/Xep0049-xmlstorage'),
    Xep0054 = require('./modules/Xep0054-vcard'),
    Xep0092 = require('./modules/Xep0092-version'),
    Xep0199 = require('./modules/Xep0199-ping');

/*
 * Implementation of a core XMPP server
 */
function Core(settings) {
    XepModule.call(this);

    // xmpp server settings
    this.settings = settings ||  {};
    this.domain = settings.domain;
    this.storage = settings.storage;

    console.log('initialize core server');
    this.modules = [];

    // based on the settings load the modules
    // TODO make module loading more general
    if (settings.modules) {

        // roaster
        if (settings.modules.indexOf('roaster') > -1) {
            this.modules.push(new Rfc3921Roaster({
                'storage': this.storage
            }));
        }

        if (settings.modules.indexOf('messaging') > -1) {
            this.modules.push(new Rfc3921Messaging());
        }

        if (settings.modules.indexOf('Xep0016') > -1) {
            this.modules.push(new Xep0016());
        }

        if (settings.modules.indexOf('Xep0030') > -1) {
            this.modules.push(new Xep0030());
        }

        if (settings.modules.indexOf('Xep0049') > -1) {
            this.modules.push(new Xep0049());
        }

        if (settings.modules.indexOf('Xep0054') > -1) {
            this.modules.push(new Xep0054());
        }

        if (settings.modules.indexOf('Xep0092') > -1) {
            this.modules.push(new Xep0092());
        }

        if (settings.modules.indexOf('Xep0199') > -1) {
            this.modules.push(new Xep0199());
        }
    }

    // chain modules to this component
    var self = this;
    this.modules.forEach(function (route) {
        self.chain(route);
    });

}
util.inherits(Core, XepModule);

Core.prototype.name = 'Core XMPP Server';

Core.prototype.getDomain = function ()  {
    return this.domain;
};

Core.prototype.features = function () {
    return [];
};

Core.prototype.initialize = function () {};

Core.prototype.match = function (stanza) {

    var jid = new JID(stanza.attrs.to);
    var domain = this.getDomain();

    console.log('check for domain: ' + domain);

    // check that the domain fits
    if (jid.getDomain().toString().localeCompare(domain) !== 0) {
        console.log('stanza does not match domain');
        return false;
    }

    // iterate over array of router and check if some one matches true
    var match = true;

    this.modules.forEach(function (route) {
        if (route.match(stanza)) {
            logger.debug('detected meesage for Core ' + domain);
            match = true;
        }
    });

    return match;
};

Core.prototype.handle = function (stanza) {
    logger.debug('Core route');

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

module.exports = Core;