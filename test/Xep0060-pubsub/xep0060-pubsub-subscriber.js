'use strict';

// assertion
var assert = require('assert'),
    should = require('should'),
    helper = require('../_helper/helper');

// logging
helper.configureLoglevel('silly');

// xmpp client
var ltx = require('ltx'),
    Client = require('node-xmpp-client'),
    Message = require('node-xmpp-core').Stanza.Message;

// x rocket server
var xRocket = require('../../xrocket'),
    C2SServer = require('xrocketd-cm').Net.C2SServer;

// Xep Components
var Xep0060 = require('../../xep/Xep0060-pubsub');

// Storage
var UsrModule = require('../../storage/in-memory/Users');
var Users = new UsrModule();
var LookupModule = require('../../storage/in-memory/Lookup');
var Lookup = new LookupModule();

// user
var userRomeo = {
    jid: 'romeo@example.net',
    password: 'romeo',
    host: 'localhost'
};

var userJulia = {
    jid: 'julia@example.net',
    password: 'julia',
    host: 'localhost'
};

function getClientRomeo() {
    var cl = new Client({
        jid: userRomeo.jid,
        password: userRomeo.password,
        preferred: 'PLAIN',
        host: userRomeo.host
    });
    return cl;
}

function getClientJulia() {
    var cl = new Client({
        jid: userJulia.jid,
        password: userJulia.password,
        preferred: 'PLAIN',
        host: userJulia.host
    });
    return cl;
}

/*
    var clJulia = null;
    var clRomeo = null;
clJulia = getClientJulia();
clRomeo = getClientRomeo();
*/

/**
 * @see http://xmpp.org/extensions/xep-0060.html
 */
describe('Xep-0060', function () {

    var xR = null;

    function setUpServer(done) {
        // C2S Server 
        var cs2 = new C2SServer({});
        //cs2.registerSaslMechanism(Plain);

        // attach connection manager to xrocket
        xR = new xRocket.XRocket();
        xR.addConnectionManager(cs2);

        // register users
        var simpleAuth = new xRocket.Auth.Simple();
        simpleAuth.addUser('romeo', 'romeo');
        simpleAuth.addUser('julia', 'julia');
        xR.connectionRouter.authMethods.push(simpleAuth);

        // register xep component
        var cr = new xRocket.Router.ComponentRouter({
            domain: 'example.net'
        });
        var lr = new xRocket.Router.LogRouter();
        // chain XRocket to ComponentRouter
        xR.chain(lr).chain(cr);


        // register pubsub component
        cr.register(new Xep0060({
            subdomain: 'pubsub',
            domain: 'example.net',
            storage : {
                lookup : Lookup,
                users: Users
            }
        }));

        done();

        /*var PGConn = require('../../storage/postgre/PGConn');
        var pgConnectionString = process.env.DATABASE_URL;
        var pgC = new PGConn(pgConnectionString);
        pgC.connect(function () {
            cr.register(new Xep0060({
                subdomain: 'pubsub',
                domain: 'example.net',
                storage: {
                    client: pgC.getClient()
                }
            }));

            done();
        });*/
    }

    function sendMessageWithRomeo(stanza, done) {
        var cl = getClientRomeo();

        cl.on('stanza',
            function (stanza) {
                done(null, stanza);
            });

        cl.on('online', function () {
            cl.send(stanza);
        });

        cl.on('error', function (e) {
            console.log(e);
            done(e);
        });
    }

    before(function (done) {
        setUpServer(function (err) {
            done(err);
        });
    });

    after(function (done) {
        xR.shutdown();
        done();
    });

    describe('6. Subscriber Use Cases', function () {

        describe('6.1 Subscribe to a Node', function () {

            it('Precondition: Create a node', function (done) {
                var id = 'newnode-r2d2';
                var create = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: userRomeo.jid,
                    type: 'set',
                    id: id
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('create', {
                    'node': 'princely_musings'
                });

                sendMessageWithRomeo(create, function (err, stanza) {
                    should.not.exist(err);
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'result');
                        assert.equal(stanza.attrs.id, id);
                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });
            });

            /*
             * <iq type='error'
             *     from='pubsub.shakespeare.lit'
             *     to='francisco@denmark.lit/barracks'
             *     id='sub1'>
             *   <error type='modify'>
             *     <bad-request xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
             *     <invalid-jid xmlns='http://jabber.org/protocol/pubsub#errors'/>
             *   </error>
             * </iq>
             */
            it('6.1.3.1 JIDs Do Not Match', function (done) {
                var id = 'subscribe-r2d2';
                var subscribe = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: userRomeo.jid,
                    type: 'set',
                    id: id
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('subscribe', {
                    'node': 'princely_musings',
                    'jid': userJulia.jid
                });

                sendMessageWithRomeo(subscribe, function (err, stanza) {
                    should.not.exist(err);
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'error');
                        assert.equal(stanza.attrs.id, id);

                        var error = stanza.getChild('error');
                        error.should.not.be.empty;

                        assert.equal(error.attrs.type, 'modify');

                        var badrequest = error.getChild('bad-request', 'urn:ietf:params:xml:ns:xmpp-stanzas');
                        badrequest.should.not.be.empty;

                        var invalid = error.getChild('invalid-jid', 'http://jabber.org/protocol/pubsub#errors');
                        invalid.should.not.be.empty;

                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });
            });

            /*
             * <iq type='error'
             *     from='pubsub.shakespeare.lit'
             *     to='francisco@denmark.lit/barracks'
             *     id='sub1'>
             *   <error type='cancel'>
             *     <item-not-found xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
             *   </error>
             * </iq>
             */
            it('6.1.3.12 Node Does Not Exist', function (done) {
                var id = 'subscribe-r2d2';
                var subscribe = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: userRomeo.jid,
                    type: 'set',
                    id: id
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('subscribe', {
                    'node': 'princely_musings2',
                    'jid': userRomeo.jid
                });

                sendMessageWithRomeo(subscribe, function (err, stanza) {
                    should.not.exist(err);
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'error');
                        assert.equal(stanza.attrs.id, id);

                        var error = stanza.getChild('error');
                        error.should.not.be.empty;

                        assert.equal(error.attrs.type, 'cancel');

                        var badrequest = error.getChild('item-not-found', 'urn:ietf:params:xml:ns:xmpp-stanzas');
                        badrequest.should.not.be.empty;

                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });
            });

            /**
             * request
             * <iq type='set'
             *     from='francisco@denmark.lit/barracks'
             *     to='pubsub.shakespeare.lit'
             *     id='sub1'>
             *   <pubsub xmlns='http://jabber.org/protocol/pubsub'>
             *     <subscribe
             *         node='princely_musings'
             *         jid='francisco@denmark.lit'/>
             *   </pubsub>
             * </iq>
             *
             * response
             * <iq type='result'
             *     from='pubsub.shakespeare.lit'
             *     to='francisco@denmark.lit/barracks'
             *     id='sub1'>
             *   <pubsub xmlns='http://jabber.org/protocol/pubsub'>
             *     <subscription
             *         node='princely_musings'
             *         jid='francisco@denmark.lit'
             *         subid='ba49252aaa4f5d320c24d3766f0bdcade78c78d3'
             *         subscription='subscribed'/>
             *   </pubsub>
             * </iq>
             */
            it('6.1 Subscribe to a Node', function (done) {
                var id = 'subscribe-r2d2';
                var subscribe = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: userRomeo.jid,
                    type: 'set',
                    id: id
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('subscribe', {
                    'node': 'princely_musings',
                    'jid': userRomeo.jid
                });

                sendMessageWithRomeo(subscribe, function (err, stanza) {
                    console.log(stanza.toString());
                    should.not.exist(err);
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'result');
                        assert.equal(stanza.attrs.id, id);

                        var pubsub = stanza.getChild('pubsub', 'http://jabber.org/protocol/pubsub');
                        pubsub.should.not.be.empty;

                        var subscription = pubsub.getChild('subscription');
                        subscription.should.not.be.empty;

                        assert.equal(subscription.attrs.node, 'princely_musings');
                        assert.equal(subscription.attrs.jid, userRomeo.jid);
                        assert.equal(subscription.attrs.subscription, 'subscribed');

                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });
            });
        });

        describe('6.2. Unsubscribe from a Node', function () {

            /*
             * request
             * <iq type='set'
             *    from='francisco@denmark.lit/barracks'
             *    to='pubsub.shakespeare.lit'
             *    id='unsub1'>
             *  <pubsub xmlns='http://jabber.org/protocol/pubsub'>
             *     <unsubscribe
             *         node='princely_musings'
             *         jid='francisco@denmark.lit'/>
             *  </pubsub>
             * </iq>
             *
             * response
             * <iq type='result'
             *     from='pubsub.shakespeare.lit'
             *     to='francisco@denmark.lit/barracks'
             *     id='unsub1'/>
             */
            it('6.2. Unsubscribe from a Node', function (done) {
                console.log('6.2. Unsubscribe from a Node');
                var id = 'unsubscribe-r2d2';
                var unsubscribe = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: userRomeo.jid,
                    type: 'set',
                    id: id
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('unsubscribe', {
                    'node': 'princely_musings',
                    'jid': userRomeo.jid
                });

                sendMessageWithRomeo(unsubscribe, function (err, stanza) {
                    should.not.exist(err);
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'result');
                        assert.equal(stanza.attrs.id, id);
                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });
            });

            /*
             * <iq type='error'
             *     from='pubsub.shakespeare.lit'
             *     to='francisco@denmark.lit/barracks'
             *     id='unsub1'>
             *   <error type='cancel'>
             *     <unexpected-request xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
             *     <not-subscribed xmlns='http://jabber.org/protocol/pubsub#errors'/>
             *   </error>
             * </iq>
             */
            it('6.2.3.2 No Such Subscriber', function (done) {
                var id = 'unsubscribe-r2d2';
                var unsubscribe = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: userRomeo.jid,
                    type: 'set',
                    id: id
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('unsubscribe', {
                    'node': 'princely_musings',
                    'jid': userRomeo.jid
                });

                sendMessageWithRomeo(unsubscribe, function (err, stanza) {
                    should.not.exist(err);
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'error');
                        assert.equal(stanza.attrs.id, id);

                        var error = stanza.getChild('error');
                        error.should.not.be.empty;

                        assert.equal(error.attrs.type, 'cancel');

                        var unexpected = error.getChild('unexpected-request', 'urn:ietf:params:xml:ns:xmpp-stanzas');
                        unexpected.should.not.be.empty;

                        var notsubscribed = error.getChild('not-subscribed', 'http://jabber.org/protocol/pubsub#errors');
                        notsubscribed.should.not.be.empty;

                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });
            });

            /*
             * <iq type='error'
             *     from='pubsub.shakespeare.lit'
             *     to='francisco@denmark.lit/barracks'
             *     id='unsub1'>
             *   <error type='cancel'>
             *     <item-not-found xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
             *   </error>
             * </iq>
             */
            it('6.2.3.4 Node Does Not Exist', function (done) {
                var id = 'unsubscribe-r2d2';
                var unsubscribe = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: userRomeo.jid,
                    type: 'set',
                    id: id
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('unsubscribe', {
                    'node': 'princely_musings_2',
                    'jid': userRomeo.jid
                });

                sendMessageWithRomeo(unsubscribe, function (err, stanza) {
                    should.not.exist(err);
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'error');
                        assert.equal(stanza.attrs.id, id);

                        var error = stanza.getChild('error');
                        error.should.not.be.empty;

                        assert.equal(error.attrs.type, 'cancel');

                        var itemnotfound = error.getChild('item-not-found', 'urn:ietf:params:xml:ns:xmpp-stanzas');
                        itemnotfound.should.not.be.empty;

                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });
            });

            it('Postcondition: delete node', function (done) {
                var id = 'delete-r2d2';
                var deleteIQ = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: userRomeo.jid,
                    type: 'set',
                    id: id
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub#owner'
                }).c('delete', {
                    'node': 'princely_musings'
                });

                sendMessageWithRomeo(deleteIQ, function (err, stanza) {
                    console.log("Error:" + stanza.toString());
                    should.not.exist(err);
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'result');
                        assert.equal(stanza.attrs.id, id);
                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });
            });
        });
    });
});