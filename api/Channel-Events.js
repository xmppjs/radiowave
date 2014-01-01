'use strict';

var routes = function(app) {

    /**
     * trigger an event
     */
    app.post('/api/channels/:owner/:channel/messages', function(req, res) {
        res.json({});
    });

    /**
     * List events for a channel
     */
    app.get('/api/channels/:owner/:channel/messages', function(req, res) {
        res.json({});
    });

};

// Expose routes
module.exports = routes;