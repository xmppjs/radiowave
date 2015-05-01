'use strict';

var radiowave = require('../'),
  Storage = radiowave.Storage,
  logger = require('../core/Logger')('radiowave');

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