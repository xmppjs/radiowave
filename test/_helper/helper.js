'use strict';

var winston = require('winston');

var Promise = require('bluebird'),
    Client = require('node-xmpp-client'),
    xRocket = require('../../xrocket'),
    C2SServer = xRocket.Net.C2SServer;

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

var userBenvolio = {
    jid: 'benvolio@example.net',
    password: 'benvolio',
    host: 'localhost'
};

// start client and wait until the client is online
function startClient(user) {
    var promise = new Promise(function (resolve, reject) {
        var cl = new Client({
            jid: user.jid,
            password: user.password,
            preferred: 'PLAIN',
            host: user.host
        });
        cl.on('online', function () {
            resolve(cl);
        });
        cl.on('error', function () {
            reject();
        });
    });
    return promise;
}

function startRomeo() {
    return startClient(userRomeo);
}

function startJulia() {
    return startClient(userJulia);
}

function startBenvolio() {
    return startClient(userBenvolio);
}

function startServer() {
    var promise = new Promise(function (resolve, reject) {

        // inistanciate storage module
        // use sqlite for testing
        var s = new xRocket.Storage({
            database: 'database',
            username: 'username',
            password: 'password',
            dialect: 'sqlite',
            storage: './test.sqlite'
        });
        s.initialize({
            force: true
        }).then(function(storage){

            // C2S Server 
            var cs2 = new C2SServer({});

            // attach connection manager to xrocket
            var xR = new xRocket.XRocket();

            xR.addConnectionRouter(new xRocket.Router.ConnectionRouter(storage));
            xR.addConnectionManager(cs2);

            // register users
            var simpleAuth = new xRocket.Auth.Simple();
            simpleAuth.addUser('romeo', 'romeo');
            simpleAuth.addUser('julia', 'julia');
            simpleAuth.addUser('benvolio', 'benvolio');
            xR.connectionRouter.authMethods.push(simpleAuth);

            // register xep component
            var cr = new xRocket.Router.ComponentRouter({
                domain: 'example.net'
            });
            var lr = new xRocket.Router.LogRouter();
            // chain XRocket to ComponentRouter
            xR.chain(lr).chain(cr);

            var returnVal = {
                'xR': xR,
                'cr': cr,
                'storage': storage
            };
            resolve(returnVal);
        }).catch(function(err){
            reject(err);
        });
    });
    return promise;
}

function sendMessageWithRomeo(stanza) {

    return new Promise(function (resolve, reject) {
        var romeo;

        // start clients
        Promise.all([startRomeo()]).then(function (results) {
            console.log('romeo is online');
            romeo = results[0];
        })
        // send message
        .then(function () {
            console.log('romeo send message: ' + stanza.toString());
            romeo.send(stanza);
        })
        // wait for response
        .then(function () {

            return new Promise(function (recieve_resolve, recieve_reject) {
                romeo.once('stanza', function (stanza) {
                    console.log('romeo recieved: ' + stanza.toString());
                    recieve_resolve(stanza);
                });

                romeo.on('error', function (error) {
                    console.error(error);
                    recieve_reject(error);
                });

            });

        }).then(function (message) {
            console.log('romeo logs out');
            romeo.end();
            resolve(message);
        }).
        catch (function (err) {
            console.error(err);
            romeo.end();
            reject(err);
        });
    });
}

function sendMessageWithJulia(stanza) {

    return new Promise(function (resolve, reject) {
        var julia;

        // start clients
        Promise.all([startJulia()]).then(function (results) {
            console.log('julia is online');
            julia = results[0];
        })
        // send message
        .then(function () {
            console.log('julia send message: ' + stanza.toString());
            julia.send(stanza);
        })
        // wait for response
        .then(function () {

            return new Promise(function (recieve_resolve, recieve_reject) {
                julia.once('stanza', function (stanza) {
                    console.log('julia recieved: ' + stanza.toString());
                    recieve_resolve(stanza);
                });

                julia.on('error', function (error) {
                    console.error(error);
                    recieve_reject(error);
                });

            });

        }).then(function (message) {
            console.log('julia logs out');
            julia.end();
            resolve(message);
        }).
        catch (function (err) {
            console.error(err);
            julia.end();
            reject(err);
        });
    });
}

function configureLoglevel(level) {
    console.log('configure xrocket logging');

    var defaultConfiguration = {
        console: {
            level: level,
            colorize: 'true'
        }
    };

    function getConfiguration (label) {
        var conf = Object.create(defaultConfiguration);
        conf.console.label = label;
        return conf;
    }
    
    winston.loggers.add('xrocket', getConfiguration('xrocket'));
    winston.loggers.add('cm', getConfiguration('cm'));
    winston.loggers.add('router', getConfiguration('router'));
    winston.loggers.add('connrouter', getConfiguration('connrouter'));
    winston.loggers.add('logrouter', getConfiguration('logrouter'));
    winston.loggers.add('xeprouter', getConfiguration('xeprouter'));
    winston.loggers.add('xepcomponent', getConfiguration('xepcomponent'));
    winston.loggers.add('xep-0045', getConfiguration('xep-0045'));
    winston.loggers.add('xep-0060', getConfiguration('xep-0060'));
    winston.loggers.add('authentication', getConfiguration('authentication'));
    winston.loggers.add('postgresql', getConfiguration('postgresql'));
    winston.loggers.add('storage', getConfiguration('storage'));
    winston.loggers.add('webapi', getConfiguration('webapi'));

    winston.loggers.add('websocket', getConfiguration('websocket'));
    winston.loggers.add('socketio', getConfiguration('socketio'));
    winston.loggers.add('bosh', getConfiguration('bosh'));
}

module.exports = {
    'userRomeo':userRomeo,
    'userBenvolio': userBenvolio,
    'userJulia': userJulia,
    'configureLoglevel' : configureLoglevel,
    'startRomeo': startRomeo,
    'startJulia': startJulia,
    'startBenvolio': startBenvolio,
    'startServer': startServer,
    'sendMessageWithRomeo' : sendMessageWithRomeo,
    'sendMessageWithJulia' : sendMessageWithJulia
};