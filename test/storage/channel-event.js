// assertion
var assert = require('assert'),
    should = require('should'),
    winston = require('winston');

// configure logger before we load the Users module
winston.loggers.add('storage', {
    console: {
        label: 'storage',
        level: 'error',
        colorize: 'true'
    }
});

var UsrModule = require('../../storage/Users');
var Users = new UsrModule();

var username = 'romeo';

describe('storage', function () {

    describe('channel events', function () {

        var user = null;
        var channel = null;

        before(function (done) {
            Users.user(username).then(
                function (usr) {
                    user = usr;
                    user.createChannel('hello').then(function (newchannel) {
                        channel = newchannel;
                        done();
                    });
                },
                function (error) {
                    done(error);
                }
            );
        });

        it('trigger event', function (done) {
            var message = 'abc';
            var result = ['abc'];

            channel.trigger(message).then(function (id) {

                channel.getEvents().then(function (messages) {
                    messages.should.not.be.empty;
                    assert.deepEqual(messages, result);
                    done();
                });
            }, function (err) {
                done(err);
            });
        });

        it('trigger event', function (done) {
            var message = 'dfg';
            var result = ['abc', 'dfg'];

            channel.trigger(message).then(function (id) {

                channel.getEvents().then(function (messages) {
                    messages.should.not.be.empty;
                    assert.deepEqual(messages, result);
                    done();
                });
            }, function (err) {
                done(err);
            });
        });


        it('list events', function (done) {
            var result = ['abc', 'dfg'];

            // list all messages
            channel.getEvents().then(function (messages) {
                messages.should.not.be.empty;
                assert.deepEqual(messages, result);
                done();
            });
        });
    });
});