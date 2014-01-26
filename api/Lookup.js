'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('webapi');

var routes = function(app, storage) {
    logger.info('register channel routes');
    var Lookup = storage.lookup;

    app.get('/api/internal/lookup', function (req, res) {
        res.json(Lookup.lookuptable);
    });
};

// Expose routes
module.exports = routes;