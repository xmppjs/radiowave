'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('xrocketd'),
    Promise = require('bluebird'),
    xRocket = require('../../xrocket');

function XepModules() {}

// roaster
XepModules.prototype.Rfc3921Roaster = function (domain, storage) {
    return new xRocket.Xep.Rfc3921Roaster({
        'storage': storage
    });
};

// muc
XepModules.prototype.Xep0045 = function (domain, storage, settings) {
    return new xRocket.Xep.Xep0045({
        'subdomain': settings.subdomain,
        'domain': domain,
        'storage': storage
    });
};

// pubsub
XepModules.prototype.Xep0060 = function (domain, storage, settings) {
    return new xRocket.Xep.Xep0060({
        'subdomain': settings.subdomain,
        'domain': domain,
        'storage': storage
    });

};

XepModules.prototype.Rfc3921Messaging = function () {
    return new xRocket.Xep.Rfc3921Messaging();
};

XepModules.prototype.Xep0030 = function () {
    return new xRocket.Xep.Xep0030();
};

XepModules.prototype.Xep0092 = function () {
    return new xRocket.Xep.Xep0092();
};

XepModules.prototype.Xep0199 = function () {
    return new xRocket.Xep.Xep0199();
};

XepModules.prototype.Xep0307 = function () {
    return new xRocket.Xep.Xep0307();
};

XepModules.prototype.load = function (settings, storage) {
    var self = this;
    return new Promise(function (resolve, reject) {
        var modules = settings.get('modules');
        var domain = settings.get('domain');

        logger.debug('Configure domain: ' + domain);
        var cr = new xRocket.Router.ComponentRouter({
            'domain': 'example.net'
        });

        if (modules) {
            modules.forEach(function (module){
                logger.info('load module ' + module.type );
                var m = self[module.type](domain, storage, module);
                cr.register(m);
            });
            resolve(cr);
        } else {
            reject('no defined modules found');
        }
    });
};

module.exports = XepModules;