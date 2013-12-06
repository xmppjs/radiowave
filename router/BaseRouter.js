'use strict';

var util = require('util'),
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
    stream.on('connect', function () {
        self.connect();
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