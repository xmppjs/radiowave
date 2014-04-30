'use strict';

var http = require('http'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    BOSHHttp = require('./bosh/BOSHHttp'),
    C2SStream = require('node-xmpp-server').C2SStream,
    Plain = require('node-xmpp-server').auth.Plain;

var logger = require('../core/Logger')('bosh');

/**
 * [BOSHServer description]
 *
 *   options.port : BOSH_PORT
 *   options.autostart : autostarts the server
 *
 * Some default ports are:
 * - http://example.com:5280/http-bind
 * - https://example.com:5281/http-bind
 */
function BOSHServer(options) {
    var self = this;
    this.options = options ||  {};

    if (!options.autostart) {
        options.autostart = true;
    }

    EventEmitter.call(this);

    this.c2s = null;
    this.availableSaslMechanisms = [Plain];

    this.bosh = new BOSHHttp();


    // listen for connect events from bosh
    this.bosh.on('connect', function (boshsession) {
        logger.debug('bosh connect');

        // create new stream
        var stream = new C2SStream({
            connection: boshsession,
            server : self
        });

        // emit new stream
        self.emit('connect', stream);
    });

    this.bosh.on('error', function (error) {
        logger.error(error);
    });

    // start bosh server
    if (this.options.autostart) {
        this.port = this.options.port || this.BOSH_PORT;

        // start bosh http port 
        http.createServer(function (req, res) {
            self.bosh.handleHTTP(req, res);
        }).listen(options.port);
    }
}

util.inherits(BOSHServer, EventEmitter);

BOSHServer.prototype.name = 'BOSH Connection Manager';

BOSHServer.prototype.C2SStream = C2SStream;
BOSHServer.prototype.BOSH_PORT = 5280;

/**
 * returns all registered sasl mechanisms
 */
BOSHServer.prototype.getSaslMechanisms = function() {
    return this.availableSaslMechanisms;
};

/**
 * removes all registered sasl mechanisms
 */
BOSHServer.prototype.clearSaslMechanism = function() {
    this.availableSaslMechanisms = [];
};

/**
 * register a new sasl mechanism
 */
BOSHServer.prototype.registerSaslMechanism = function(method) {
    // check if method is registered
    if (this.availableSaslMechanisms.indexOf(method) === -1 ) {
        this.availableSaslMechanisms.push(method);
    }
};

/**
 * unregister an existing sasl mechanism
 */
BOSHServer.prototype.unregisterSaslMechanism = function(method) {
    // check if method is registered
    var index = this.availableSaslMechanisms.indexOf(method);
    if (index >= 0) {
        this.availableSaslMechanisms = this.availableSaslMechanisms.splice(index, 1);
    }
};

BOSHServer.prototype.shutdown = function () {

    // we have to shutdown all connections
    this.emit('shutdown');

    // shutdown server
    // TODO not yet implemented
    //this.bosh.close()
};

module.exports = BOSHServer;