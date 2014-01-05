'use strict';

var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , ltx = require('ltx')

var winston = require('winston'),
    logger = winston.loggers.get('bosh');

var NS_HTTPBIND = 'http://jabber.org/protocol/httpbind'

function generateSid() {
    var sid = ''
    for (var i = 0; i < 32; i++) {
        sid += String.fromCharCode(48 + Math.floor(Math.random() * 10))
    }
    return sid
}

// TODO allow to set settings via options
function sendCorsHeader(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader("Access-Control-Allow-Headers", "Authorization, X-Requested-With, Content-Type, Content-Length");
    res.setHeader('Access-Control-Allow-Credentials', true);
}

/**
 * Gets constructed with a first HTTP request (opts.req & opts.res),
 * but receives more in method handleHTTP().
 * 
 * The BOSH server session behaves like a normal socket and emits all proper 
 * messages to a connection
 *
 * Implement the follwing methods
 * serializeStanza()
 * write()
 * pause()
 * resume()
 * end()
 *
 * Implement the following events:
 * this.emit('connect');
 * this.emit('data', string);
 * this.emit('end');
 * this.emit('close');
 */
function BOSHServerSession(opts) {
    // socket properties
    this.writable = true;
    this.readable = true;

    // Bosh settings

    this.xmlnsAttrs = {
        xmlns: NS_HTTPBIND,
        'xmlns:xmpp': 'urn:xmpp:xbosh',
        'xmlns:stream': 'http://etherx.jabber.org/streams'
    }
    if (opts.xmlns) {
        for (var prefix in opts.xmlns) {
            if (prefix) {
                this.xmlnsAttrs['xmlns:' + prefix] = opts.xmlns[prefix]
            } else {
                this.xmlnsAttrs.xmlns = opts.xmlns[prefix]
            }
        }
    }
    this.streamAttrs = opts.streamAttrs || {}
    this.handshakeAttrs = opts.bodyEl.attrs

    // generate sid
    this.sid = generateSid()
    // add sid to properties
    this.xmlnsAttrs.sid = this.sid;


    this.nextRid = parseInt(opts.bodyEl.attrs.rid, 10) 
    this.wait = parseInt(opts.bodyEl.attrs.wait || '30', 10)
    this.hold = parseInt(opts.bodyEl.attrs.hold || '1', 10)
    this.inQueue = {}
    this.outQueue = []
    this.stanzaQueue = []

    this.maySetConnectionTimeout()

    this.emit('connect');

    this.inQueue[opts.bodyEl.attrs.rid] = opts
    process.nextTick(this.workInQueue.bind(this))
}

util.inherits(BOSHServerSession, EventEmitter)

// implementation of socket interface
BOSHServerSession.prototype.write = function (data) {
    logger.debug('write bosh socket' + data);
    logger.debug(data.toString());
    this.stanzaQueue.push(data)

    process.nextTick(this.workOutQueue.bind(this))
    // indicate if we flush:
    return this.outQueue.length > 0
}

BOSHServerSession.prototype.serializeStanza = function (s, clbk) {
    clbk(s.toString()); // No specific serialization
};

BOSHServerSession.prototype.pause = function () {};
BOSHServerSession.prototype.resume = function () {};
BOSHServerSession.prototype.end = function () {};

BOSHServerSession.prototype.sendData = function (data) {
    logger.debug('emit data ' + data);
    this.emit('data', data.toString());
};

BOSHServerSession.prototype.closeSocket = function (data) {
    this.emit('end')
    this.emit('close')
};

// implmentation of BOSH Session

BOSHServerSession.prototype.handleHTTP = function(opts) {
    logger.debug('handleHTTP' + opts.bodyEl.toString())
    if (this.inQueue.hasOwnProperty(opts.bodyEl.attrs.rid)) {
        // Already queued? Replace with this request
        var oldOpts = this.inQueue[opts.bodyEl.attrs.rid]
        sendCorsHeader(oldOpts.res);
        oldOpts.res.writeHead(
            403,
            { 'Content-Type': 'text/plain' }
        )
        oldOpts.res.end('Request replaced by same RID')
    } else if (parseInt(opts.bodyEl.attrs.rid, 10) < parseInt(this.nextRid, 10)) {
        // This req has already been processed.
        this.outQueue.push(opts)
        return
    }

    if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout)
        delete this.connectionTimeout
    }

    // Set up timeout:
    var self = this
    opts.timer = setTimeout(function() {
        delete opts.timer
        self.onReqTimeout(opts.bodyEl.attrs.rid)
    }, this.wait * 1000)

    // Process...
    logger.debug('process');
    this.inQueue[opts.bodyEl.attrs.rid] = opts
    process.nextTick(this.workInQueue.bind(this))
}

BOSHServerSession.prototype.workInQueue = function() {
    logger.debug('workInQueue')
    if (!this.inQueue.hasOwnProperty(this.nextRid)) {
        // Still waiting for next rid request
        return
    }

    var self = this
    var opts = this.inQueue[this.nextRid]
    delete this.inQueue[this.nextRid]
    this.nextRid++

    // handle message
    logger.debug(opts.bodyEl.root().toString())

    // extract values
    var rid = opts.bodyEl.attrs.rid
    var sid = opts.bodyEl.attrs.sid
    var to = opts.bodyEl.attrs.to
    var restart = opts.bodyEl.attrs['xmpp:restart'];
    var xmppv = opts.bodyEl.attrs['xmpp:version'];

    // handle stream start
    if (!restart && rid && !sid) {
        // emulate stream creation
        this.sendData("<?xml version='1.0' ?>")
        this.sendData("<stream:stream to='" + to + "' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='" + xmppv + "'>")
    }

    // handle stream reset
    if (opts.bodyEl.attrs['xmpp:restart'] == "true") {
        logger.debug('start new stream')
        // start new stream
        var stream = "<stream:stream xmlns:stream='http://etherx.jabber.org/streams' xmlns='jabber:client' version='1.0' id='7298425636345943' from='example.net'>"
        this.sendData(stream);
    }

    opts.bodyEl.children.forEach(function(stanza) {
        // extract content
        logger.debug('emit' + stanza.root().children.toString());
        self.sendData(stanza.root().children.toString());
    })

    // Input process, retain response for sending stanzas
    this.outQueue.push(opts)

    if (opts.bodyEl.attrs.type !== 'terminate') {
        process.nextTick(function() {
            self.workOutQueue()
            self.workInQueue()
        })
    } else {
        for (var i = 0; i < this.outQueue.length; i++) {
            opts = this.outQueue[i]
            if (opts.timer) clearTimeout(opts.timer)
            this.respond(opts.res, { type: 'terminate' }, [])
        }
        this.outQueue = []
        this.closeSocket();
    }
}

BOSHServerSession.prototype.workOutQueue = function() {
    logger.debug('workoutqueue')

    if ((this.stanzaQueue.length < 1) &&
        (this.outQueue.length > 0)) {
        this.emit('drain')
        return
    } else if (this.outQueue.length < 1) {
        return
    }

    // queued stanzas
    var stanzas = this.stanzaQueue
    this.stanzaQueue = []

    // available requests
    var opts = this.outQueue.shift()

    if (opts.timer) {
        clearTimeout(opts.timer)
        delete opts.timer
    }

    // answer
    this.respond(opts.res, {}, stanzas)

    this.maySetConnectionTimeout()
}

BOSHServerSession.prototype.maySetConnectionTimeout = function() {
    if (this.outQueue.length < 1) {
        var self = this
        this.connectionTimeout = setTimeout(function() {
            self.emit('error', new Error('Session timeout'))
            self.emit('close')
        }, 60 * 1000)
    }
}

BOSHServerSession.prototype.onReqTimeout = function(rid) {
    var opts
    if ((opts = this.inQueue[rid])) {
        delete this.inQueue[rid]
    } else {
        for (var i = 0; i < this.outQueue.length; i++) {
            if (this.outQueue[i].bodyEl.attrs.rid === rid) break
        }

        if (i < this.outQueue.length) {
            opts = this.outQueue[i]
            this.outQueue.splice(i, 1)
        } else {
            console.warn('Spurious timeout for BOSH rid', rid)
            return
        }
    }
    this.respond(opts.res, {})
}

BOSHServerSession.prototype.respond = function(res, attrs, children) {
    sendCorsHeader(res);
    res.writeHead(
        200,
        { 'Content-Type': 'application/xml; charset=utf-8' }
    )
    for (var k in this.xmlnsAttrs) {
        attrs[k] = this.xmlnsAttrs[k]
    }
    var bodyEl = new ltx.Element('body', attrs)
    if (children) {
        // TODO, we need to filter the stream element
        children.forEach(function (element, index, array) {
            try {
                bodyEl.cnode(ltx.parse(element));
            } catch (err) {
                logger.error('could not parse' + element)
            }
        })
    }
    logger.debug(bodyEl.root().toString());
    bodyEl.write(function(s) {
        res.write(s)
    })
    res.end()
}

module.exports = BOSHServerSession