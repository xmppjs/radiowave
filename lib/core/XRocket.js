'use strict';

var logger = require('./Logger')('xrocketd'),
    ConnectionRouter = require('../router/ConnectionRouter');

var XRocket = function () {
    this.connectionManagers = [];
    this.connectionRouter = null;
    logger.info('start XRocket server');
};

XRocket.prototype = {

    // add a new instance of a connection router
    addConnectionRouter : function (connRouter) {
        this.connectionRouter = connRouter;
    },

    getConnectionRouter : function () {
        return this.connectionRouter;
    },

    // add multiple connection manager
    addConnectionManager: function (connMgr) {
        logger.debug('load connection manager: ' + connMgr.name);

        // store connection manager
        this.connectionManagers.push(connMgr);

        // attach to events from connection and forward them 
        // to the connection router
        if (this.connectionRouter) {
            connMgr.on('connect', this.connectionRouter.messageHandler());
        }
    },

    // shutdown the connection manger
    shutdown : function () {
        logger.info('shutdown XRocket server');

        for (var i = 0, l = this.connectionManagers.length; i < l; i++) {
            this.connectionManagers[i].shutdown();
        }
    },

    // chain router events
    chain: function (router) {
        if (this.connectionRouter) {
            return this.connectionRouter.chain(router);
        } else {
            throw Error('no connection router set');
        }
    }
};

module.exports = XRocket;