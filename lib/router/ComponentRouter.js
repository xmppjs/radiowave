'use strict';

var util = require('util'),
    XRoute = require('../core/XRoute');

/**
 * encapsulates multiple components behind a router
 *
 */
function ComponentRouter(options) {
    XRoute.call(this);
    this.logger = require('../core/Logger')('comprouter');

    this.xmppdomain = options.domain;
    this.components = [];
}
util.inherits(ComponentRouter, XRoute);

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

ComponentRouter.prototype.addComponent = function (component) {

    // initialize component
    component.initialize();

    // store component
    this.components.push(component);

    // we cannot chain components, because handle will decide for a specific component
    // anyway we need the route back
    var self = this;
    component.on('send', function (stanza) {
        self.logger.debug(component.name + ' send out to ' + self.name + ':  ' + stanza.toString());
        self.send(stanza);
    });

};

ComponentRouter.prototype.removeComponent = function () {

    // TODO we need to implement this
};

module.exports = ComponentRouter;