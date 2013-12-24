// assertion
var assert = require('assert'),
    should = require('should');

// logging
var LogConfig = require('../config/LogConfig');
LogConfig.configure('error');

// postgresql and roaster storage
var PGConn = require('../util/PGConn');
    PubsubNodes = require('../xep/Xep0060-pubsub/storage/Nodes');

var subdomain = 'pubsub';
var node = 'princely_musings';

var node1 =  {
     "name" : "node1",
     "subdomain" : "pubsub",
     "subscription": {
         "romeo@example.net" : {},
         "julia@examplenet" : {}
     },
     "fiels" : {
         "pubsub#title" : "node1 title",
         "pubsub#description" : "description of node1"
     }
 };

var node2 =  {
     "name" : "node2",
     "subdomain" : "pubsub",
     "fiels" : {
         "pubsub#title" : "node2 title",
         "pubsub#description" : "description of node2"
     }
 };

 var node2a =  {
     "name" : "node2",
     "subdomain" : "pubsub",
     "subscription": {
         "romeo@example.net" : {}
     },
     "fiels" : {
         "pubsub#title" : "node2a title",
         "pubsub#description" : "desc 2a"
     }
 };

  var node2b =  {
     "name" : "node2",
     "subdomain" : "pubsub",
     "subscription": {
         "romeo@example.net" : {},
         "julia@examplenet" : {}
     },
     "fiels" : {
         "pubsub#title" : "node2b title",
         "pubsub#description" : "desc 2b"
     }
 };

describe('Pubsub Nodes', function () {
    describe('Postgresql', function () {
        var pubsubNodes = null;
        var initialitems = null;

        before(function (done) {
            var pgConnectionString = process.env.DATABASE_URL;

            var pgC = new PGConn(pgConnectionString);
            pgC.connect(function () {
                pubsubNodes = new PubsubNodes({
                    client: pgC.getClient()
                });
                done();
            });
        });

        it('Get all nodes', function (done) {

            pubsubNodes.list(subdomain, function (err, nodes) {
                should.not.exist(err);
                assert.equal(nodes instanceof Array, true);
                assert.equal(nodes.length >= 0, true);
                initialitems = nodes;
                done();
            });
        });

        it('Add a new node to pubsub', function (done) {

            pubsubNodes.add(node1, function (err, node) {
                should.not.exist(err);
                assert.deepEqual(node1, node);
                done();
            });
        });

        it('New stored node should look like the original', function (done) {
            pubsubNodes.get(node1.subdomain, node1.name, function (err, node) {
                should.not.exist(err);
                assert.deepEqual(node, node1);
                done();
            });
        });

        it('Nodes list should include the node', function (done) {
            pubsubNodes.list(node1.subdomain, function (err, nodes) {
                should.not.exist(err);
                assert.equal(nodes instanceof Array, true);
                assert.ok(nodes.length === initialitems.length + 1);
                done();
            });
        });

        it('Add a new node to pubsub', function (done) {
            pubsubNodes.add(node2, function (err, node) {
                should.not.exist(err);
                assert.deepEqual(node2, node);
                done();
            });
        });

        it('Update should be stored', function (done) {
            pubsubNodes.get(node2.subdomain, node2.name, function (err, node) {
                should.not.exist(err);
                assert.deepEqual(node, node2);
                done();
            });
        });

        it('Update pubsub item', function (done) {
            pubsubNodes.update(node2a, function (err, node) {
                should.not.exist(err);
                assert.deepEqual(node2a, node);
                done();
            });
        });

        it('Update should be stored', function (done) {
            pubsubNodes.get(node2.subdomain, node2.name, function (err, node) {
                should.not.exist(err);
                assert.deepEqual(node, node2a);
                done();
            });
        });

        it('Update pubsub item', function (done) {
            pubsubNodes.update(node2b, function (err, node) {
                should.not.exist(err);
                assert.deepEqual(node2b, node);
                done();
            });
        });

        it('Update should be stored', function (done) {
            pubsubNodes.get(node2.subdomain, node2.name, function (err, node) {
                should.not.exist(err);
                assert.deepEqual(node, node2b);
                done();
            });
        });

        it('Node list should include the new entry', function (done) {
            pubsubNodes.list(node1.subdomain, function (err, nodes) {
                should.not.exist(err);
                assert.equal(nodes instanceof Array, true);
                assert.ok(nodes.length === initialitems.length + 2);
                done();
            });
        });

        it('Delete a node one', function (done) {
            pubsubNodes.delete(node1, function (err) {
                should.not.exist(err);
                done();
            });
        });

        it('Node list should not include deleted entry', function (done) {
            pubsubNodes.list(node1.subdomain, function (err, nodes) {
                should.not.exist(err);
                assert.equal(nodes instanceof Array, true);
                assert.ok(nodes.length === initialitems.length + 1);
                done();
            });
        });

        it('Delete the second node', function (done) {
            pubsubNodes.delete(node2, function (err) {
                should.not.exist(err);
                done();
            });
        });

        it('Compare current node list with inital node list', function (done) {
            pubsubNodes.list(node1.subdomain, function (err, nodes) {
                should.not.exist(err);
                assert.equal(nodes instanceof Array, true);
                assert.deepEqual(nodes, initialitems);
                assert.ok(nodes.length === initialitems.length);
                done();
            });
        });
    });
});