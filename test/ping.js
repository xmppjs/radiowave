'use strict';

// assertion
var assert = require('assert'),
    should = require('should');

// logging
var LogConfig = require('../config/LogConfig');
LogConfig.configure('error');

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
    Xep0199 = require('../xep/Xep0199-ping');


// user
var user = {
    jid: 'admin@example.net',
    password: 'password',
    host: 'localhost'
};

describe('Ping', function () {
    describe('C2S', function () {
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
            simpleAuth.addUser('admin','password');
            xR.connectionRouter.authMethods.push(simpleAuth);

            // register xep component
            var cr = new ComponentRouter();
            cr.register(new Xep0199());

            // chain XRocket to ComponentRouter
            xR.chain(cr);

            done();
        });

        after(function (done) {
            xR.shutdown();
            done();
        });

        it('should accept plain authentication and reply to ping', function (done) {
            var cl = new Client({
                jid: user.jid,
                password: user.password,
                preferred: 'PLAIN',
                host: user.host
            });

            var id = 'r2d2';

            cl.on('stanza',
                function (stanza) {
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'result' );
                        assert.equal(stanza.attrs.id, id );
                        done();
                    } else {
                        done('wrong stanza ' +  stanza.root().toString());
                    }
                });

            cl.on('online', function () {
                // generate 
                var ping = new ltx.Element('iq', {
                    to: 'example.net',
                    from: cl.jid,
                    type: 'get',
                    id: id
                }).c('ping', {
                    'xmlns': 'urn:xmpp:ping'
                });
                console.log(ping.root().toString());
                cl.send(ping);
            });

            cl.on('error', function (e) {
                console.log(e);
                done(e);
            });

        });

        it('should not accept plain authentication', function (done) {
            var cl = new Client({
                jid: user.jid,
                password: 'secretsecret',
                host: user.host
            });

            cl.on('online', function () {
                done('user is not valid');
            });

            cl.on('error', function () {
                // this should happen
                done();
            });

        });
    });
});