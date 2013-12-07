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
    Rfc3921Messaging = require('../xep/Rfc3921-messaging');

var LogConfig = require('../config/LogConfig');

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

describe('Rfc3921', function () {
    describe('Messaging', function () {

        var xR = null;
        var clJulia = null;
        var clRomeo = null;

        function setUpServer (done) {
            // C2S Server 
            var cs2 = new C2SServer({});
            cs2.registerSaslMechanism(Plain);

            // attach connection manager to xrocket
            xR = new XRocket();
            xR.addConnectionManager(cs2);

            // register users
            var simpleAuth = new Simple();
            simpleAuth.addUser('romeo','romeo');
            simpleAuth.addUser('julia','julia');
            xR.connectionRouter.authMethods.push(simpleAuth);

            // register xep component
            var cr = new ComponentRouter();

            // chain XRocket to ComponentRouter
            xR.chain(cr);

            // register messaging component
            cr.register(new Rfc3921Messaging());

            done();
        }

        function sendMessage(message, check) {

            clRomeo.on('stanza',
                function (stanza) {
                    if (stanza.is('message')) {
                        check(null, stanza);
                    } else {
                        check('wrong stanza ' + stanza.root().toString());
                    }
                });

            clJulia.on('online', function () {
                clJulia.send(message);
            });

            clJulia.on('error', function (e) {
                console.error(e);
                check(e);
            });

            clRomeo.on('error', function (e) {
                console.error(e);
                check(e);
            });

        }

        before(function (done) {
            setUpServer(done);
        });

        after(function (done) {
            xR.shutdown();
            done();
        });

        beforeEach(function (done) {
            clJulia = getClientJulia();
            clRomeo = getClientRomeo();
            done();
        });

        afterEach(function (done) {
            clJulia.end();
            clRomeo.end();
            done();
        });

        /**
         * sample message :
         * 
         * <message
         *     to='romeo@example.net'
         *     from='juliet@example.com/balcony'
         *     type='chat'
         *     xml:lang='en'>
         *   <body>Wherefore art thou, Romeo?</body>
         * </message>
         * 
         */
        it('4.2. Specifying a Message Type', function (done) {
            var el = ltx.parse("<message to='"+userRomeo.jid+"' from='" + userJulia+ "' type='chat' xml:lang='en'></message>");
            var body = ltx.parse("<body>Wherefore art thou, Romeo?</body>");
            el.cnode(body);
            sendMessage(el,function (err, stanza) {
                should.not.exist(err);
                var responseBody = stanza.getChild('body');
                assert.equal(body.toString(), responseBody.toString());
                done();
            });
        });

        /**
         * sample message :
         * 
         * <message
         *     to='romeo@example.net'
         *     from='juliet@example.com/balcony'
         *     type='chat'
         *     xml:lang='en'>
         *   <body>Wherefore art thou, Romeo?</body>
         *   <body xml:lang='cz'>Pro&#x010D;e&#x017D; jsi ty, Romeo?</body>
         * </message>
         * 
         */
        it('4.3. Specifying a Message Body', function (done) {
            var el = ltx.parse("<message to='"+userRomeo.jid+"' from='" + userJulia+ "' type='chat' xml:lang='en'></message>");
            var body = ltx.parse("<body>Wherefore art thou, Romeo?</body>");
            var body2 = ltx.parse("<body xml:lang='cz'>Pro&#x010D;e&#x017D; jsi ty, Romeo?</body>");
            el.cnode(body);
            el.cnode(body2);
            sendMessage(el,function (err, stanza) {
                should.not.exist(err);
                var responseBody = stanza.getChildren('body');
                assert.equal(body.toString(), responseBody[0].toString());
                assert.equal(body2.toString(), responseBody[1].toString());
                done();
            });
        });

        /**
         * sample message :
         * 
         * <message
         *     to='romeo@example.net'
         *     from='juliet@example.com/balcony'
         *     type='chat'
         *     xml:lang='en'>
         *   <subject>I implore you!</subject>
         *   <subject
         *       xml:lang='cz'>&#x00DA;p&#x011B;nliv&#x011B; prosim!</subject>
         *   <body>Wherefore art thou, Romeo?</body>
         *   <body xml:lang='cz'>Pro&#x010D;e&#x017D; jsi ty, Romeo?</body>
         * </message>
         * 
         */
        it('4.4. Specifying a Message Subject', function (done) {
            var el = ltx.parse("<message to='"+userRomeo.jid+"' from='" + userJulia+ "' type='chat' xml:lang='en'></message>");
            var subject = ltx.parse("<subject>I implore you!</subject>");
            var subject2 = ltx.parse("<subject xml:lang='cz'>&#x00DA;p&#x011B;nliv&#x011B; prosim!</subject>");
            el.cnode(subject);
            el.cnode(subject2);

            var body = ltx.parse("<body>Wherefore art thou, Romeo?</body>");
            var body2 = ltx.parse("<body xml:lang='cz'>Pro&#x010D;e&#x017D; jsi ty, Romeo?</body>");
            el.cnode(body);
            el.cnode(body2);
            sendMessage(el,function (err, stanza) {
                should.not.exist(err);

                var responseSubject = stanza.getChildren('subject');
                assert.equal(subject.toString(), responseSubject[0].toString());
                assert.equal(subject2.toString(), responseSubject[1].toString());

                var responseBody = stanza.getChildren('body');
                assert.equal(body.toString(), responseBody[0].toString());
                assert.equal(body2.toString(), responseBody[1].toString());
                done();
            });
        });

        /**
         * sample message :
         * <message
         *     to='romeo@example.net/orchard'
         *     from='juliet@example.com/balcony'
         *     type='chat'
         *     xml:lang='en'>
         *   <body>Art thou not Romeo, and a Montague?</body>
         *   <thread>e0ffe42b28561960c6b12b944a092794b9683a38</thread>
         * </message>
         * 
         * <message
         *     to='juliet@example.com/balcony'
         *     from='romeo@example.net/orchard'
         *     type='chat'
         *     xml:lang='en'>
         *   <body>Neither, fair saint, if either thee dislike.</body>
         *   <thread>e0ffe42b28561960c6b12b944a092794b9683a38</thread>
         * </message>
         * 
         * <message
         *     to='romeo@example.net/orchard'
         *     from='juliet@example.com/balcony'
         *     type='chat'
         *     xml:lang='en'>
         *   <body>How cam'st thou hither, tell me, and wherefore?</body>
         *   <thread>e0ffe42b28561960c6b12b944a092794b9683a38</thread>
         * </message>
         */
        it('4.5. Specifying a Conversation Thread', function (done) {

            var el = ltx.parse("<message to='"+userRomeo.jid+"' from='" + userJulia+ "' type='chat' xml:lang='en'></message>");
            var body = ltx.parse("<body>Wherefore art thou, Romeo?</body>");
            var thread = ltx.parse("<thread>e0ffe42b28561960c6b12b944a092794b9683a38</thread>");
            el.cnode(body);
            el.cnode(thread);
            sendMessage(el,function (err, stanza) {
                should.not.exist(err);
                var responseBody = stanza.getChild('body');
                assert.equal(body.toString(), responseBody.toString());
                var responseThread = stanza.getChild('thread');
                assert.equal(thread.toString(), responseThread.toString());
                done();
            });
        });
    });
});