'use strict';

var util = require('util'),
    logger = require('../core/Logger')('logrouter'),
    BaseRouter = require('./BaseRouter');

function LogRouter() {
    BaseRouter.call(this);

    this.components = [];
}
util.inherits(LogRouter, BaseRouter);

LogRouter.prototype.connect = function (jid) {
    logger.debug('client ' + jid +' connected');
    BaseRouter.prototype.connect.call(this, jid);
};

LogRouter.prototype.stanza = function (stanza) {
    logger.debug(stanza.root().toString());
    BaseRouter.prototype.stanza.call(this, stanza);
};

LogRouter.prototype.disconnect = function (jid) {
    logger.debug('client ' + jid + ' disconnected');
    BaseRouter.prototype.disconnect.call(this, jid);
};

module.exports = LogRouter;