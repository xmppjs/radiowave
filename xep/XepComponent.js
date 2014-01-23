'use strict';

var ltx = require('ltx'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;

function XepComponent() {}

util.inherits(XepComponent, EventEmitter);

XepComponent.prototype.name = 'XepComponent';

XepComponent.prototype.version = '0.0.0';

/**
 * This method will initialize the module. It is called by component router before the server
 * is finished with startup.
 */
XepComponent.prototype.initialize = function () {};

/**
 * send messages and start routing
 */
XepComponent.prototype.send = function () {};

/**
 * verify if a given stanza can be handled by this module
 */
XepComponent.prototype.match = function () {};

/**
 * handles xmpp stanzas
 */
XepComponent.prototype.handle = function () {};

/**
 * Send an error to the original sender of the message
 *
 * @params stanza original message from the sender
 */
XepComponent.prototype.sendError = function (stanza, err) {
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
XepComponent.prototype.sendSuccess = function (stanza, detail) {
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

module.exports = XepComponent;