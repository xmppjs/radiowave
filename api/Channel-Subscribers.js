'use strict';

var routes = function(app) {

    /**
     * List members
     */
    app.get('/api/channels/:owner/:channel/subscribers', function(req, res) {
        res.json({});
    });

    /**
     * Add user as a subscriber
     */
    app.put('/api/channels/:owner/:channel/subscribers/:user', function(req, res) {
        res.json({});
    });

    /**
     * Remove user as a subscriber
     */
    app.del('/api/channels/:owner/:channel/subscribers/:user', function(req, res) {
        res.json({});
    });

};

// Expose routes
module.exports = routes;