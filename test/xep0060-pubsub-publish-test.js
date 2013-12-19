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

var uuid = require('node-uuid');

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

/**
 * @see http://xmpp.org/extensions/xep-0060.html
 */
describe('Xep-0060', function() {

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
        var lr = new xRocket.Router.LogRouter();
        // chain XRocket to ComponentRouter
        xR.chain(lr).chain(cr);

        // register pubsub component
        var PGConn = require('../util/PGConn');
        var pgConnectionString = process.env.DATABASE_URL;
        var pgC = new PGConn(pgConnectionString);
        pgC.connect(function() {
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

    function createNode(jid, node) {
        var id = 'existingnode-r2d2';
        var create = new ltx.Element('iq', {
            to: 'pubsub.example.net',
            from: jid,
            type: 'set',
            id: id
        }).c('pubsub', {
            'xmlns': 'http://jabber.org/protocol/pubsub'
        }).c('create', {
            'node': node
        });

        return create;
    }


    function deleteNode(jid, node) {
        var id = 'deletenode-r2d2';
        var deleteIq = new ltx.Element('iq', {
            to: 'pubsub.example.net',
            from: jid,
            type: 'set',
            id: id
        }).c('pubsub', {
            'xmlns': 'http://jabber.org/protocol/pubsub#owner'
        }).c('delete', {
            'node': node
        });

        return deleteIq;
    }

    function genSubscription(jid, node) {
        var id = 'subscribe-r2d2';
        var subscribe = new ltx.Element('iq', {
            to: 'pubsub.example.net',
            from: jid,
            type: 'set',
            id: id
        }).c('pubsub', {
            'xmlns': 'http://jabber.org/protocol/pubsub'
        }).c('subscribe', {
            'node': node,
            'jid': jid
        });

        return subscribe;
    }

    var eventhandler = {};

    function startClient(cl, done) {

        cl.on('stanza',
            function(stanza) {
                console.log("got stanza " + cl.jid + " " + stanza.toString());
                // get id and call the callback
                var callback = eventhandler[stanza.attrs.id];
                delete eventhandler[stanza.attrs.id];
                if (callback) {
                    callback(null, stanza);
                }
            }
        );

        cl.on('online', function() {
            done(null);
        });

        cl.on('error', function(e) {
            console.log(e);
            done(e);
        });
    }

    function sendMessage(cl, stanza, done) {
        var id = uuid.v4();
        // replace id
        stanza.root().attr('id', id);
        eventhandler[id] = done;


        console.log(stanza.root().toString());
        cl.send(stanza.root());
    }

    var romeoCl = null;
    var juliaCl = null;
    var node = uuid.v4();

    before(function(done) {
        setUpServer(function(err) {
            done(err);
        });
    });

    after(function(done) {
        xR.shutdown();
        done();
    });

    beforeEach(function(done) {
        romeoCl = getClientRomeo();
        juliaCl = getClientJulia();
        startClient(romeoCl, function(err) {
            console.log('romeo is online');
            done();
            /*startClient(juliaCl, function(err) {
                    console.log('julia is online');
                    done()
                })*/
        })
    })

    describe('Pubblish-Subscribe', function() {

        describe('7. Publisher Use Cases', function() {

            it('Precondition: Create a node', function(done) {
                var create = createNode(romeoCl.jid, node);
                sendMessage(romeoCl, create, function(err, stanza) {
                    done(err);
                });
            });


            /*
             * request:
             * <iq type='set'
             *     from='hamlet@denmark.lit/blogbot'
             *     to='pubsub.shakespeare.lit'
             *     id='publish1'>
             *   <pubsub xmlns='http://jabber.org/protocol/pubsub'>
             *     <publish node='princely_musings'>
             *       <item id='bnd81g37d61f49fgn581'>
             *         <entry xmlns='http://www.w3.org/2005/Atom'>
             *           <title>Soliloquy</title>
             *           <summary>
             * To be, or not to be: that is the question:
             * Whether 'tis nobler in the mind to suffer
             * The slings and arrows of outrageous fortune,
             * Or to take arms against a sea of troubles,
             * And by opposing end them?
             *           </summary>
             *           <link rel='alternate' type='text/html'
             *                 href='http://denmark.lit/2003/12/13/atom03'/>
             *           <id>tag:denmark.lit,2003:entry-32397</id>
             *           <published>2003-12-13T18:30:02Z</published>
             *           <updated>2003-12-13T18:30:02Z</updated>
             *         </entry>
             *       </item>
             *     </publish>
             *   </pubsub>
             * </iq>
             *
             * response
             * <iq type='result'
             *     from='pubsub.shakespeare.lit'
             *     to='hamlet@denmark.lit/blogbot'
             *     id='publish1'>
             *   <pubsub xmlns='http://jabber.org/protocol/pubsub'>
             *     <publish node='princely_musings'>
             *       <item id='ae890ac52d0df67ed7cfdf51b644e901'/>
             *     </publish>
             *   </pubsub>
             * </iq>
             */

            it('7.1 Publish an Item to a Node', function(done) {

                var jid = romeoCl.jid;

                var publish = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: jid,
                    type: 'set'
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('publish', {
                    'node': node
                }).c('item', {
                    id: 'item_01'
                }).t('abc').c('test').up().up().c('item');

                sendMessage(romeoCl, publish, function(err, stanza) {
                    console.log(stanza.toString());
                    should.not.exist(err);
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'result');

                        var pubsub = stanza.getChild('pubsub', 'http://jabber.org/protocol/pubsub');
                        pubsub.should.not.be.empty;
                        var publish = pubsub.getChild('publish');
                        publish.should.not.be.empty;

                        var item = publish.getChild('item');
                        item.should.not.be.empty;

                        assert.equal(item.attrs.id, 'item_01');

                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });
            });

            it('7.1 Publish an Item to a Node and item ID is generated by server', function(done) {

                var jid = romeoCl.jid;

                var publish = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: jid,
                    type: 'set'
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('publish', {
                    'node': node
                }).c('item', {})

                sendMessage(romeoCl, publish, function(err, stanza) {
                    console.log(stanza.toString());
                    should.not.exist(err);
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'result');

                        var pubsub = stanza.getChild('pubsub', 'http://jabber.org/protocol/pubsub');
                        pubsub.should.not.be.empty;
                        var publish = pubsub.getChild('publish');
                        publish.should.not.be.empty;

                        var item = publish.getChild('item');
                        item.should.not.be.empty;

                        should.exist(item.attrs.id);

                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });
            });


            it('7.1 Publish an Item to a Node with multiple items', function(done) {

                var jid = romeoCl.jod;

                var publish = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: jid,
                    type: 'set'
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('publish', {
                    'node': node
                }).c('item', {
                    id: 'item_01'
                }).t('abc').c('test').up().up().c('item', {
                    id: 'item_02'
                });

                sendMessage(romeoCl, publish, function(err, stanza) {
                    console.log(stanza.toString());
                    should.not.exist(err);
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'result');

                        var pubsub = stanza.getChild('pubsub', 'http://jabber.org/protocol/pubsub');
                        pubsub.should.not.be.empty;
                        var publish = pubsub.getChild('publish');
                        publish

                        var items = publish.getChildren('item');
                        items.should.not.be.empty;
                        assert.equal(items.length, 2);
                        assert.equal(items[0].attrs.id, 'item_01');
                        assert.equal(items[1].attrs.id, 'item_02');

                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });

            });



            /*
             * response (from server to subscriber)
             * <message from='pubsub.shakespeare.lit' to='francisco@denmark.lit' id='foo'>
             *   <event xmlns='http://jabber.org/protocol/pubsub#event'>
             *     <items node='princely_musings'>
             *       <item id='ae890ac52d0df67ed7cfdf51b644e901'>
             *         <entry xmlns='http://www.w3.org/2005/Atom'>
             *           <title>Soliloquy</title>
             *           <summary>
             * To be, or not to be: that is the question:
             * Whether 'tis nobler in the mind to suffer
             * The slings and arrows of outrageous fortune,
             * Or to take arms against a sea of troubles,
             * And by opposing end them?
             *           </summary>
             *           <link rel='alternate' type='text/html'
             *                 href='http://denmark.lit/2003/12/13/atom03'/>
             *           <id>tag:denmark.lit,2003:entry-32397</id>
             *           <published>2003-12-13T18:30:02Z</published>
             *           <updated>2003-12-13T18:30:02Z</updated>
             *         </entry>
             *       </item>
             *     </items>
             *   </event>
             * </message>
             */
            it('7.1.2.1 Notification With Payload', function(done) {

                /*
                
                before each
                0. create client => store instance in cljulia and clromeo
                1. create node => send with clromeo
                2. subscribe romeo => send with clromeo
                3. subscribe julia => send with cljulia

                test
                4. publish (romeo does not recieve notification, julia does receive notification)
                
                after each
                5. delete node => send with clromeo
                6. disconnect clients => close connections and set cljulia and clromeo = null
                */

                done();
            });

            /*
             * <message from='pubsub.shakespeare.lit' to='francisco@denmark.lit' id='foo'>
             *   <event xmlns='http://jabber.org/protocol/pubsub#event'>
             *     <items node='princely_musings'>
             *       <item id='ae890ac52d0df67ed7cfdf51b644e901'/>
             *     </items>
             *   </event>
             * </message>
             */
            it('7.1.2.2 Notification Without Payload', function(done) {
                done();
            });

            /*
             * <message from='pubsub.shakespeare.lit' to='francisco@denmark.lit' id='foo'>
             *   <event xmlns='http://jabber.org/protocol/pubsub#event'>
             *     <items node='princely_musings'>
             *       <item id='ae890ac52d0df67ed7cfdf51b644e901'
             *             publisher='hamlet@denmark.lit'>
             *         [ ... ENTRY ... ]
             *       </item>
             *     </items>
             *   </event>
             * </message>
             */
            it('7.1.2.3 Item Publisher', function(done) {
                done();
            });

            /*
             * <message from='pubsub.shakespeare.lit' to='francisco@denmark.lit' id='foo'>
             *   <event xmlns='http://jabber.org/protocol/pubsub#event'>
             *     <items node='princely_musings'>
             *       <item id='ae890ac52d0df67ed7cfdf51b644e901'/>
             *     </items>
             *   </event>
             *   <headers xmlns='http://jabber.org/protocol/shim'>
             *     <header name='SubID'>123-abc</header>
             *     <header name='SubID'>004-yyy</header>
             *   </headers>
             * </message>
             */
            it('7.1.2.4 Inclusion of Subscription ID', function(done) {
                done();
            });

            /*
             * <iq type='error'
             *     from='pubsub.shakespeare.lit'
             *     id='publish1'>
             *   <error type='auth'>
             *     <forbidden xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
             *   </error>
             * </iq>
             */
            it('7.1.3.1 Insufficient Privileges', function(done) {
                done();
            });

            /*
             * <iq type='error'
             *     from='pubsub.shakespeare.lit'
             *     to='hamlet@denmark.lit/elsinore'
             *     id='publish1'>
             *   <error type='cancel'>
             *     <feature-not-implemented xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
             *     <unsupported xmlns='http://jabber.org/protocol/pubsub#errors'
             *                  feature='publish'/>
             *   </error>
             * </iq>
             */
            it('7.1.3.2 Item Publication Not Supported', function(done) {
                done();
            });

            /*
             * <iq type='error'
             *     from='pubsub.shakespeare.lit'
             *     to='hamlet@denmark.lit/elsinore'
             *     id='publish1'>
             *   <error type='cancel'>
             *     <item-not-found xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
             *   </error>
             * </iq>
             */
            it('7.1.3.3 Node Does Not Exist', function(done) {
                var jid = romeoCl.jod;

                var itemId = uuid.v4();

                var publish = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: jid,
                    type: 'set'
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('publish', {
                    'node': "artifical_node"
                }).c('item', {
                    id: itemId
                }).t('abc');


                sendMessage(romeoCl, publish, function(err, stanza) {
                    should.not.exist(err);

                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'error');

                        var error = stanza.getChild('error');
                        assert.equal(error.attrs.type, 'cancel');

                        var itemnotfound = error.getChild('item-not-found', 'urn:ietf:params:xml:ns:xmpp-stanzas');
                        assert.equal(itemnotfound.toString(), "<item-not-found xmlns=\"urn:ietf:params:xml:ns:xmpp-stanzas\"/>");

                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });
            });

            /*
             * <iq type='error'
             *     from='pubsub.shakespeare.lit'
             *     to='hamlet@denmark.lit/elsinore'
             *     id='publish1'>
             *   <error type='modify'>
             *     <not-acceptable xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
             *     <payload-too-big xmlns='http://jabber.org/protocol/pubsub#errors'/>
             *   </error>
             * </iq>
             */
            it('7.1.3.4 Payload Too Big', function(done) {
                done();
            });

            /*
             * <iq type='error'
             *     from='pubsub.shakespeare.lit'
             *     to='hamlet@denmark.lit/elsinore'
             *     id='publish1'>
             *   <error type='modify'>
             *     <bad-request xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
             *     <invalid-payload xmlns='http://jabber.org/protocol/pubsub#errors'/>
             *   </error>
             * </iq>
             */
            it('7.1.3.5 Bad Payload', function(done) {
                done();
            });

            it('7.1.3.6 Request Does Not Match Configuration', function(done) {
                done();
            });

            it('7.1.4 Automatic Node Creation', function(done) {
                done();
            });

            it('7.1.5 Publishing Options', function(done) {
                done();
            });

            /*
             * request
             * <iq type='set'
             *     from='hamlet@denmark.lit/elsinore'
             *     to='pubsub.shakespeare.lit'
             *     id='retract1'>
             *   <pubsub xmlns='http://jabber.org/protocol/pubsub'>
             *     <retract node='princely_musings'>
             *       <item id='ae890ac52d0df67ed7cfdf51b644e901'/>
             *     </retract>
             *   </pubsub>
             * </iq>
             *
             * respone
             * <iq type='result'
             *     from='pubsub.shakespeare.lit'
             *     to='hamlet@denmark.lit/elsinore'
             *     id='retract1'/>
             */
            it('7.2 Delete an Item from a Node', function(done) {
                done();
            });

            /*
             * <message from='pubsub.shakespeare.lit' to='francisco@denmark.lit' id='foo'>
             *   <event xmlns='http://jabber.org/protocol/pubsub#event'>
             *     <items node='princely_musings'>
             *       <retract id='ae890ac52d0df67ed7cfdf51b644e901'/>
             *     </items>
             *   </event>
             * </message>
             *
             * <message from='pubsub.shakespeare.lit' to='bernardo@denmark.lit' id='bar'>
             *   <event xmlns='http://jabber.org/protocol/pubsub#event'>
             *     <items node='princely_musings'>
             *       <retract id='ae890ac52d0df67ed7cfdf51b644e901'/>
             *     </items>
             *   </event>
             * </message>
             */
            it('7.2.2.1 Delete And Notify', function(done) {
                done();
            });

            /*
             * <message from='pubsub.shakespeare.lit' to='bernardo@denmark.lit' id='bar'>
             *   <event xmlns='http://jabber.org/protocol/pubsub#event'>
             *     <items node='princely_musings'>
             *       <retract id='ae890ac52d0df67ed7cfdf51b644e901'/>
             *     </items>
             *   </event>
             *   <headers xmlns='http://jabber.org/protocol/shim'>
             *     <header name='SubID'>123-abc</header>
             *     <header name='SubID'>004-yyy</header>
             *   </headers>
             * </message>
             */
            it('7.2.2.2 Inclusion of Subscription ID', function(done) {
                done();
            });

            /*
             * <iq type='error'
             *     from='pubsub.shakespeare.lit'
             *     to='hamlet@denmark.lit/elsinore'
             *     id='retract1'>
             *   <error type='auth'>
             *     <forbidden xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
             *   </error>
             * </iq>
             */
            it('7.2.3.1 Insufficient Privileges', function(done) {
                done();
            });


            /*
             * <iq type='error'
             *     from='pubsub.shakespeare.lit'
             *     to='hamlet@denmark.lit/elsinore'
             *     id='retract1'>
             *   <error type='cancel'>
             *     <item-not-found xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
             *   </error>
             * </iq>
             */
            it('7.2.3.2 Node Does Not Exist', function(done) {
                done();
            });

            /*
             * <iq type='error'
             *     from='pubsub.shakespeare.lit'
             *     to='hamlet@denmark.lit/elsinore'
             *     id='retract1'>
             *   <error type='modify'>
             *     <bad-request xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
             *     <nodeid-required xmlns='http://jabber.org/protocol/pubsub#errors'/>
             *   </error>
             * </iq>
             */
            it('7.2.3.3 NodeID Required', function(done) {
                done();
            });

            /*
             * <iq type='error'
             *     from='pubsub.shakespeare.lit'
             *     to='hamlet@denmark.lit/elsinore'
             *     id='retract1'>
             *   <error type='modify'>
             *     <bad-request xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
             *     <item-required xmlns='http://jabber.org/protocol/pubsub#errors'/>
             *   </error>
             * </iq>
             */
            it('7.2.3.4 Item or ItemID Required', function(done) {
                done();
            });

            /*
             * <iq type='error'
             *     from='pubsub.shakespeare.lit'
             *     to='hamlet@denmark.lit/elsinore'
             *     id='retract1'>
             *   <error type='cancel'>
             *     <feature-not-implemented xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
             *     <unsupported xmlns='http://jabber.org/protocol/pubsub#errors'
             *                  feature='persistent-items'/>
             *   </error>
             * </iq>
             */
            it('7.2.3.5 Persistent Items Not Supported', function(done) {
                done();
            });

            it('Postcondition: delete node', function(done) {
                var deleteiq = deleteNode(romeoCl.jid, node);
                sendMessage(romeoCl, deleteiq, function(err, stanza) {
                    done(err);
                });
            });
        });
    });
});
