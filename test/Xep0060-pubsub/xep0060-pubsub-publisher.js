'use strict';

// assertion
var assert = require('assert'),
    should = require('should'),
    Promise = require('bluebird'),
    helper = require('../_helper/helper'),
    pub_helper = require('../_helper/pubsub');

// logging
helper.configureLoglevel('silly');

var ltx = require('ltx'),
    Xep0060 = require('../../xep/Xep0060-pubsub');

function configureXEP(server) {
    // register pubsub component
    server.cr.register(new Xep0060({
        subdomain: 'pubsub',
        domain: 'example.net',
        storage: server.storage
    }));
}

var uuid = require('node-uuid');

/**
 * @see http://xmpp.org/extensions/xep-0060.html
 */
describe('Xep-0060', function () {

    // notifcations
    /*
    var nodes = {};

    function resetSubscriptions() {
        nodes = {};
    }

    function subscribe(cl, nodename, success, done) {

        if (!nodes[nodename]) {
            nodes[nodename] = [];
        }

        var node = nodes[nodename];

        node.push({
            'jid': cl.jid.bare(),
            'callback': done
        });

        cl.on('stanza',
            function (stanza) {
                console.log("NOTIFICATION stanza " + cl.jid + " " + stanza.toString());

                if (stanza.attrs.type === 'result')  {

                    var pubsub = stanza.getChild('pubsub', 'http://jabber.org/protocol/pubsub');
                    if (pubsub) {
                        var subscribe = pubsub.getChild('subscription');
                        // console.log('RT: ' + subscribe.toString());
                        if (subscribe && (subscribe.attrs.subscription === 'subscribed') && (new JID(subscribe.attrs.jid).equals(cl.jid.bare()))) {
                            success();
                        }
                    }
                }

                // check if we got a pubsub notification and extract node
                var pevent = stanza.getChild('event', 'http://jabber.org/protocol/pubsub#event');

                // we got an event
                if (pevent) {
                    var items = pevent.getChild('items');
                    var node = items.attrs.node;

                    console.log("found node:" + node);

                    // call clients

                    var node = nodes[node];

                    if (node) {
                        console.log("call callbacks of each node")
                        for (var i = 0, l = node.length; i < l; i++) {
                            console.log('call callback' + node[i].jid + ' ' + stanza.attrs.to);

                            if (node[i].jid.equals(new JID(stanza.attrs.to))) {
                                console.log("match")
                                node[i].callback(stanza);
                            }
                        };
                    }
                }
            }
        );

        var stanza = subscribeNode(cl.jid, nodename, done);
        cl.send(stanza.root());
    }
    */

    // subscribe(romeoCl, 'test', function(message) {});

    var node = uuid.v4();

    var srv = null;

    before(function (done) {
        helper.startServer()
        // configure muc module
        .then(function (server) {
            srv = server;
            configureXEP(server);
            done();
        })
            .
        catch (function (err) {
            done(err);
        });
    });

    after(function (done) {
        srv.xR.shutdown();
        done();
    });


    describe('7. Publisher Use Cases', function () {

        describe('7.1 Publish an Item', function () {

            it('Precondition: Create a node', function (done) {

                var id = 'newnode-r2d2';
                var stanza = pub_helper.createNodeStanza(helper.userRomeo.jid, node, id );

                helper.sendMessageWithRomeo(stanza.root()).then(function(stanza){
                    try {
                        assert.equal(stanza.is('iq'),true, 'wrong stanza ' + stanza.root().toString());
                        assert.equal(stanza.attrs.type, 'result');
                        assert.equal(stanza.attrs.id, id);
                        done();
                    } catch(err) {
                        done(err);
                    }
                }).catch(function(err){
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

            it('7.1 Publish an Item to a Node', function (done) {


                var stanza = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: helper.userRomeo.jid,
                    type: 'set'
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('publish', {
                    'node': node
                }).c('item', {
                    id: 'item_01'
                }).t('abc').c('test').up().up().c('item');

                helper.sendMessageWithRomeo(stanza.root()).then(function(stanza){
                    try {
                        assert.equal(stanza.is('iq'),true, 'wrong stanza ' + stanza.root().toString());

                        assert.equal(stanza.attrs.type, 'result');

                        var pubsub = stanza.getChild('pubsub', 'http://jabber.org/protocol/pubsub');
                        pubsub.should.not.be.empty;
                        var publish = pubsub.getChild('publish');
                        publish.should.not.be.empty;

                        var item = publish.getChild('item');
                        item.should.not.be.empty;

                        assert.equal(item.attrs.id, 'item_01');

                        done();
                    } catch(err) {
                        done(err);
                    }
                }).catch(function(err){
                    done(err);
                });
            });

            it('7.1 Publish an Item to a Node and item ID is generated by server', function (done) {

                var stanza = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: helper.userRomeo.jid,
                    type: 'set'
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('publish', {
                    'node': node
                }).c('item', {});

                helper.sendMessageWithRomeo(stanza.root()).then(function(stanza){
                    try {
                        assert.equal(stanza.is('iq'),true, 'wrong stanza ' + stanza.root().toString());

                        assert.equal(stanza.attrs.type, 'result');

                        var pubsub = stanza.getChild('pubsub', 'http://jabber.org/protocol/pubsub');
                        pubsub.should.not.be.empty;
                        var publish = pubsub.getChild('publish');
                        publish.should.not.be.empty;

                        var item = publish.getChild('item');
                        item.should.not.be.empty;

                        should.exist(item.attrs.id);

                        done();
                    } catch(err) {
                        done(err);
                    }
                }).catch(function(err){
                    done(err);
                });

            });


            it('7.1 Publish an Item to a Node with multiple items', function (done) {

                var stanza = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: helper.userRomeo.jid,
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

                helper.sendMessageWithRomeo(stanza.root()).then(function(stanza){
                    try {
                        assert.equal(stanza.is('iq'),true, 'wrong stanza ' + stanza.root().toString());

                        assert.equal(stanza.attrs.type, 'result');

                        var pubsub = stanza.getChild('pubsub', 'http://jabber.org/protocol/pubsub');
                        pubsub.should.not.be.empty;
                        var publish = pubsub.getChild('publish');

                        var items = publish.getChildren('item');
                        items.should.not.be.empty;
                        assert.equal(items.length, 2);
                        assert.equal(items[0].attrs.id, 'item_01');
                        assert.equal(items[1].attrs.id, 'item_02');

                        done();
                    } catch(err) {
                        done(err);
                    }
                }).catch(function(err){
                    done(err);
                });
            });

            /*
             *  before each
             *  0. create client => store instance in cljulia and clromeo
             *  1. create node => send with clromeo
             *  2. subscribe romeo => send with clromeo
             *  3. subscribe julia => send with cljulia
             *
             *  test
             *  4. publish (romeo does not recieve notification, julia does receive notification)
             *
             *  after each
             *  5. delete node => send with clromeo
             *  6. disconnect clients => close connections and set cljulia and clromeo = null
             *
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
            it('7.1.2.1 Notification With Payload', function (done) {
                this.timeout(5000);

                var publish = new ltx.Element('iq', {
                        to: 'pubsub.example.net',
                        from: helper.userRomeo.jid,
                        type: 'set'
                    }).c('pubsub', {
                        'xmlns': 'http://jabber.org/protocol/pubsub'
                    }).c('publish', {
                        'node': node
                    }).c('item', {
                        id: 'item_01'
                    }).t('abc');

                var julia, romeo = null;

                // start clients
                Promise.all([helper.startJulia(), helper.startRomeo()]).then(function (results) {
                    julia = results[0];
                    romeo = results[1];
                })
                .then(function () {
                    // julia subscribes room
                    var stanza = pub_helper.subscribeNodeStanza(helper.userJulia.jid, node);
                    return helper.sendMessageWithJulia(stanza.root());
                })
                .then(function () {
                    // send publish message
                    console.log('romeo publish: '+ publish.root().toString());
                    romeo.send(publish);
                })
                .then(function (){
                    console.log('WAIT');
                    return new Promise(function (resolve) {
                        julia.once('stanza', function(stanza){
                            resolve(stanza);
                        });
                    });
                })
                .then(function(message){
                    try {
                        console.log("julia got: " + message.toString());
                         // verify stanza
                        var pubsubevent = message.getChild('event', 'http://jabber.org/protocol/pubsub#event');
                        pubsubevent.should.not.be.empty;

                        var itemselement = pubsubevent.getChild('items');
                        itemselement.should.not.be.empty;

                        var items = itemselement.getChildren('item');
                        items.should.not.be.empty;
                        assert.equal(items.length, 1);
                        assert.equal(items[0].attrs.id, 'item_01');

                        assert.equal(items[0].text(), 'abc');

                        done();
                    } catch(err) {
                        done(err);
                    }
                }).catch(function(err){
                    done(err);
                });
            });

            it('Precondition: Create a node', function (done) {

                var id = 'newnode-r2d2';
                var config = ltx.parse("<x xmlns='jabber:x:data' type='submit'><field var='pubsub#deliver_payloads'><value>0</value></field></x>");

                var stanza = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: helper.userRomeo.jid,
                    type: 'set',
                    id: id
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('create', {
                    'node': 'config_node'
                }).up().c('configure').cnode(config);

                helper.sendMessageWithRomeo(stanza.root()).then(function(stanza){
                    try {
                        assert.equal(stanza.is('iq'),true, 'wrong stanza ' + stanza.root().toString());
                        assert.equal(stanza.attrs.type, 'result');
                        assert.equal(stanza.attrs.id, id);
                        done();
                    } catch(err) {
                        done(err);
                    }
                }).catch(function(err){
                    done(err);
                });
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
            it('7.1.2.2 Notification Without Payload', function (done) {
                console.log('7.1.2.2 Notification Without Payload');
                this.timeout(5000);

                var configNode = 'config_node';

                // publish message
                var publish = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from:  helper.userRomeo.jid,
                    type: 'set'
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('publish', {
                    'node': configNode
                }).c('item', {
                    id: 'item_01'
                }).t('abc');

                var julia, romeo = null;

                // start clients
                Promise.all([helper.startJulia(), helper.startRomeo()]).then(function (results) {
                    julia = results[0];
                    romeo = results[1];
                })
                .then(function () {
                    // julia subscribes room
                    var stanza = pub_helper.subscribeNodeStanza(helper.userJulia.jid, configNode);
                    return helper.sendMessageWithJulia(stanza.root());
                })
                .then(function () {
                    // send message
                    romeo.send(publish);
                })
                .then(function (){
                    return new Promise(function (resolve) {
                        julia.once('stanza', function(stanza){
                            resolve(stanza);
                        });
                    });
                })
                .then(function(message){
                    try {
                        console.log("julia got: " + message.toString());
                        // verify stanza
                        var pubsubevent = message.getChild('event', 'http://jabber.org/protocol/pubsub#event');
                        pubsubevent.should.not.be.empty;

                        var itemselement = pubsubevent.getChild('items');
                        itemselement.should.not.be.empty;

                        var items = itemselement.getChildren('item');
                        items.should.not.be.empty;
                        assert.equal(items.length, 1);
                        assert.equal(items[0].attrs.id, 'item_01');

                        assert.equal(items[0].text(), '');

                        done();
                    } catch(err) {
                        done(err);
                    }
                }).catch(function(err){
                    done(err);
                });

            });

            it('Postcondition: delete node', function (done) {

                var id = 'delete_node_id';
                var stanza = pub_helper.deleteNodeStanza(helper.userRomeo.jid, 'config_node', id );

                helper.sendMessageWithRomeo(stanza.root()).then(function(stanza){
                    try {
                        assert.equal(stanza.is('iq'),true, 'wrong stanza ' + stanza.root().toString());
                        assert.equal(stanza.attrs.type, 'result');
                        assert.equal(stanza.attrs.id, id);
                        done();
                    } catch(err) {
                        done(err);
                    }
                }).catch(function(err){
                    done(err);
                });
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
            it('7.1.2.3 Item Publisher', function (done) {
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
            it('7.1.2.4 Inclusion of Subscription ID', function (done) {
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
            it('7.1.3.1 Insufficient Privileges', function (done) {
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
            it('7.1.3.2 Item Publication Not Supported', function (done) {
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
            it('7.1.3.3 Node Does Not Exist', function (done) {
                console.log('7.1.3.3 Node Does Not Exist');

                // dependent on pubsub service configuration
                var autocreate = false;

                var itemId = uuid.v4();

                var stanza = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: helper.userRomeo.jid,
                    type: 'set'
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('publish', {
                    'node': "artifical_node"
                }).c('item', {
                    id: itemId
                }).t('abc');

                helper.sendMessageWithRomeo(stanza.root()).then(function(stanza){
                    try {
                        assert.equal(stanza.is('iq'),true, 'wrong stanza ' + stanza.root().toString());

                        if (!autocreate) {
                            assert.equal(stanza.attrs.type, 'error');

                            var error = stanza.getChild('error');
                            assert.equal(error.attrs.type, 'cancel');

                            var itemnotfound = error.getChild('item-not-found', 'urn:ietf:params:xml:ns:xmpp-stanzas');
                            assert.equal(itemnotfound.toString(), "<item-not-found xmlns=\"urn:ietf:params:xml:ns:xmpp-stanzas\"/>");
                        } else {
                            console.log('expect item');
                            var pubsub = stanza.getChild('pubsub', 'http://jabber.org/protocol/pubsub');
                            pubsub.should.not.be.empty;

                            var publish = pubsub.getChild('publish');
                            publish.should.not.be.empty;

                            var item = publish.getChild('item');
                            item.should.not.be.empty;
                        }
                        
                        done();
                    } catch(err) {
                        done(err);
                    }
                }).catch(function(err){
                    done(err);
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
            it('7.1.3.4 Payload Too Big', function (done) {
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
            it('7.1.3.5 Bad Payload', function (done) {
                done();
            });

            it('7.1.3.6 Request Does Not Match Configuration', function (done) {
                done();
            });

            it('7.1.4 Automatic Node Creation', function (done) {
                done();
            });

            it('7.1.5 Publishing Options', function (done) {
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
            it('7.2 Delete an Item from a Node', function (done) {
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
            it('7.2.2.1 Delete And Notify', function (done) {
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
            it('7.2.2.2 Inclusion of Subscription ID', function (done) {
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
            it('7.2.3.1 Insufficient Privileges', function (done) {
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
            it('7.2.3.2 Node Does Not Exist', function (done) {
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
            it('7.2.3.3 NodeID Required', function (done) {
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
            it('7.2.3.4 Item or ItemID Required', function (done) {
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
            it('7.2.3.5 Persistent Items Not Supported', function (done) {
                done();
            });

            it('Postcondition: delete node', function (done) {

                var stanza = pub_helper.deleteNodeStanza(helper.userRomeo.jid, node);

                helper.sendMessageWithRomeo(stanza.root()).then(function(stanza){
                    try {

                        assert.equal(stanza.is('iq'),true, 'wrong stanza ' + stanza.root().toString());
                        
                        assert.equal(stanza.attrs.type, 'result');
                        done();
                        
                    } catch(err) {
                        done(err);
                    }
                }).catch(function(err){
                    done(err);
                });
            });

        });
    });
});