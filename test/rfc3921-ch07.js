'use strict';

// assertion
var assert = require('assert'),
    should = require('should'),
    Promise = require('bluebird'),
    ltx = require('ltx'),
    helper = require('./_helper/helper');

// logging
helper.configureLoglevel('silly');

// Xep Components
var Rfc3921Roaster = require('../xep/Rfc3921-roaster');

function configureXEP(server) {
    // register messaging component
    server.cr.register(new Rfc3921Roaster({
        storage: server.storage
    }));
}

function generateRoasterStanza (jid, el, id) {
    id = id || 'roaster_add';
    // generate 
    var roaster = new ltx.Element('iq', {
        to: 'example.net',
        from: jid,
        type: 'set',
        id: id
    }).c('query', {
        'xmlns': 'jabber:iq:roster'
    }).cnode(el);

    return roaster.root();
}

describe('Rfc3921', function () {
    describe('Roaster', function () {

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


        it('Precondition: login julia for one time', function (done) {
            helper.startJulia().then(function(){
                done()
            }).catch(function(err) {done(err);  });
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

            var id = 'roaster_1';
            // generate 
            var stanza = new ltx.Element('iq', {
                to: 'example.net',
                from: helper.userRomeo.jid,
                type: 'get',
                id: id
            }).c('query', {
                'xmlns': 'jabber:iq:roster'
            });

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

        it('7.4. Adding a Roaster Item with empty item', function (done) {
            var id = 'add-roaster-empty';
            var el = ltx.parse("<item></item>");
            var returnType = 'error';

            var stanza = generateRoasterStanza(helper.userJulia.jid, el, id);

            helper.sendMessageWithRomeo(stanza.root()).then(function(stanza){
                try {
                    assert.equal(stanza.is('iq'),true, 'wrong stanza ' + stanza.root().toString());
                    assert.equal(stanza.attrs.type, returnType);
                    assert.equal(stanza.attrs.id, id);
                    done();
                } catch(err) {
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });
        });

        it('7.4. Adding a Roster Item', function (done) {
            var id = 'add-roaster-item';
            var el = ltx.parse("<item jid='julia@example.net'></item>");
            var returnType = 'result';

            var stanza = generateRoasterStanza(helper.userJulia.jid, el, id);

            helper.sendMessageWithRomeo(stanza.root()).then(function(stanza){
                try {
                    assert.equal(stanza.is('iq'),true, 'wrong stanza ' + stanza.root().toString());
                    assert.equal(stanza.attrs.type, returnType);
                    assert.equal(stanza.attrs.id, id);
                    done();
                } catch(err) {
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });
        });

        it('7.5. Updating a Roster Item with name', function (done) {
            var id = 'update-roaster-item';
            var el = ltx.parse("<item jid='julia@example.net' name='Julia'></item>");
            var returnType = 'result';

            var stanza = generateRoasterStanza(helper.userJulia.jid, el, id);

            helper.sendMessageWithRomeo(stanza.root()).then(function(stanza){
                try {
                    assert.equal(stanza.is('iq'),true, 'wrong stanza ' + stanza.root().toString());
                    assert.equal(stanza.attrs.type, returnType);
                    assert.equal(stanza.attrs.id, id);
                    done();
                } catch(err) {
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });
        });

        it('7.5. Updating a Roster Item with one group', function (done) {
            var id = 'update-roaster-group';
            var el = ltx.parse("<item jid='julia@example.net' name='Julia'><group>Lovers</group></item>");
            var returnType = 'result';

            var stanza = generateRoasterStanza(helper.userJulia.jid, el, id);

            helper.sendMessageWithRomeo(stanza.root()).then(function(stanza){
                try {
                    assert.equal(stanza.is('iq'),true, 'wrong stanza ' + stanza.root().toString());
                    assert.equal(stanza.attrs.type, returnType);
                    assert.equal(stanza.attrs.id, id);
                    done();
                } catch(err) {
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });
        });

        it('7.5. Updating a Roster Item with two groups', function (done) {
            var id = 'update-roaster-groups';
            var el = ltx.parse("<item jid='julia@example.net' name='Julia'><group>Lovers</group><group>Friends</group></item>");
            var returnType = 'result';

            var stanza = generateRoasterStanza(helper.userJulia.jid, el, id);

            helper.sendMessageWithRomeo(stanza.root()).then(function(stanza){
                try {
                    assert.equal(stanza.is('iq'),true, 'wrong stanza ' + stanza.root().toString());
                    assert.equal(stanza.attrs.type, returnType);
                    assert.equal(stanza.attrs.id, id);
                    done();
                } catch(err) {
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });
        });

        // list roaster items
        it('Retrieving  Roster', function (done) {
            var id = 'list-roaster-groups';
            // generate 
            var stanza = new ltx.Element('iq', {
                to: 'example.net',
                from: helper.userRomeo.jid,
                type: 'get',
                id: id
            }).c('query', {
                'xmlns': 'jabber:iq:roster'
            });

            helper.sendMessageWithRomeo(stanza.root()).then(function(stanza){
                try {
                    assert.equal(stanza.is('iq'),true, 'wrong stanza ' + stanza.root().toString());

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
                } catch(err) {
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });
        });

        /*
         * <iq from='juliet@example.com/balcony' type='set' id='roster_4'>
         *   <query xmlns='jabber:iq:roster'>
         *     <item jid='nurse@example.com' subscription='remove'/>
         *   </query>
         * </iq>
         */
        /*it('7.6. Deleting a Roster Item', function (done) {
            var id = 'delete-roaster-item';
            var el = ltx.parse("<item jid='julia@example.net' subscription='remove'></item>");
            var returnType = 'result';

            var stanza = generateRoasterStanza(helper.userJulia.jid, el, id);

            helper.sendMessageWithRomeo(stanza.root()).then(function(stanza){
                try {
                    assert.equal(stanza.is('iq'),true, 'wrong stanza ' + stanza.root().toString());
                    assert.equal(stanza.attrs.type, returnType);
                    assert.equal(stanza.attrs.id, id);
                    done();
                } catch(err) {
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });
        });*/

    });
});