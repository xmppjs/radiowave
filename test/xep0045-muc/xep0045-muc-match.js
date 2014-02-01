'use strict';

// assertion
var assert = require('assert'),
    should = require('should'),
    helper = require('../_helper/helper');

// logging
helper.configureLoglevel('silly');

var ltx = require('ltx'),
    Xep0045 = require('../../xep/Xep0045-muc');

describe('Xep-0045', function () {
    var xep = null;

    before(function (done) {
        xep = new Xep0045({
            subdomain: 'chat',
            domain: 'shakespeare.lit',
            storage: {
                users : null
            }
        })
        done();
    })

    function check(message) {
        var stanza = ltx.parse(message);
        return xep.match(stanza);
    }

    describe('check match of xmpp stanzas', function () {

        it('iq request disco#items on server', function (done) {
            var message =
            "<iq from='hag66@shakespeare.lit/pda' \
                id='zb8q41f4' \
                to='chat.shakespeare.lit' \
                type='get'> \
              <query xmlns='http://jabber.org/protocol/disco#items'/> \
            </iq>";

            assert.ok(check(message));
            done();
        });

        it('iq request disco#info on room', function (done) {
            var message =
            "<iq from='hag66@shakespeare.lit/pda' \
                id='ik3vs715' \
                to='coven@chat.shakespeare.lit' \
                type='get'> \
              <query xmlns='http://jabber.org/protocol/disco#info'/> \
            </iq>";
            assert.ok(check(message));
            done();
        });

        it('iq request disco#items on room', function (done) {
            var message =
            "<iq from='hag66@shakespeare.lit/pda' \
                id='kl2fax27' \
                to='coven@chat.shakespeare.lit' \
                type='get'> \
              <query xmlns='http://jabber.org/protocol/disco#items'/> \
            </iq>"

            assert.ok(check(message));
            done();
        });

        it('presence is accepted', function (done) {
            var message =
            "<presence \
                from='hag66@shakespeare.lit/pda' \
                id='ng91xs69' \
                to='coven@chat.shakespeare.lit/thirdwitch'/>"

            assert.ok(check(message));
            done();
        });

        it('message is accepted', function (done) {
            var message =
            "<message \
                from='hag66@shakespeare.lit/pda' \
                id='hysf1v37' \
                to='coven@chat.shakespeare.lit' \
                type='groupchat'> \
              <body>Harpier cries: 'tis time, 'tis time.</body> \
            </message>"

            assert.ok(check(message));
            done();
        });

        it('presence with wrong target', function (done) {
            var message =
            "<presence \
                from='hag66@shakespeare.lit/pda' \
                id='ng91xs69' \
                to='coven@chat2.shakespeare.lit/thirdwitch'/>"

            assert.equal(check(message), false);
            done();
        });

        it('message with wrong target', function (done) {
            var message =
            "<message \
                from='hag66@shakespeare.lit/pda' \
                id='hysf1v37' \
                to='coven@chat2.shakespeare.lit' \
                type='groupchat'> \
              <body>Harpier cries: 'tis time, 'tis time.</body> \
            </message>"

            assert.equal(check(message), false);
            done();
        });

        it('iq with wrong namespace', function (done) {
            var message =
            "<iq from='crone1@shakespeare.lit/desktop' \
                id='unique1' \
                to='chat.shakespeare.lit' \
                type='get'> \
                <unique xmlns='http://jabber.org/protocol/muc#unique'/> \
                </iq>"

            assert.equal(check(message), false);
            done();
        });

        it('mediated message invitation', function (done) {
            var message =
            "<message \
                from='crone1@shakespeare.lit/desktop' \
                id='nzd143v8' \
                to='coven@chat.shakespeare.lit'> \
                <x xmlns='http://jabber.org/protocol/muc#user'> \
                    <invite to='hecate@shakespeare.lit'> \
                        <reason> \
                        Hey Hecate, this is the place for all good witches! \
                        </reason> \
                    </invite> \
                </x> \
            </message>"

            assert.equal(check(message), true);
            done();
        });
    });
});