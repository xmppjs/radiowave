/*
// assertion
var assert = require('assert'),
    should = require('should');

// logging
var LogConfig = require('../../config/LogConfig');
LogConfig.configure('error');

// postgresql and roaster storage
var PGConn = require('../../storage/postgre/PGConn');
    PubsubItems = require('../../storage/postgre/pubsub/Items');

var subdomain = 'pubsub';
var node = 'princely_musings';

var item1 = {
     subdomain : subdomain,
     node : node,
     id : 'bnd81g37d61f49fgn581',
     sender : 'hamlet@denmark.lit/blogbot',
     entry : "<entry xmlns='http://www.w3.org/2005/Atom'></entry>"
};

var item2 = {
     subdomain : subdomain,
     node : node,
     id : 'ae890ac52d0df67ed7cfdf51b644e901',
     sender : 'bernardo@denmark.lit',
     entry : "<entry xmlns='http://www.w3.org/2005/Atom'></entry>"
};

describe('Pubsub Items', function () {
    describe('Postgresql', function () {
        var pubsubItems = null;
        var initialitems = null;

        before(function (done) {
            var pgConnectionString = process.env.DATABASE_URL;

            var pgC = new PGConn(pgConnectionString);
            pgC.connect(function () {
                pubsubItems = new PubsubItems({
                    client: pgC.getClient()
                });
                done();
            });
        });

        it('Get all node items', function (done) {

            pubsubItems.list(subdomain, node, function (err, items) {
                should.not.exist(err);
                assert.equal(items instanceof Array, true);
                assert.equal(items.length >= 0, true);
                initialitems = items;
                done();
            });
        });

        it('Add a new item to node', function (done) {

            pubsubItems.add(item1, function (err, item) {
                should.not.exist(err);
                assert.deepEqual(item1, item);
                done();
            });
        });

        it('New stored item should look like to original', function (done) {
            pubsubItems.get(item1.subdomain, item1.node, item1.id, function (err, item) {
                should.not.exist(err);
                assert.deepEqual(item, item1);
                done();
            });
        });

        it('Items should include the new entry', function (done) {
            pubsubItems.list(item1.subdomain, item1.node, function (err, items) {
                should.not.exist(err);
                assert.equal(items instanceof Array, true);
                assert.ok(items.length === initialitems.length + 1);
                done();
            });
        });

        it('Add a new item two to node', function (done) {
            pubsubItems.add(item2, function (err, item) {
                should.not.exist(err);
                assert.deepEqual(item2, item);
                done();
            });
        });

        it('Items should include the new entry', function (done) {
            pubsubItems.list(item1.subdomain, item1.node, function (err, items) {
                should.not.exist(err);
                assert.equal(items instanceof Array, true);
                assert.ok(items.length === initialitems.length + 2);
                done();
            });
        });

        it('Delete a item one', function (done) {
            pubsubItems.delete(item1.subdomain, item1.node, item1.id, function (err) {
                should.not.exist(err);
                done();
            });
        });

        it('Items should include the new entry', function (done) {
            pubsubItems.list(item1.subdomain, item1.node, function (err, items) {
                should.not.exist(err);
                assert.equal(items instanceof Array, true);
                assert.ok(items.length === initialitems.length + 1);
                done();
            });
        });

        it('Delete a item two', function (done) {
            pubsubItems.delete(item2.subdomain, item2.node, item2.id, function (err) {
                should.not.exist(err);
                done();
            });
        });

        it('Compare current item list with inital item list', function (done) {
            pubsubItems.list(item1.subdomain, item1.node, function (err, items) {
                should.not.exist(err);
                assert.equal(items instanceof Array, true);
                assert.deepEqual(items, initialitems);
                assert.ok(items.length === initialitems.length);
                done();
            });
        });
    });
});
*/