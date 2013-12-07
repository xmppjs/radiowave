// assertion
var assert = require('assert'),
    should = require('should');

// postgresql and roaster storage
var PGConn = require('../util/PGConn'),
    PostgreRoasterStore = require('../xep/Rfc3921-roaster/PostgreRoasterStore');

// user
var user = {
    jid: 'romeo@example.net'
};

var juliaAdd = {
    'jid' : 'julia@example.net',
    'name' : 'Julia',
    'subscription':'from',
    'group': ['Lovers']
};

var juliaUpdate = {
    'jid' : 'julia@example.net',
    'name' : 'Julia II',
    'subscription':'To',
    'group': ['Lovers', 'Friends' ]
};

var juliaNonExistent = {
    'jid' : 'julia2@example.net',
    'name' : 'Julia II',
    'subscription':'To',
    'group': ['Lovers', 'Friends' ]
}

describe('Roaster', function () {
    describe('Postgresql', function () {
        var roasterStorage;
        var initialroaster;

        before(function (done) {
            var pgConnectionString = process.env.DATABASE_URL;

            var pgC = new PGConn(pgConnectionString);
            pgC.connect(function () {
                roasterStorage = new PostgreRoasterStore({
                    client: pgC.getClient()
                });
                done();
            });
        });

        it('Get all roaster items', function (done) {

            roasterStorage.list(user.jid, function (err, roaster) {
                should.not.exist(err);
                assert.equal(roaster instanceof Array, true);
                assert.equal(roaster.length >= 0, true);
                initialroaster = roaster;
                done();
            });
        });

        it('Add a roaster item', function (done) {

            roasterStorage.add(user.jid, juliaAdd, function (err, item) {
                should.not.exist(err);
                assert.deepEqual(juliaAdd, item);
                done();
            });
        });

        it('Update a roaster item', function (done) {
            roasterStorage.update(user.jid, juliaUpdate, function (err, item) {
                should.not.exist(err);
                assert.deepEqual(juliaUpdate, item);
                done();
            });
        });

        it('Get one roaster item and compare it', function (done) {
            done();
        });

        it('Try to update a non-existent roaster item', function (done) {
            roasterStorage.update(user.jid, juliaNonExistent, function (err) {
                should.exist(err);
                done();
            });
        });

        it('Roaster should include the new entry', function (done) {
            roasterStorage.list(user.jid, function (err, roaster) {
                should.not.exist(err);
                assert.equal(roaster instanceof Array, true);
                assert.ok(roaster.length === initialroaster.length + 1);
                done();
            });
        });

        it('Delete a roaster item', function (done) {
            roasterStorage.delete(user.jid, juliaUpdate, function (err) {
                should.not.exist(err);
                done();
            });
        });

        it('Compate current roaster list with inital roaster list', function (done) {

            roasterStorage.list(user.jid, function (err, roaster) {
                should.not.exist(err);
                assert.equal(roaster instanceof Array, true);
                assert.deepEqual(roaster, initialroaster);
                assert.ok(roaster.length === initialroaster.length);
                done();
            });

            done();
        });
    });
});