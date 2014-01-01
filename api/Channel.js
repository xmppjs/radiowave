'use strict';

var routes = function(app) {

    /**
     * Create a new channels for the authenticated user.
     */
    app.post('/api/user/channels', function(req, res) {
        res.json({});
    });

    /**
     * Create a new channels in this organization.
     */
    app.post('/api/orgs/:org/channels', function(req, res) {
        res.json({});
    });

    /**
     * 
     */
    app.get('/api/channels/:owner/:channel', function(req, res) {
        res.json({});
    });

    /**
     * Edit channel
     */
    app.patch('/api/channels/:owner/:channel', function(req, res) {
        res.json({});
    });

    /**
     * Delete a channel (requires admin access)
     */
    app.del('/api/channels/:owner/:channel', function(req, res) {
        res.json({});
    });
};

// Expose routes
module.exports = routes;