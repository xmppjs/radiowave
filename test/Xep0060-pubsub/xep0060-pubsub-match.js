'use strict';

// assertion
var assert = require('assert'),
    should = require('should');

// logging
var LogConfig = require('../../config/LogConfig');
LogConfig.configure('silly');

var ltx = require('ltx'),
    Xep0060 = require('../../xep/Xep0060-pubsub');

describe('Xep-0060', function () {
    var xep = null;

    before(function (done) {
        xep = new Xep0060({
            subdomain: 'pubsub',
            domain: 'shakespeare.lit'
        })
        done();
    })

    function check(message) {
        var stanza = ltx.parse(message);
        return xep.match(stanza);
    }

    describe('check match of xmpp stanzas', function () {

        it('iq request discover features', function (done) {
            var message =
            "<iq type='get' \
			    from='francisco@denmark.lit/barracks' \
			    to='pubsub.shakespeare.lit' \
			    id='feature1'> \
			  <query xmlns='http://jabber.org/protocol/disco#info'/> \
			</iq>";

            assert.ok(check(message));
            done();
        });

        it('iq request discover nodes', function (done) {
            var message =
            "<iq type='get' \
			    from='francisco@denmark.lit/barracks' \
			    to='pubsub.shakespeare.lit' \
			    id='nodes1'> \
			  <query xmlns='http://jabber.org/protocol/disco#items'/> \
			</iq>";
            assert.ok(check(message));
            done();
        });

        it('iq request discover node information', function (done) {
            var message =
            "<iq type='get' \
			    from='francisco@denmark.lit/barracks' \
			    to='pubsub.shakespeare.lit' \
			    id='info2'> \
			  <query xmlns='http://jabber.org/protocol/disco#info' \
			         node='blogs'/> \
			</iq>"

            assert.ok(check(message));
            done();
        });

        it('subscription is accepted', function (done) {
            var message =
            "<iq type='set' \
			    from='francisco@denmark.lit/barracks' \
			    to='pubsub.shakespeare.lit' \
			    id='sub1'> \
			  <pubsub xmlns='http://jabber.org/protocol/pubsub'> \
			    <subscribe \
			        node='princely_musings' \
			        jid='francisco@denmark.lit'/> \
			  </pubsub> \
			</iq>"

            assert.ok(check(message));
            done();
        });

        it('publish is accepted', function (done) {
            var message =
            "<iq type='set' \
			    from='hamlet@denmark.lit/blogbot' \
			    to='pubsub.shakespeare.lit' \
			    id='publish1'> \
			  <pubsub xmlns='http://jabber.org/protocol/pubsub'> \
			    <publish node='princely_musings'> \
			      <item id='bnd81g37d61f49fgn581'> \
			        <entry xmlns='http://www.w3.org/2005/Atom'> \
			          <title>Soliloquy</title> \
			          <summary> \
			To be, or not to be: that is the question. \
			          </summary> \
			          <link rel='alternate' type='text/html' \
			                href='http://denmark.lit/2003/12/13/atom03'/> \
			          <id>tag:denmark.lit,2003:entry-32397</id> \
			          <published>2003-12-13T18:30:02Z</published> \
			          <updated>2003-12-13T18:30:02Z</updated> \
			        </entry> \
			      </item> \
			    </publish> \
			  </pubsub> \
			</iq>"

            assert.ok(check(message));
            done();
        });

        it('node deletion is accepted', function (done) {
            var message =
            "<iq type='set' \
			    from='hamlet@denmark.lit/elsinore' \
			    to='pubsub.shakespeare.lit' \
			    id='retract1'> \
			  <pubsub xmlns='http://jabber.org/protocol/pubsub'> \
			    <retract node='princely_musings'> \
			      <item id='ae890ac52d0df67ed7cfdf51b644e901'/> \
			    </retract> \
			  </pubsub> \
			</iq>"

            assert.ok(check(message));
            done();
        });

        it('subscription with wrong target', function (done) {
            var message =
            "<iq type='set' \
			    from='francisco@denmark.lit/barracks' \
			    to='pubsub2.shakespeare.lit' \
			    id='sub1'> \
			  <pubsub xmlns='http://jabber.org/protocol/pubsub'> \
			    <subscribe \
			        node='princely_musings' \
			        jid='francisco@denmark.lit'/> \
			  </pubsub> \
			</iq>"

            assert.equal(check(message), false);
            done();
        });

        it('publish with wrong target', function (done) {
            var message =
            "<iq type='set' \
			    from='hamlet@denmark.lit/blogbot' \
			    to='2pubsub.shakespeare.lit' \
			    id='publish1'> \
			  <pubsub xmlns='http://jabber.org/protocol/pubsub'> \
			    <publish node='princely_musings'> \
			      <item id='bnd81g37d61f49fgn581'> \
			        <entry xmlns='http://www.w3.org/2005/Atom'> \
			          <title>Soliloquy</title> \
			          <summary> \
			To be, or not to be: that is the question. \
			          </summary> \
			          <link rel='alternate' type='text/html' \
			                href='http://denmark.lit/2003/12/13/atom03'/> \
			          <id>tag:denmark.lit,2003:entry-32397</id> \
			          <published>2003-12-13T18:30:02Z</published> \
			          <updated>2003-12-13T18:30:02Z</updated> \
			        </entry> \
			      </item> \
			    </publish> \
			  </pubsub> \
			</iq>"

            assert.equal(check(message), false);
            done();
        });
    });
});