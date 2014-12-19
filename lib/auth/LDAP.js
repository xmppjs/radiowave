'use strict';

var util = require('util'),
  Authenticator = require('./Authenticator'),
  JID = require('node-xmpp-core').JID,
  ldap = require('ldapjs'),
  Promise = require('bluebird'),
  logger = require('../core/Logger')('authentication');

function LDAP(settings) {
  this.settings = settings || {};

  // LDAP settings
  this.suffix = settings.suffix;
  this.uidTag = settings.uidTag;

}
util.inherits(LDAP, Authenticator);

LDAP.prototype.name = 'LDAP';

LDAP.prototype.match = function (method) {
  if (method === 'PLAIN') {
    return true;
  } else {
    return false;
  }
};

LDAP.prototype.authenticateWithLDAP = function (username, password) {
  var self = this;
  return new Promise(function (resolve, reject) {

    // check that we got username and password
    if (!username || !password) {
      reject(new Error('parameters are missing'));
    } else {

      // LDAP client
      var client = ldap.createClient({
        url: self.settings.url,
        maxConnections: 5
      });

      // generate unix ldap like user name
      var uid = self.uidTag + '=' + username + ',' + self.suffix;

      logger.debug('uid: ' + uid);

      // bind for authentication
      client.bind(uid, password, function (err) {
        // error
        if (err) {
          logger.error(err);
          reject(err);
        } else {
          resolve({
            uid: uid
          });
        }
      });

      client.once('error', function (err) {
        logger.error(err);
      });
    }
  });
};

LDAP.prototype.authenticate = function (opts) {
  var username = null;

  // generate ldap username 
  if (opts.jid) {
    username = new JID(opts.jid.toString()).getLocal();
  } else if (opts.username) {
    username = opts.username;
  }

  var self = this;
  return new Promise(function (resolve, reject) {
    // authenticate with LDAP bind
    self.authenticateWithLDAP(username, opts.password).then(function (user) {
      opts.uid = user.uid;
      resolve(opts);
    }).catch(function (err) {
      logger.error(err);
      reject(err);
    });
  });

};

module.exports = LDAP;
