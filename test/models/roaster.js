'use strict';

var fs = require('fs'),
  uuid = require('node-uuid'),
  assert = require('assert'),
  radiowave = require('../../lib'),
  Storage = radiowave.Storage;

describe('Model', function () {

  var db = null;

  before(function (done) {

    // remove test.sqlite
    try {
      fs.unlinkSync("./test.sqlite");
    } catch (err) {
      // do nothing (e.g. if file does not exist)
    }

    db = new Storage({
      "dialect": "sqlite",
      "user": "username",
      "password": "password",
      "database": "database",
      "storage": "./test.sqlite"
    });

    // return promise
    db.initialize().then(function () {
      done();
    }).catch(function (err) {
      done(err);
    });

  });

  describe('User', function () {

    it('create users', function (done) {

      db.User.bulkCreate([{
        jid: 'john@example.net',
        name: 'John Doe'
      }, {
        jid: 'alice@example.net',
        name: "Alice"
      }, {
        jid: 'bob@example.net',
        name: 'Bob'
      }]).then(function (user) {
        // cool users are there
        done();
      }).catch(function (err) {
        done(err);
      });

    });

    it('john adds alice to the roaster', function (done) {

      db.User.find({
        where: {
          jid: 'john@example.net'
        }
      }).then(function (john) {

        db.User.find({
          where: {
            jid: 'alice@example.net'
          }
        }).then(function (alice) {

          john.addRoaster(alice, {
            name: 'ms. a',
            group: 'friends',
            subscription: 'none'
          }).then(function () {
            done();
          });
        });


      }).catch(function (err) {
        done(err);
      });

    });
  });
});