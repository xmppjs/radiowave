'use strict';

var util = require('util'),
    XComponent = require('../core/XComponent');

function ComponentRouter(options) {
    XComponent.call(this);
    this.logger = require('../core/Logger')('comprouter');

    this.xmppdomain = options.domain;
    this.components = [];
}
util.inherits(ComponentRouter, XComponent);

ComponentRouter.prototype.name = 'ComponentRouter';

ComponentRouter.prototype.connect = function () {
    // emit events for pipe
    this.emit('connect');
};

ComponentRouter.prototype.getDomain = function () {
    return this.xmppdomain;
};


ComponentRouter.prototype.handle = function (stanza) {

    // check the to field is properly set. otherwise we expect this server
    if (!stanza.attrs.to) {
        stanza.attrs.to = this.getDomain();
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
                this.logger.debug('handle stanza with ' + component.name);
                handled = component.handle(stanza);
            }
            // TODO send an error if we ware not able to deliver this message
        } catch (err) {
            this.logger.error(err.stack);
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

// Harmonize interface with XComponent
ComponentRouter.prototype.register = function (comp) {

    // initialize component
    comp.initialize();

    // store component
    this.components.push(comp);

    // we cannot chain components, because handle will decide for a specific component
    // anyway we need the route back
    var self = this;
    comp.on('send', function (stanza) {
        self.logger.debug(comp.name + ' send out to ' + self.name +  ':  ' +stanza.toString());
        self.send(stanza);
    });

};

ComponentRouter.prototype.unregister = function (comp) {

    // TODO we need to implement this
};

module.exports = ComponentRouter;