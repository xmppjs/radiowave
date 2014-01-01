'use strict';

var routes = function(app) {

    /**
     * List members
     */
    app.get('/api/rooms/:owner/:room/members', function(req, res) {
        res.json({});
    });

    /**
     * Check if a user is a member
     */
    app.get('/api/rooms/:owner/:room/members/:user', function(req, res) {
        res.json({});
    });

    /**
     * Add user as a member
     */
    app.put('/api/rooms/:owner/:room/members/:user', function(req, res) {
        res.json({});
    });

    /**
     * Remove user as a member
     */
    app.del('/api/rooms/:owner/:room/members/:user', function(req, res) {
        res.json({});
    });
};

// Expose routes
module.exports = routes;
