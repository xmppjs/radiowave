'use strict';

var fs = require('fs'),
    path = require('path');

module.exports = function (sequelize, db)  {
    db = db || {};
    var models = [];

    // load current folder
    fs
        .readdirSync(__dirname)
        // load everything except index.js
        .filter(function (file) {
            return ((file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-3) === '.js'));
        })
        // import model
        .forEach(function (file) {
            var model = sequelize.import(path.join(__dirname, file));
            
            // add model to object
            db[model.name] = model;
            models.push(model);
        });

    // once the model are defined, lets load the associations
    models.forEach(function (model) {
        if (model.options.hasOwnProperty('associate')) {
            model.options.associate(db);
        }
    });

    return db;
};