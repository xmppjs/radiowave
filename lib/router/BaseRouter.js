'use strict';

var util = require('util'),
    ltx = require('ltx'),
    EventEmitter = require('events').EventEmitter;

function BaseRouter() {
    EventEmitter.call(this);
}
util.inherits(BaseRouter, EventEmitter);


// event emitter, we emit three types of event
// connect, stanza and disconnect

BaseRouter.prototype.connect = function (jid) {
    this.emit('connect', jid);
};

BaseRouter.prototype.stanza = function (stanza) {
    this.emit('stanza', stanza);
};

BaseRouter.prototype.disconnect = function (jid) {
    this.emit('disconnect', jid);
};

// send stanza upstream
BaseRouter.prototype.send = function () {
    // do nothing in default
};

/**
 * Send an error to the original sender of the message
 *
 * @params stanza original message from the sender
 */
BaseRouter.prototype.sendError = function (stanza, err) {
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
BaseRouter.prototype.sendSuccess = function (stanza, detail) {
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


// enable router chaining
BaseRouter.prototype.chain = function (bBaseRouter) {
    // bBaseRouter listen for events from this router instance
    bBaseRouter.registerStream(this);

    // overwrite send function and map it to this send functions
    var self = this;
    bBaseRouter.send = function (stanza) {
        self.send(stanza);
    };

    return bBaseRouter;
};

BaseRouter.prototype.registerStream = function (stream) {
    var self = this;
    stream.on('connect', function (jid) {
        self.connect(jid);
    });
    stream.on('stanza', function (stanza) {
        self.stanza(stanza);
    });
    stream.on('disconnect', function () {
        self.disconnect();
    });
};

BaseRouter.prototype.unregisterStream = function () {
    // TODO implement
};

BaseRouter.prototype.messageHandler = function () {
    var self = this;
    return function (stream) {
        self.registerStream(stream);
    };
};

module.exports = BaseRouter;