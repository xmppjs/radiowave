'use strict';

var path = require('path'),
    winston = require('winston'),
    logger = winston.loggers.get('xrocketd');

// xmpp Server
var Settings = require('./settings'),
    API = require('./api'),
    Auth = require('./auth'),
    CM = require('./cm'),
    Modules = require('./modules'),
    Storage = require('./storage'),
    xRocket = require('../../xrocket');

function Starter() {
    this.settings = new Settings();
    this.auth = new Auth();
    this.cm = new CM();
    this.api = new API();
    this.modules = new Modules();
    this.storage = new Storage();

    this.xrsettings = null;
    this.xrstorage = null;
    this.xR = new xRocket.XRocket();
}

Starter.prototype.start = function(filepath) {
    var self = this;

    // load settings
    var settingspath = path.resolve(filepath);

    self.settings.load(settingspath).then(function (settings) {
        self.xrsettings = settings;
    })
        .then(function () {
            // load connection manager
            logger.debug('load connection manger');
            return self.cm.load(self.xR, self.xrsettings);
        })
        .then(function () {
            // load storage module
            logger.debug('load storage module');
            return self.storage.load(self.xrsettings);
        })
        .then(function (sto) {
            self.xrstorage = sto;
        })
        .then(function () {
            // load xep modules
            logger.debug('load xmpp modules');
            return self.modules.load(self.xrsettings, self.xrstorage);
        })
        .then(function (cr) {
            // chain XRocket to Logger to ComponentRouter
            var lpr = new xRocket.Router.LogRouter();
            self.xR.chain(lpr).chain(cr);
        })
        .then(function () {
            // load api
            logger.debug('load api module');
            self.api.load(self.xrsettings, self.xrstorage);
        })
        .then(function () {
            // load auth modules
            logger.debug('initialize authentication');
            return self.auth.load(self.xR, self.api, self.xrsettings);
        })
        .then(function () {
            logger.debug('successfully started xrocketd');
        })
        .
    catch (function (err) {
        console.error(err);
        logger.error(err);
    });
};

module.exports = Starter;