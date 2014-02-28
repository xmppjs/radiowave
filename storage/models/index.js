'use strict';

var fs = require('fs'),
    path = require('path');

module.exports = function (sequelize)  {
    var db = {};

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
            db[model.name] = model;
        });

    // once the model are defined, lets load the associations
    Object.keys(db).forEach(function (modelName) {
        if (db[modelName].options.hasOwnProperty('associate')) {
            db[modelName].options.associate(db);
        }
    });

    return db;
};