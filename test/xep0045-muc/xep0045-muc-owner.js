'use strict';

var Promise = require('bluebird'),
    ltx = require('ltx'),
    assert = require('assert'),
    should = require('should'),
    helper = require('../_helper/helper');

// logging
helper.configureLoglevel('silly');

var Xep0045 = require('../../xep/Xep0045-muc');

function configureXEP(server) {
    // register pubsub component
    server.cr.register(new Xep0045({
        subdomain: 'chat',
        domain: 'example.net',
        storage: server.storage
    }));
}

/**
 * @see http://xmpp.org/extensions/xep-0045.html#owner
 */
describe('Xep-0060', function () {
    describe('10. Owner Use Cases', function () {

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

        /* 
         * User Creates a Room and Signals Support for Multi-User Chat
         * <presence
         *     from='crone1@shakespeare.lit/desktop'
         *     to='coven@chat.shakespeare.lit/firstwitch'>
         *   <x xmlns='http://jabber.org/protocol/muc'/>
         * </presence>
         *
         * Service Acknowledges Room Creation
         * <presence
         *     from='coven@chat.shakespeare.lit/firstwitch'
         *     to='crone1@shakespeare.lit/desktop'>
         *   <x xmlns='http://jabber.org/protocol/muc#user'>
         *     <item affiliation='owner'
         *           role='moderator'/>
         *     <status code='110'/>
         *     <status code='201'/>
         *   </x>
         * </presence>
         */
        it('10.1.1 User Creates a Room and Signals Support for Multi-User Chat', function (done) {

            var julia;

            var room = 'room1@chat.example.net';
            var nick = room + '/julia';

            var msg =
            "<presence> \
                <x xmlns='http://jabber.org/protocol/muc'/> \
            </presence>";

            var stanza;

            // start clients
            Promise.all([helper.startJulia()]).then(function (results) {
                julia = results[0];
            })
            // send message
            .then(function () {
                stanza = ltx.parse(msg);
                stanza.attrs.from = julia.jid.toString();
                stanza.attrs.to = nick;
                julia.send(stanza);
            })
            // wait for response
            .then(function () {
                var promise = new Promise(function (resolve, reject) {
                    julia.on('stanza', function (stanza) {
                        console.log(stanza.toString());

                        // verify message
                        if (stanza.is('presence')) {
                            assert.equal(stanza.attrs.from, nick);
                            // TODO check the values fit
                            resolve();
                        } else {
                            reject('wrong stanza ' + stanza.root().toString());
                        }
                    });
                });
                return promise;
            }).then(function () {
                done();
            }).
            catch (function (err) {
                done(err);
            });
        });

        /*
         * 10.1.2 Creating an Instant Room
         *  <iq from='crone1@shakespeare.lit/desktop'
         *     id='create1'
         *     to='coven@chat.shakespeare.lit'
         *     type='set'>
         *   <query xmlns='http://jabber.org/protocol/muc#owner'>
         *     <x xmlns='jabber:x:data' type='submit'/>
         *   </query>
         * </iq>
         *
         * <iq from='coven@chat.shakespeare.lit'
         *     id='create2'
         *     to='crone1@shakespeare.lit/desktop'
         *     type='result'/>
         *
         */
        it('10.1.2 Creating an Instant Room', function (done) {
            /*var julia;

            var room = 'room2@chat.example.net';
            var nick = room + '/julia';

            var msg =
            "<iq id='create1' type='set'> \
                <query xmlns='http://jabber.org/protocol/muc#owner'> \
                <x xmlns='jabber:x:data' type='submit'/> \
                </query> \
            </iq>";

            var stanza;

            Promise.all([helper.startJulia()]).then(function (results) {
                julia = results[0];
            })
            // send message
            .then(function () {
                stanza = ltx.parse(msg);
                stanza.attrs.from = julia.jid.toString();
                stanza.attrs.to = nick;
                julia.send(stanza);
            })
            // wait for response
            .then(function () {
                var promise = new Promise(function (resolve, reject) {
                    julia.on('stanza', function (stanza) {
                        console.log(stanza.toString());

                        // verify message
                        if (stanza.is('presence')) {
                            assert.equal(stanza.attrs.from, nick);
                            resolve();
                        } else {
                            reject('wrong stanza ' + stanza.root().toString());
                        }
                    });
                });
                return promise;
            }).then(function () {
                done();
            }).
            catch (function (err) {
                done(err);
            });*/
            done();
        });

        /*
         * <presence
         *     from='crone1@shakespeare.lit/desktop'
         *     to='coven@chat.shakespeare.lit/firstwitch'>
         *   <x xmlns='http://jabber.org/protocol/muc'/>
         * </presence>
         *
         * Service Informs User of Inability to Create a Room
         * <presence
         *     from='coven@chat.shakespeare.lit/thirdwitch'
         *     to='hag66@shakespeare.lit/pda'
         *     type='error'>
         *   <x xmlns='http://jabber.org/protocol/muc'/>
         *   <error by='coven@chat.shakespeare.lit' type='cancel'>
         *     <not-allowed xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
         *   </error>
         * </presence>
         *
         */
        it('10.1.2 Creating an Instant Room: Deny to overwrite existing room', function (done) {
            done();
        });


        /* 
         * 10.9 Destroying a Room
         * <iq from='crone1@shakespeare.lit/desktop'
         *     id='begone'
         *     to='heath@chat.shakespeare.lit'
         *     type='set'>
         *   <query xmlns='http://jabber.org/protocol/muc#owner'>
         *     <destroy jid='coven@chat.shakespeare.lit'>
         *       <reason>Macbeth doth come.</reason>
         *     </destroy>
         *   </query>
         * </iq>
         *
         * Service Removes Each Occupant
         * <presence
         *     from='heath@chat.shakespeare.lit/firstwitch'
         *     to='crone1@shakespeare.lit/desktop'
         *     type='unavailable'>
         *   <x xmlns='http://jabber.org/protocol/muc#user'>
         *     <item affiliation='none' role='none'/>
         *     <destroy jid='coven@chat.shakespeare.lit'>
         *       <reason>Macbeth doth come.</reason>
         *     </destroy>
         *   </x>
         * </presence>
         *
         * <presence
         *     from='heath@chat.shakespeare.lit/secondwitch'
         *     to='wiccarocks@shakespeare.lit/laptop'
         *     type='unavailable'>
         *   <x xmlns='http://jabber.org/protocol/muc#user'>
         *     <item affiliation='none' role='none'/>
         *     <destroy jid='coven@chat.shakespeare.lit'>
         *       <reason>Macbeth doth come.</reason>
         *     </destroy>
         *   </x>
         * </presence>
         *
         * Service Informs Owner of Successful Destruction
         * <iq from='heath@chat.shakespeare.lit'
         *     id='begone'
         *     to='crone1@shakespeare.lit/desktop'
         *     type='result'/>
         *
         */
        it('10.9 Destroying a Room', function (done) {
            done();
        });

        /* 
         * Service Denies Destroy Request Submitted by Non-Owner
         * <iq from='crone1@shakespeare.lit/desktop'
         *     id='begone'
         *     to='heath@chat.shakespeare.lit'
         *     type='set'>
         *   <query xmlns='http://jabber.org/protocol/muc#owner'>
         *     <destroy jid='coven@chat.shakespeare.lit'>
         *       <reason>Macbeth doth come.</reason>
         *     </destroy>
         *   </query>
         * </iq>
         *
         * <iq from='heath@chat.shakespeare.lit'
         *     id='destroytest'
         *     to='wiccarocks@shakespeare.lit/laptop'
         *     type='error'>
         *   <query xmlns='http://jabber.org/protocol/muc#owner'>
         *     <destroy jid='coven@chat.shakespeare.lit'>
         *       <reason>Macbeth doth come.</reason>
         *     </destroy>
         *   </query>
         *   <error type='auth'>
         *     <forbidden xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
         *   </error>
         * </iq>
         */
        it('10.9 Service Denies Destroy Request Submitted by Non-Owner', function (done) {
            done();
        });
    });
});