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

    describe('user email', function () {

        var user = null;
        beforeEach(function (done) {
            Users.user(username).then(
                function (usr) {
                    user = usr;
                    done();
                },
                function (error) {
                    done(error);
                }
            );
        });

        it('add email', function (done) {
            var result = ['romeo@shakespeare.lit'];

            // add email
            user.addEmail('romeo@shakespeare.lit').then(function (success) {
                // list all emails
                user.listEmails().then(function (emails) {
                    assert.deepEqual(emails, result);
                    done();
                });
            });
        });

        it('add email', function (done) {
            var result = ['romeo@shakespeare.lit', 'romeo2@shakespeare.lit'];

            // add email
            user.addEmail('romeo2@shakespeare.lit').then(function (success) {
                // list all emails
                user.listEmails().then(function (emails) {
                    assert.deepEqual(emails, result);
                    done();
                });
            }, function (err) {
                done(err);
            });
        });

        it('list emails', function (done) {
            var result = ['romeo@shakespeare.lit', 'romeo2@shakespeare.lit'];
            // list all emails
            user.listEmails().then(function (emails) {
                assert.deepEqual(emails, result);
                done();
            }, function (err) {
                done(err);
            });
        });

        it('remove email', function (done) {
            var result = ['romeo2@shakespeare.lit'];

            // remove emails
            user.removeEmail('romeo@shakespeare.lit').then(function (success) {
                // list all emails
                user.listEmails().then(function (emails) {
                    assert.deepEqual(emails, result);
                    done();
                });
            }, function (err) {
                done(err);
            });
        });

        it('list emails', function (done) {
            var result = ['romeo2@shakespeare.lit'];

            // list all emails
            user.listEmails().then(function (emails) {
                assert.deepEqual(emails, result);
                done();
            }, function (err) {
                done(err);
            });
        });
    });
});