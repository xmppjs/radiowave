'use strict';

var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    ltx = require('ltx');

function XRoute() {
    EventEmitter.call(this);
    this.logger = require('./Logger')('xroute');
}

util.inherits(XRoute, EventEmitter);

XRoute.prototype.name = 'XRoute';

/**
 * verify if a given stanza can be handled by this module
 */
XRoute.prototype.match = function (stanza) {};

/**
 * handles xmpp stanzas
 */
XRoute.prototype.handle = function (stanza) {};

/**
 * send messages and start routing
 */
XRoute.prototype.send = function (stanza) {
    // this.logger.debug(this.name + ' send stanza: ' + stanza.toString());
    this.emit('send', stanza);
};

/**
 * Send an error to the original sender of the message
 *
 * @params stanza original message from the sender
 */
XRoute.prototype.sendError = function (stanza, err) {
    var response = new ltx.Element(stanza.getName(), {
        from: stanza.attrs.to,
        to: stanza.attrs.from,
        id: stanza.attrs.id,
        type: 'error'
    });

    // attach error detail
    if (err) {
        response.cnode(err);
    }

    this.send(response);
};

/**
 * Respond with success to the original message
 *
 * @params stanza original message from the sender
 */
XRoute.prototype.sendSuccess = function (stanza, detail) {
    var response = new ltx.Element('iq', {
        from: stanza.attrs.to,
        to: stanza.attrs.from,
        id: stanza.attrs.id,
        type: 'result'
    });

    // attach error detail
    if (detail) {
        response.cnode(detail);
    }

    this.send(response);
};

XRoute.prototype.chain = function (route) {
    var self = this;

    this.on('stanza',function(stanza){
        self.logger.debug(self.name + ' forward to ' + route.name +  ':  ' + stanza.toString());
        route.handle(stanza);
    });

    route.on('send', function (stanza) {
        self.logger.debug(route.name + ' send out to ' + self.name +  ':  ' +stanza.toString());
        self.send(stanza);
    });

    return route;
};

module.exports = XRoute;