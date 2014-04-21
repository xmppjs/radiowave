'use strict';

var util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xeprouter'),
    BaseRouter = require('./BaseRouter');

function ComponentRouter(options) {
    BaseRouter.call(this);

    this.domain = options.domain;
    this.components = [];
}
util.inherits(ComponentRouter, BaseRouter);

ComponentRouter.prototype.name = 'ComponentRouter';

ComponentRouter.prototype.connect = function () {
    // emit events for pipe
    this.emit('connect');
};

ComponentRouter.prototype.stanza = function (stanza) {

    // check the to field is properly set. otherwise we expect this server
    if (!stanza.attrs.to) {
        stanza.attrs.to = this.domain;
    }

    // emit events for pipe
    this.emit('stanza', stanza);

    // iterate over components and let them handle

    var handled = false;
    for (var i = 0, l = this.components.length; i < l; i++) {
        var component = this.components[i];

        try {
            // handle events
            if (component.match(stanza)) {
                logger.debug('handle stanza with ' + component.name);
                handled = component.handle(stanza);
            }
            // TODO send an error if we ware not able to deliver this message
        } catch (err) {
            console.log(err.stack);
        }
    }

    if (!handled) {
        this.sendError(stanza);
    }
};

ComponentRouter.prototype.disconnect = function () {
    // emit events for pipe
    this.emit('disconnect');
};

ComponentRouter.prototype.register = function (comp) {
    // TODO check that the component is instance of XepComponent
    
    // attach send handler
    var self = this;
    comp.send = function (stanza) {
        self.send(stanza);
    };

    // initialize component
    comp.initialize();

    // store component
    this.components.push(comp);

};

module.exports = ComponentRouter;