'use strict';

function XepComponent() {}

XepComponent.prototype = {
    name: 'XepComponent',
    version: '0.0.0',
    /**
     * This method will initialize the module. It is called by component router before the server 
     * is finished with startup.
     */
    initialize: function() {},
    /**
     * send messages and start routing
     */
    send: function() {},
    /**
     * verify if a given stanza can be handled by this module
     */
    match: function() {},
    /**
     * handles xmpp stanzas
     */
    handle: function() {}
};

module.exports = XepComponent;
