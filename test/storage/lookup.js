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

var LookupModule = require('../../storage/in-memory/Lookup');
var Lookup = new LookupModule();

describe('storage', function () {

    describe('lookup', function () {

        it('add lookup', function (done) {
            Lookup.add('pubsub', 'romeo', 'node01', 'romeo_node01').then(function () {
                done();
            }, function () {
                done('error');
            });
        });

        it('find lookup', function (done) {
            Lookup.find('pubsub', 'romeo_node01').then(function (identifier) {
                assert.equal(identifier.user, 'romeo' );
                assert.equal(identifier.resource, 'node01' );
                done();
            },function () {
                done('error');
            });
        });
    });
});