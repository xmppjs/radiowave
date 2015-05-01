'use strict';

var radiowave = require('../'),
  Storage = radiowave.Storage,
  logger = require('../core/Logger')('radiowave');

function StorageLoader() {}

StorageLoader.prototype.load = function (settings) {

  // load settings
  var storageSettings = {}

  // check if we have a Docker postgres linked
  if (process.env.PG_ENV_POSTGRES_PASSWORD != null) {
    logger.info('Use PostgresSQL linked via Docker');
    storageSettings = {
        'dialect' : 'postgres',
        'native': true,
        'user': 'postgres',
        'password' : process.env.PG_ENV_POSTGRES_PASSWORD,
        'database': 'postgres',
        'host': process.env.PG_PORT_5432_TCP_ADDR,
        'port': process.env.PG_PORT_5432_TCP_PORT
    }
  } 
  // fallback to json configuration
  else {
    storageSettings = settings.get('storage');
  }

  // inistanciate storage module
  var s = new Storage(storageSettings);

  // return promise
  return s.initialize();

};

module.exports = StorageLoader;