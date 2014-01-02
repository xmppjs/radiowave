// assertion
var assert = require('assert'),
    should = require('should');


var PubSubNode = require('../../xep/Xep0060-pubsub/PubSubNode');

describe('Pubsub Nodes', function () {
    describe('Node Creation', function () {

        var subscriber = ['romeo@example.net', 'juliet@example.net'];
        var node = null;

        it('Minimum parameters: all missing', function (done) {
            // check that the minimum of is required (name, subdomain) must be set
            try {
                var pub = new PubSubNode();
                done("properties not checked");
            } catch (err) {
                done();
            }
        });

        it('Minimum parameters: empty object', function (done) {
            // check that the minimum of is required (name, subdomain) must be set
            try {
                var pub = new PubSubNode({});
                done("properties not checked");
            } catch (err) {
                done();
            }
        });

        it('Minimum parameters: missing subdomain', function (done) {
            // check that the minimum of is required (name, subdomain) must be set
            try {
                var pub = new PubSubNode({
                    'name': 'name1'
                });
                done("properties not checked");
            } catch (err) {
                done();
            }
        });


        it('Minimum parameters: missing node name', function (done) {
            // check that the minimum of is required (name, subdomain) must be set
            try {
                var pub = new PubSubNode({
                    'subdomain': 'pubsub'
                });
                done("properties not checked");
            } catch (err) {
                done();
            }
        });

        it('Minimum parameters: all set', function (done) {
            // check that the minimum of is required (name, subdomain) must be set
            node = new PubSubNode({
                'name': 'name1',
                'subdomain': 'pubsub'
            });
            done();
        });

        it('Add subscription', function (done) {

            var result = {
                "name": "name1",
                "subdomain": "pubsub",
                "subscriptions": {
                    "romeo@example.net": true
                }
            };

            node.subscribe(subscriber[0]);
            console.log(JSON.stringify(node.getNodeDescription()));
            assert.equal(JSON.stringify(node.getNodeDescription()), JSON.stringify(result));
            assert.equal(node.countSubscriptions(), 1);
            done();
        });

        it('Add subscription', function (done) {

            var result = {
                "name": "name1",
                "subdomain": "pubsub",
                "subscriptions": {
                    "romeo@example.net": true,
                    "juliet@example.net": true
                }
            };

            node.subscribe(subscriber[1]);

            console.log(JSON.stringify(node.getNodeDescription()));
            assert.equal(JSON.stringify(node.getNodeDescription()), JSON.stringify(result));
            assert.equal(node.countSubscriptions(), 2);
            done();
        });

        it('Get all subscribers', function (done) {

            var subs = node.getSubscriptions();
            console.log(subs);
            // compare result with expected subscriptions
            assert.deepEqual(subs.sort(), subscriber.sort());
            assert.equal(node.countSubscriptions(), 2);
            done();
        });

        it('Set configuration', function (done) {
            done();
        });

        it('Get configuration', function (done) {
            done();
        });

        it('Check owner', function (done) {
            done();
        });

        it('Is romeo subscriber', function (done) {
            assert.ok(node.isSubscribed(subscriber[0]));
            done();
        });

        it('Is juiet subscriber', function (done) {
            assert.ok(node.isSubscribed(subscriber[1]));
            done();
        });

        it('Delete subscription', function (done) {
            node.unsubscribe(subscriber[0]);
            console.log("SUBS: " + node.isSubscribed(subscriber[0]));
            assert.equal(node.isSubscribed(subscriber[0]), false);
            assert.ok(node.isSubscribed(subscriber[1]));
            assert.equal(node.countSubscriptions(), 1);
            done();
        });

        it('Delete subscription', function (done) {
            node.unsubscribe(subscriber[1]);
            assert.equal(node.isSubscribed(subscriber[0]), false);
            assert.equal(node.isSubscribed(subscriber[1]), false);
            assert.equal(node.countSubscriptions(), 0);
            done();
        });
    });
});