'use strict';

var fs = require('fs'),
  uuid = require('node-uuid'),
  assert = require('assert'),
  xRocket = require('../../lib'),
  Storage = xRocket.Storage;

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

  describe('Channel', function () {

    it('create new user', function (done) {

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

    it('john creates new channel 1', function (done) {

      db.User.find({
        where: {
          jid: 'john@example.net'
        }
      }).then(function (user) {

        db.Channel.create({
          uuid: uuid.v4(),
          name: 'channel1'
        }).then(function (channel) {
          // done();

          user.addChannel(channel, {
            'affiliation': db.ChannelSub.Affiliation.Owner,
            'substate': db.ChannelSub.SubState.Member
          }).then(function () {
            console.log('got here');
            // added channel as member
            done();
          }).catch(function (err) {
            done(err);
          });

        });
      }).catch(function (err) {
        done(err);
      });

    });

    it('alice creates new channel 1', function (done) {

      db.User.find({
        where: {
          jid: 'alice@example.net'
        }
      }).then(function (user) {

        db.Channel.create({
          uuid: uuid.v4(),
          name: 'channel2'
        }).then(function (channel) {

          user.addChannel(channel, {
            'affiliation': db.ChannelSub.Affiliation.Owner,
            'substate': db.ChannelSub.SubState.Member
          }).then(function () {
            console.log('got here');
            done();
          }).catch(function (err) {
            done(err);
          });

        });
      }).catch(function (err) {
        done(err);
      });

    });

    it('get all channels where john is owner', function (done) {

      db.User.find({
        where: {
          jid: 'john@example.net'
        }
      }).then(function (user) {

        user.getChannels({
          where: {
            'ChannelSub.affiliation': db.ChannelSub.Affiliation.Owner
          }
        }).then(function (ownerChannels) {
          assert.equal(ownerChannels.length, 1);
          done();
        });
      });
    });

    it('add new configuration to channel', function (done) {

      db.Channel.find({
        where: {
          name: 'channel1'
        }
      }).then(function (channel) {

        db.ChannelConf.create({
          key: 'foo',
          value: 'bar'
        }).then(function (conf) {
          channel.addConfiguration(conf).then(function () {
            done();
          });
        });
      });
    });

    it('add new configuration to channel', function (done) {

      db.Channel.find({
        where: {
          name: 'channel1'
        }
      }).then(function (channel) {

        db.ChannelConf.create({
          key: 'foo2',
          value: 'bar2'
        }).then(function (conf) {
          channel.addConfiguration(conf).then(function () {
            done();
          });
        });
      });
    });

    it('try to add new configuration to channel with same key', function (done) {

      db.Channel.find({
        where: {
          name: 'channel1'
        }
      }).then(function (channel) {

        channel.getConfigurations({
          where: {
            key: 'foo'
          }
        }).then(function (conf) {
          if (conf && conf.length === 1) {
            var c = conf[0];
            c.value = 'bar2';
            c.save().then(function () {
              done();
            })
          } else {
            db.ChannelConf.create({
              key: 'foo',
              value: 'bar2'
            }).then(function (conf) {
              channel.addConfiguration(conf).then(function () {
                done('we should not land here');
              });
            });
          }
        })


      });
    });


    it('get configuration from channel', function (done) {
      db.Channel.find({
        where: {
          name: 'channel1'
        }
      }).then(function (channel) {

        channel.getConfigurations().then(function (conf) {
          console.log(JSON.stringify(conf));
          try {
            assert.equal(conf.length, 2);
            done();
          } catch (err) {
            done(err);
          }
        });

      });
    });

  });

});