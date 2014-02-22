'use strict';

var xRocket = require('../../xrocket'),
    Promise = require('bluebird');

function Storage() {}


Storage.prototype.inmemory = function () {
    // storage
    var mem = {
        'users': new xRocket.Storage.Users(),
        'lookup': new xRocket.Storage.Lookup()
    };
    return mem;
};


Storage.prototype.load = function (settings) {
    var self = this;
    return new Promise(function (resolve, reject) {
        var storage = settings.get('storage');

        if (storage && storage.type) {
            var mem = self[storage.type](storage);

            if (mem) {
                resolve(mem);
            } else {
                reject('Could not find storage engine');
            }
        } else {
            reject('Could not find storage engine');
        }
    });
};

module.exports = Storage;