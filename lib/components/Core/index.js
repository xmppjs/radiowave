'use strict';

var util = require('util'),
    logger = require('../../core/Logger')('core'),
    XComponent = require('../../core/XComponent');

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
    XComponent.call(this);

    // xmpp server settings
    this.settings = settings ||  {};
    this.domain = settings.domain;
    this.storage = settings.storage;

}

util.inherits(Core, XComponent);

Core.prototype.name = 'Core XMPP Server';

/** 
 * do configuration and load modules
 */
Core.prototype.initialize = function () {

    var settings = this.settings;

    // based on the settings load the modules
    // TODO make module loading more general
    if (settings.modules) {

        // roaster
        if (settings.modules.indexOf('roaster') > -1) {
            this.loadModule(new Rfc3921Roaster({
                'storage': this.storage
            }));
        }

        if (settings.modules.indexOf('messaging') > -1) {
            this.loadModule(new Rfc3921Messaging());
        }

        if (settings.modules.indexOf('Xep0016') > -1) {
            this.loadModule(new Xep0016());
        }

        if (settings.modules.indexOf('Xep0030') > -1) {
            this.loadModule(new Xep0030());
        }

        if (settings.modules.indexOf('Xep0049') > -1) {
            this.loadModule(new Xep0049());
        }

        if (settings.modules.indexOf('Xep0054') > -1) {
            this.loadModule(new Xep0054());
        }

        if (settings.modules.indexOf('Xep0092') > -1) {
            this.loadModule(new Xep0092());
        }

        if (settings.modules.indexOf('Xep0199') > -1) {
            this.loadModule(new Xep0199());
        }
    }

};

module.exports = Core;