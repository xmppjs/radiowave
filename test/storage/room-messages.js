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

var UsrModule = require('../../storage/in-memory/Users');
var Users = new UsrModule();

var username = 'romeo';

describe('storage', function () {

    describe('room messages', function () {

        var user = null;
        var room = null;

        before(function (done) {
            Users.user(username).then(
                function (usr) {
                    user = usr;
                    user.createRoom('hello').then(function (newroom) {
                        room = newroom;
                        done();
                    });
                },
                function (error) {
                    done(error);
                }
            );
        });

        it('create message', function (done) {
            var message = 'abc';

            room.createMessage(message).then(function (id) {

                room.getMessage(id).then(function (msg) {
                    msg.should.not.be.empty;
                    assert.deepEqual(msg, message);
                    done();
                });
            }, function (err) {
                done(err);
            });
        });

        it('create message', function (done) {
            var message = 'dfg';

            room.createMessage(message).then(function (id) {

                room.getMessage(id).then(function (msg) {
                    msg.should.not.be.empty;
                    assert.deepEqual(msg, message);
                    done();
                });
            }, function (err) {
                done(err);
            });
        });


        it('list messages', function (done) {
            var result = ['abc', 'dfg'];

            room.listMessages().then(function (messages) {
                messages.should.not.be.empty;
                assert.deepEqual(messages, result);
                done();
            });
        });

        it('edit message', function (done) {
            var result = ['abc', 'hij'];

            room.editMessage(1, result[1]).then(function (id) {

                room.listMessages().then(function (messages) {
                    messages.should.not.be.empty;
                    assert.deepEqual(messages, result);
                    done();
                });
            });
        });

        it('remove message', function (done) {
            var result = ['hij'];

            room.removeMessage(0).then(function (id) {

                room.listMessages().then(function (messages) {
                    messages.should.not.be.empty;
                    assert.deepEqual(messages, result);
                    done();
                });
            });
        });
    });
});