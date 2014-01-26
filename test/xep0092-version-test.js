'use strict';

// assertion
var assert = require('assert'),
    should = require('should');

// logging
require('../config/LogConfig')('error');

// xmpp client
var ltx = require('ltx'),
    Client = require('node-xmpp-client');

// x rocket server
var XRocket = require('../core/XRocket'),
    Simple = require('../auth/Simple'),
    C2SServer = require('../net/C2SServer');

// SASL Methods
var Plain = require('node-xmpp-server/lib/authentication/plain');

// Xep Components
var ComponentRouter = require('../router/ComponentRouter'),
    Xep0092 = require('../xep/Xep0092-version');

// user
var user = {
    jid: 'admin@example.net',
    password: 'password',
    host: 'localhost'
};

var NS_VERSION = 'jabber:iq:version',
    NAME = 'xRocket',
    VERSION = '0.1.0',
    OS = 'xRocket operating system';

describe('Version', function () {
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
            simpleAuth.addUser('admin', 'password');
            xR.connectionRouter.authMethods.push(simpleAuth);

            // register xep component
            var cr = new ComponentRouter({
                domain: 'example.net'
            });
            cr.register(new Xep0092());

            // chain XRocket to ComponentRouter
            xR.chain(cr);

            done();
        });

        after(function (done) {
            xR.shutdown();
            done();
        });


        it('should accept plain authentication', function (done) {
            var cl = new Client({
                jid: user.jid,
                password: user.password,
                preferred: 'PLAIN',
                host: user.host
            });

            var id = 'verion_1';

            cl.on('stanza',
                function (stanza) {
                    if (stanza.is('iq')) {
                        assert.equal(stanza.attrs.type, 'result');
                        assert.equal(stanza.attrs.id, id);

                        var query = stanza.getChild('query', NS_VERSION);
                        assert.notEqual(query, null);

                        assert.equal(query.getChild('name').getText(), NAME);
                        assert.equal(query.getChild('version').getText(), VERSION);
                        assert.equal(query.getChild('os').getText(), OS);

                        done();
                    } else {
                        done('wrong stanza ' + stanza.root().toString());
                    }
                });

            cl.on('online', function () {
                // generate 
                var version = new ltx.Element('iq', {
                    to: 'example.net',
                    from: cl.jid,
                    type: 'get',
                    id: id
                }).c('query', {
                    'xmlns': NS_VERSION
                });
                cl.send(version);
            });

            cl.on('error', function (e) {
                console.error(e);
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