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
    describe('room members', function () {

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

        it('add member', function (done) {
            var user = {
                'jid': 'romeo@shakespeare.lit',
                'content': {
                    'name': 'Romeo J.'
                }
            }

            var result = [{
                "content": {
                    "name": "Romeo J."
                },
                "jid": "romeo@shakespeare.lit"
            }];

            // add member
            room.addMember(user.jid, user.content).then(function (success) {
                // list all members
                room.listMembers().then(function (members) {
                    members.should.not.be.empty;
                    assert.deepEqual(members, result);
                    done();
                });
            }, function (err) {
                done(err);
            });
        });

        it('add member', function (done) {
            var user = {
                'jid': 'julia@shakespeare.lit',
                'content': {
                    'name': 'Julia J.'
                }
            };

            var result = [{
                "content": {
                    "name": "Romeo J."
                },
                "jid": "romeo@shakespeare.lit"
            }, {
                "content": {
                    "name": "Julia J."
                },
                "jid": "julia@shakespeare.lit"
            }];

            // add member
            room.addMember(user.jid, user.content).then(function (success) {
                // list all members
                room.listMembers().then(function (members) {
                    members.should.not.be.empty;
                    assert.deepEqual(members, result);
                    done();
                });
            }, function (err) {
                done(err);
            });
        });

        it('list members', function (done) {
            var result = [{
                "content": {
                    "name": "Romeo J."
                },
                "jid": "romeo@shakespeare.lit"
            }, {
                "content": {
                    "name": "Julia J."
                },
                "jid": "julia@shakespeare.lit"
            }];

            // list all members
            room.listMembers().then(function (members) {
                members.should.not.be.empty;
                assert.deepEqual(members, result);
                done();
            }, function (err) {
                done(err);
            });
        });


        it('remove member', function (done) {
            var result = [{
                "content": {
                    "name": "Julia J."
                },
                "jid": "julia@shakespeare.lit"
            }];

            // remove emails
            room.removeMember('romeo@shakespeare.lit').then(function (success) {
                // list all emails
                room.listMembers().then(function (members) {
                    members.should.not.be.empty;
                    assert.deepEqual(members, result);
                    done();
                });
            });
        });

        it('list members', function (done) {
            var result = [{
                "content": {
                    "name": "Julia J."
                },
                "jid": "julia@shakespeare.lit"
            }];

            // list all members
            room.listMembers().then(function (members) {
                members.should.not.be.empty;
                assert.deepEqual(members, result);
                done();
            }, function (err) {
                done(err);
            });
        });

        it('edit member', function (done) {
            var content = {
                    "name": "Julia K."
            };

            var result = [{
                "content": {
                    "name": "Julia K."
                },
                "jid": "julia@shakespeare.lit"
            }];

            // remove emails
            room.editMember('julia@shakespeare.lit', content).then(function (success) {
                // list all emails
                room.listMembers().then(function (members) {
                    members.should.not.be.empty;
                    assert.deepEqual(members, result);
                    done();
                });
            });
        });

    });

});