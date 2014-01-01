'use strict';

var routes = function (app, Users) {
    
    /**
     * List organization rooms
     */
    app.get('/api/orgs/:org/rooms', function (req, res) {
        res.json({});
    });


    /**
     * Create a new rooms in this organization.
     */
    app.post('/api/orgs/:org/rooms', function (req, res) {
        res.json({});
    });
};

// Expose routes
module.exports = routes;