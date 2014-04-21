'use strict';

var xRocket = require('../../lib'),
    Storage = xRocket.Storage;

function StorageLoader() {}

StorageLoader.prototype.load = function (settings) {

    // load settings
    var storageSettings = settings.get('storage');

    // inistanciate storage module
    var s = new Storage(storageSettings);

    // return promise
    return s.initialize();

};

module.exports = StorageLoader;