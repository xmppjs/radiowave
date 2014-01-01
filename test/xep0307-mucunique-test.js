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
var xRocket = require('../xrocket');

// Xep Components
var Xep0307 = require('../xep/Xep0307-mucunique');

// user
var user = {
    jid: 'crone1@example.net',
    password: 'crone1',
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

describe('XEP-0307', function () {
    var xR = null;

    function setUpServer(done) {
        var cs2 = new xRocket.Net.C2SServer({});

        // attach connection manager to xrocket
        xR = new xRocket.XRocket();
        xR.addConnectionManager(cs2);

        // register users
        var simpleAuth = new xRocket.Auth.Simple();
        simpleAuth.addUser('crone1', 'crone1');
        xR.connectionRouter.authMethods.push(simpleAuth);

        // register xep component
        var cr = new xRocket.Router.ComponentRouter();
        var lr = new xRocket.Router.LogRouter();

        cr.register(new Xep0307());

        // chain XRocket to ComponentRouter
        xR.chain(lr).chain(cr);

        done();
    }

    function sendMessage(cl, stanza, done) {
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
        setUpServer(done);
    });

    after(function (done) {
        xR.shutdown();
        done();
    });

    /*
     * <iq from='crone1@shakespeare.lit/desktop'
     *     id='unique1'
     *     to='chat.shakespeare.lit'
     *     type='get'>
     *   <unique xmlns='http://jabber.org/protocol/muc#unique'/>
     * </iq>
     *
     * <iq from='chat.shakespeare.lit'
     *     id='unique1'
     *     to='crone1@shakespeare.lit/desktop'
     *     type='result'>
     *   <unique xmlns='http://jabber.org/protocol/muc#unique'>
     *     6d9423a55f499b29ad20bf7b2bdea4f4b885ead1
     *   </unique>
     * </iq>
     */
    it('Entity Requests Unique Room Name', function (done) {
        var cl = getClient();

        var publish = new ltx.Element('iq', {
            to: 'chat.example.net',
            from: cl.jid,
            type: 'get'
        });
        publish.c('unique', {
            'xmlns': 'http://jabber.org/protocol/muc#unique'
        });

        sendMessage(cl, publish, function (err, stanza) {
            console.log(err);
            console.log(stanza.toString());
            should.not.exist(err);
            if (stanza.is('iq')) {
                assert.equal(stanza.attrs.type, 'result');

                var unique = stanza.getChild('unique', 'http://jabber.org/protocol/muc#unique');
                unique.should.not.be.empty;
                
                var id = unique.text();
                id.should.match(/[A-Za-z0-9-]{36}/); // uuid

                done();
            } else {
                done('wrong stanza ' + stanza.root().toString());
            }
        });
    });
});