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
var XRocket = require('../core/XRocket'),
    Simple = require('../auth/Simple'),
    C2SServer = require('../net/C2SServer');

// SASL Methods
var Plain = require('node-xmpp-server/lib/authentication/plain');

// Xep Components
var ComponentRouter = require('../router/ComponentRouter'),
    Rfc3921Roaster = require('../xep/Rfc3921-roaster');

// Storage
var UsrModule = require('../storage/in-memory/Users');
var Users = new UsrModule();

// user
var user = {
    jid: 'romeo@example.net',
    password: 'romeo',
    host: 'localhost'
};

function getClient() {
    var cl = new Client({
        jid: user.jid,
        password: user.password,
        preferred: 'PLAIN',
        host: user.host
    });
    return cl;
}

function sendRoasterItem(el, result, done) {
    var cl = getClient();

    var id = 'roaster_add';

    cl.on('stanza',
        function (stanza) {
            if (stanza.is('iq')) {
                assert.equal(stanza.attrs.type, result);
                assert.equal(stanza.attrs.id, id);
                done();
            } else {
                done('wrong stanza ' + stanza.root().toString());
            }
        });

    cl.on('online', function () {

        // generate 
        var roaster = new ltx.Element('iq', {
            to: 'example.net',
            from: cl.jid,
            type: 'set',
            id: id
        }).c('query', {
            'xmlns': 'jabber:iq:roster'
        }).cnode(el);

        cl.send(roaster);
    });

    cl.on('error', function (e) {
        console.error(e);
        done(e);
    });
}


describe('Rfc3921', function () {
    describe('Roaster', function () {
        var xR = null;

        before(function (done) {
            // C2S Server 
            var cs2 = new C2SServer({});
            cs2.registerSaslMechanism(Plain);

            // attach connection manager to xrocket
            xR = new XRocket();
            xR.addConnectionManager(cs2);

            // register users
            var simpleAuth = new Simple();
            simpleAuth.addUser('romeo', 'romeo');
            xR.connectionRouter.authMethods.push(simpleAuth);

            // register xep component
            var cr = new ComponentRouter({
                domain: 'example.net'
            });

            // chain XRocket to ComponentRouter
            xR.chain(cr);

            // start roaster
            cr.register(new Rfc3921Roaster({
                Users: Users
            }));

            done();
        });

        after(function (done) {
            xR.shutdown();
            done();
        });

        /**
         * A sample request and response
         *
         * Sample request
         * <iq from='juliet@example.com/balcony' type='get' id='roster_1'>
         *   <query xmlns='jabber:iq:roster'/>
         * </iq>
         *
         * Sample response
         * <iq to='juliet@example.com/balcony' type='result' id='roster_1'>
         *   <query xmlns='jabber:iq:roster'>
         *     <item jid='romeo@example.net'
         *           name='Romeo'
         *           subscription='both'>
         *       <group>Friends</group>
         *     </item>
         *   </query>
         * </iq>
         *
         */
        it('7.3. Retrieving One\'s Roster on Login', function (done) {
            var cl = getClient();

            var id = 'roaster_1';

            cl.on('stanza',
                function (stanza) {
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'result');
                        assert.equal(stanza.attrs.id, id);
                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });

            cl.on('online', function () {
                // generate 
                var roaster = new ltx.Element('iq', {
                    to: 'example.net',
                    from: cl.jid,
                    type: 'get',
                    id: id
                }).c('query', {
                    'xmlns': 'jabber:iq:roster'
                });
                cl.send(roaster);
            });

            cl.on('error', function (e) {
                console.error(e);
                done(e);
            });
        });

        /**
         * A sample request response
         *
         * Sample client request:
         * <iq from='juliet@example.com/balcony' type='set' id='roster_2'>
         *   <query xmlns='jabber:iq:roster'>
         *     <item jid='nurse@example.com'
         *           name='Nurse'>
         *       <group>Servants</group>
         *     </item>
         *   </query>
         * </iq>
         *
         * Sample server response:
         * <iq to='juliet@example.com/balcony' type='result' id='roster_2'/>
         *
         */

        it('7.4. Adding a Roster Item with empty item', function (done) {
            var el = ltx.parse("<item></item>");
            sendRoasterItem(el, 'error', done);
        });

        it('7.4. Adding a Roster Item', function (done) {
            var el = ltx.parse("<item jid='julia@example.net'></item>");
            sendRoasterItem(el, 'result', done);
        });

        it('7.5. Updating a Roster Item with name', function (done) {
            var el = ltx.parse("<item jid='julia@example.net' name='Julia'></item>");
            sendRoasterItem(el, 'result', done);
        });

        it('7.5. Updating a Roster Item with one group', function (done) {
            var el = ltx.parse("<item jid='julia@example.net' name='Julia'><group>Lovers</group></item>");
            sendRoasterItem(el, 'result', done);
        });

        it('7.5. Updating a Roster Item with two groups', function (done) {
            var el = ltx.parse("<item jid='julia@example.net' name='Julia'><group>Lovers</group><group>Friends</group></item>");
            sendRoasterItem(el, 'result', done);
        });

        // list roaster items
        it('Retrieving  Roster', function (done) {
            var cl = getClient();

            var id = 'roaster_2';

            cl.on('stanza',
                function (stanza) {
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'result');
                        assert.equal(stanza.attrs.id, id);

                        // <iq from="example.net" to="romeo@example.net/4661483000366298" id="roaster_2" type="result"><query xmlns="jabber:iq:roster">
                        // <item jid="julia@example.net" name="Julia" subscription="none"><group>Lovers</group><group>Friends</group></item></query></iq>
                        var query = stanza.root().getChild('query', 'jabber:iq:roster');
                        query.should.not.be.empty;

                        var item = query.getChild('item');
                        item.should.not.be.empty;

                        assert.equal(item.attrs.jid, 'julia@example.net');
                        assert.equal(item.attrs.name, 'Julia');

                        var groups = item.getChildren('group');
                        assert.equal(groups.length, 2);

                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });

            cl.on('online', function () {
                // generate 
                var roaster = new ltx.Element('iq', {
                    to: 'example.net',
                    from: cl.jid,
                    type: 'get',
                    id: id
                }).c('query', {
                    'xmlns': 'jabber:iq:roster'
                });
                cl.send(roaster);
            });

            cl.on('error', function (e) {
                console.error(e);
                done(e);
            });
        });

        /*
         * <iq from='juliet@example.com/balcony' type='set' id='roster_4'>
         *   <query xmlns='jabber:iq:roster'>
         *     <item jid='nurse@example.com' subscription='remove'/>
         *   </query>
         * </iq>
         */
        it('7.6. Deleting a Roster Item', function (done) {
            var el = ltx.parse("<item jid='julia@example.net' subscription='remove'></item>");
            sendRoasterItem(el, 'result', done);
        });

    });
});