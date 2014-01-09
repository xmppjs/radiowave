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

    describe('user contacts', function () {

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

        it('add contact', function (done) {
            // add contact
            user.addContact('nurse@example.com', {
                name: "Nurse",
                groups: ['Servants']
            }).then(function (success) {
                // list all contacts
                return user.listContacts();
            }).then(function (contacts) {
                assert.equal(contacts.length, 1);
                var nurse = contacts[0];
                assert.equal(nurse.jid, "nurse@example.com");
                assert.equal(nurse.name, "Nurse");
                done();
            }).then(
                function () {},
                function (err) {
                    done(err);
                });
        });

        it('add contact', function (done) {
            // add email
            user.addContact('doctor@example.com', {
                name: "Doctor",
                groups: ['Hospital']
            }).then(function (success) {
                // list all contacts
                return user.listContacts();
            }).then(function (contacts) {
                assert.equal(contacts.length, 2);
                var nurse = contacts[0];
                assert.equal(nurse.jid, "nurse@example.com");
                assert.equal(nurse.name, "Nurse");

                var doctor = contacts[1];
                assert.equal(doctor.jid, "doctor@example.com");
                assert.equal(doctor.name, "Doctor");

                done();
            }).then(
                function () {},
                function (err) {
                    done(err);
                });
        });

        it('list contacts', function (done) {
            // list all contacts
            user.listContacts().then(function (contacts) {
                assert.equal(contacts.length, 2);
                var nurse = contacts[0];
                assert.equal(nurse.jid, "nurse@example.com");
                assert.equal(nurse.name, "Nurse");

                var doctor = contacts[1];
                assert.equal(doctor.jid, "doctor@example.com");
                assert.equal(doctor.name, "Doctor");
                done();
            }, function (err) {
                done(err);
            });
        });

        it('remove contact', function (done) {
            // remove contacts
            user.removeContact('doctor@example.com').then(function (success) {
                // list all contacts
                return user.listContacts()
            }).then(function (contacts) {
                assert.equal(contacts.length, 1);
                var nurse = contacts[0];
                assert.equal(nurse.jid, "nurse@example.com");
                assert.equal(nurse.name, "Nurse");
                done();
            }).then(
                function () {},
                function (err) {
                    done(err);
                });
        });

        it('list contacts', function (done) {
            var result = ['romeo2@shakespeare.lit'];

            // list all contacts
            user.listContacts().then(function (contacts) {
                assert.equal(contacts.length, 1);
                var nurse = contacts[0];
                assert.equal(nurse.jid, "nurse@example.com");
                assert.equal(nurse.name, "Nurse");
                done();
            }, function (err) {
                done(err);
            });
        });
    });
});