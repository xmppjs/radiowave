'use strict';

var Promise = require('bluebird');

function Authenticator() {}

/**
 * @param method name of the method
 */
Authenticator.prototype.match = function (method) { // jshint ignore:line
  return false;
};

/**
 * @param opts options hash-key map
 */
Authenticator.prototype.authenticate = function (opts) { // jshint ignore:line
  return new Promise(function (resolve, reject) {
    reject();
  });
};

module.exports = Authenticator;
