'use strict';

var Promise = require('bluebird');

function Authenticator() {}

/**
 * @param method name of the method
 */
Authenticator.prototype.match = function (method) {
  return false;
};

/**
 * @param opts options hash-key map
 */
Authenticator.prototype.authenticate = function (opts) {
  return new Promise(function (resolve, reject) {
    reject();
  });
};

module.exports = Authenticator;