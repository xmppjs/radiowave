'use strict';

// assertion
var assert = require('assert'),
    should = require('should');

// logging
var LogConfig = require('../../config/LogConfig');
LogConfig.configure('silly');

// xmpp client
var ltx = require('ltx'),
    Client = require('node-xmpp-client'),
    Message = require('node-xmpp-core').Stanza.Message;

// x rocket server
var xRocket = require('../../xrocket'),
    C2SServer = xRocket.Net.C2SServer;

// Xep Components
var Xep0060 = require('../../xep/Xep0060-pubsub');

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
        var cr = new xRocket.Router.ComponentRouter({
            domain: 'example.net'
        });
        var lr = new xRocket.Router.LogRouter();
        // chain XRocket to ComponentRouter
        xR.chain(lr).chain(cr);

        // register pubsub component
        var PGConn = require('../../storage/postgre/PGConn');
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

    describe('8. Owner Use Cases', function () {

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


            var generatednodename = '';

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
                        generatednodename = nodename;

                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });
            });

            it('Postcondition: delete test node princely_musings_config', function (done) {
                var deleteIQ = deleteNode(userRomeo.jid, generatednodename);

                sendMessageWithRomeo(deleteIQ, function (err, stanza) {
                    should.not.exist(err);
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'result');
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
             *     id='create1'>
             *   <pubsub xmlns='http://jabber.org/protocol/pubsub'>
             *     <create node='princely_musings'/>
             *     <configure>
             *       <x xmlns='jabber:x:data' type='submit'>
             *         <field var='FORM_TYPE' type='hidden'>
             *           <value>http://jabber.org/protocol/pubsub#node_config</value>
             *         </field>
             *         <field var='pubsub#title'><value>Princely Musings (Atom)</value></field>
             *         <field var='pubsub#deliver_notifications'><value>1</value></field>
             *         <field var='pubsub#deliver_payloads'><value>1</value></field>
             *         <field var='pubsub#persist_items'><value>1</value></field>
             *         <field var='pubsub#max_items'><value>10</value></field>
             *         <field var='pubsub#item_expire'><value>604800</value></field>
             *         <field var='pubsub#access_model'><value>open</value></field>
             *         <field var='pubsub#publish_model'><value>publishers</value></field>
             *         <field var='pubsub#purge_offline'><value>0</value></field>
             *         <field var='pubsub#send_last_published_item'><value>never</value></field>
             *         <field var='pubsub#presence_based_delivery'><value>false</value></field>
             *         <field var='pubsub#notification_type'><value>headline</value></field>
             *         <field var='pubsub#notify_config'><value>0</value></field>
             *         <field var='pubsub#notify_delete'><value>0</value></field>
             *         <field var='pubsub#notify_retract'><value>0</value></field>
             *         <field var='pubsub#notify_sub'><value>0</value></field>
             *         <field var='pubsub#max_payload_size'><value>1028</value></field>
             *         <field var='pubsub#type'><value>http://www.w3.org/2005/Atom</value></field>
             *         <field var='pubsub#body_xslt'>
             *           <value>http://jabxslt.jabberstudio.org/atom_body.xslt</value>
             *         </field>
             *       </x>
             *     </configure>
             *   </pubsub>
             * </iq>
             *
             * response
             * <iq type='result'
             *     from='pubsub.shakespeare.lit'
             *     to='hamlet@denmark.lit/elsinore'
             *     id='create1'/>
             */
            it('8.1.3 Create and Configure a Node', function (done) {
                var id = 'newnode-r2d2';
                var config = ltx.parse("<x xmlns='jabber:x:data' type='submit'><field var='pubsub#deliver_payloads'><value>1</value></field></x>");

                var create = new ltx.Element('iq', {
                    to: 'pubsub.example.net',
                    from: userRomeo.jid,
                    type: 'set',
                    id: id
                }).c('pubsub', {
                    'xmlns': 'http://jabber.org/protocol/pubsub'
                }).c('create', {
                    'node': 'princely_musings_config'
                }).up().c('configure').cnode(config);


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

            it('Postcondition: delete test node princely_musings_config', function (done) {
                var deleteIQ = deleteNode(userRomeo.jid, 'princely_musings_config')

                sendMessageWithRomeo(deleteIQ, function (err, stanza) {
                    should.not.exist(err);
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'result');
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