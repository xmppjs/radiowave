'use strict';

// assertion
var assert = require('assert'),
    should = require('should');

// logging
var LogConfig = require('../config/LogConfig');
LogConfig.configure('silly');

// xmpp client
var ltx = require('ltx'),
    Client = require('node-xmpp-client'),
    Message = require('node-xmpp-core').Stanza.Message;

// x rocket server
var xRocket = require('../xrocket'),
    C2SServer = xRocket.Net.C2SServer;

// Xep Components
var Xep0060 = require('../xep/Xep0060-pubsub');

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
        var cs2 = new xRocket.Net.C2SServer({});
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
        var cr = new xRocket.Router.ComponentRouter();

        // chain XRocket to ComponentRouter
        xR.chain(cr);

        // register pubsub component
        var PGConn = require('../util/PGConn');
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
        });
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

    describe('Pubblish-Subscribe', function () {

        describe('8.1 Create a Node', function () {
            /**
             * request
             * <iq type='set'
             *     from='hamlet@denmark.lit/elsinore'
             *     to='pubsub.shakespeare.lit'
             *     id='create1'>
             *   <pubsub xmlns='http://jabber.org/protocol/pubsub'>
             *     <create node='princely_musings'/>
             *   </pubsub>
             * </iq>
             *
             * <iq type='result'
             *     from='pubsub.shakespeare.lit'
             *     to='hamlet@denmark.lit/elsinore'
             *     id='create1'/>
             */
            it('8.1 Create a Node', function (done) {
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

            /**
             * Response
             * <iq type='error'
             *     from='pubsub.shakespeare.lit'
             *     to='hamlet@denmark.lit/elsinore'
             *     id='create1'>
             *   <error type='cancel'>
             *     <conflict xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
             *   </error>
             * </iq>
             */
            it('8.1 Create a Node: NodeID already exists', function (done) {
                var id = 'existingnode-r2d2';
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
                        assert.equal(stanza.attrs.type, 'error');
                        assert.equal(stanza.attrs.id, id);

                        var error = stanza.getChild('error');
                        assert.equal(error.attrs.type, 'cancel');

                        var conflict = error.getChild('conflict', 'urn:ietf:params:xml:ns:xmpp-stanzas');
                        assert.equal(conflict.toString(), "<conflict xmlns=\"urn:ietf:params:xml:ns:xmpp-stanzas\"/>");

                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });
            });

            /*
             * request
             * <iq type='set'
             *     from='hamlet@denmark.lit/elsinore'
             *     to='pubsub.shakespeare.lit'
             *     id='create2'>
             *     <pubsub xmlns='http://jabber.org/protocol/pubsub'>
             *       <create/>
             *     </pubsub>
             * </iq>
             *
             * response
             * <iq type='result'
             *     from='pubsub.shakespeare.lit'
             *     to='hamlet@denmark.lit/elsinore'
             *     id='create2'>
             *     <pubsub xmlns='http://jabber.org/protocol/pubsub'>
             *       <create node='25e3d37dabbab9541f7523321421edc5bfeb2dae'/>
             *     </pubsub>
             * </iq>
             */
            it('8.1 Create a Node: Entity requests an instant node', function (done) {
                var id = 'newnode-r2d2';
                var create = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: userRomeo.jid,
                    type: 'set',
                    id: id
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('create');

                sendMessageWithRomeo(create, function (err, stanza) {
                    should.not.exist(err);
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'result');
                        assert.equal(stanza.attrs.id, id);
                        var pubsub = stanza.getChild('pubsub', 'http://jabber.org/protocol/pubsub');
                        pubsub.should.not.be.empty;
                        var create = pubsub.getChild('create');
                        var nodename = create.attrs.node;
                        nodename.should.match(/[A-Za-z0-9-]{36}/); // uuid

                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });
            });

        });

        describe('6.1 Subscribe to a Node', function () {

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

        });

        describe('8.4 Delete a Node', function () {

            /*
             * <iq type='error'
             *     from='pubsub.shakespeare.lit'
             *     to='hamlet@denmark.lit/elsinore'
             *     id='delete1'>
             *   <error type='auth'>
             *     <forbidden xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
             *   </error>
             * </iq>
             */
            it('8.4.3.1 Insufficient Privileges', function (done) {
                // we can only delete nodes if we are the owner
                done();
            });

            /*
             * <iq type='error'
             *    from='pubsub.shakespeare.lit'
             *    to='hamlet@denmark.lit/elsinore'
             *    id='delete1'>
             *  <error type='cancel'>
             *    <item-not-found xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
             *  </error>
             * </iq>
             */
            it('8.4.3.2 Node Does Not Exist', function (done) {
                var id = 'delete-r2d2';
                var deleteIQ = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: userRomeo.jid,
                    type: 'set',
                    id: id
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub#owner'
                }).c('delete', {
                    'node': 'princely_musings2'
                });

                sendMessageWithRomeo(deleteIQ, function (err, stanza) {
                    should.not.exist(err);
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'error');
                        assert.equal(stanza.attrs.id, id);

                        var error = stanza.getChild('error');
                        assert.equal(error.attrs.type, 'cancel');

                        var conflict = error.getChild('item-not-found', 'urn:ietf:params:xml:ns:xmpp-stanzas');
                        assert.equal(conflict.toString(), '<item-not-found xmlns=\"urn:ietf:params:xml:ns:xmpp-stanzas\"/>');

                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });
            });

            /*
             * request
             * <iq type='set'
             *     from='hamlet@denmark.lit/elsinore'
             *     to='pubsub.shakespeare.lit'
             *     id='delete1'>
             *   <pubsub xmlns='http://jabber.org/protocol/pubsub#owner'>
             *     <delete node='princely_musings'/>
             *   </pubsub>
             * </iq>
             *
             * response
             * <iq type='result'
             *     from='pubsub.shakespeare.lit'
             *     id='delete1'/>
             *
             * <message from='pubsub.shakespeare.lit' to='francisco@denmark.lit' id='foo'>
             *   <event xmlns='http://jabber.org/protocol/pubsub#event'>
             *     <delete node='princely_musings'>
             *       <redirect uri='xmpp:hamlet@denmark.lit?;node=blog'/>
             *     </delete>
             *   </event>
             * </message>
             *
             * <message from='pubsub.shakespeare.lit' to='bernardo@denmark.lit' id='bar'>
             *   <event xmlns='http://jabber.org/protocol/pubsub#event'>
             *     <delete node='princely_musings'>
             *       <redirect uri='xmpp:hamlet@denmark.lit?;node=blog'/>
             *     </delete>
             *   </event>
             * </message>
             */
            it('8.4.2 Success Case', function (done) {
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

            it('8.4.2 Subscribers are notified of node deletion', function (done) {
                done();
            });
        });
    });
});