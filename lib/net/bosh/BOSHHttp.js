'use strict';

var EventEmitter = require('events').EventEmitter,
  util = require('util'),
  ltx = require('ltx'),
  BOSHServerSession = require('./BOSHServerSession'),
  Connection = require('node-xmpp-core').Connection

var NS_HTTPBIND = 'http://jabber.org/protocol/httpbind'

function parseBody(stream, cb) {
  var parser = new ltx.Parser()
  stream.on('data', function (data) {
    parser.write(data)
  })
  stream.on('end', function () {
    parser.end()
  })
  stream.on('error', function (e) {
    cb(e)
  })
  parser.on('tree', function (bodyEl) {
    cb(null, bodyEl)
  })
  parser.on('error', function (e) {
    cb(e)
  })
}

/**
 * Sessions are stored *in memory!* You wouldn't want that for very
 * large setups.
 */
function BOSHServer(options) {
  this.options = options ||  {};

  // set default cors properties
  if (!this.options.cors) {
    this.options.cors = {
      origin: '*'
    };
  }

  this.sessions = {}
}

util.inherits(BOSHServer, EventEmitter)

BOSHServer.prototype.setCorsHeader = function (res, options) {
  res.setHeader('Access-Control-Allow-Origin', options.origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, X-Requested-With, Content-Type, Content-Length')
  res.setHeader('Access-Control-Allow-Credentials', true)
}

/**
 * *YOU* need to check the path before passing to this function.
 */
BOSHServer.prototype.handleHTTP = function (req, res) {
  this.setCorsHeader(res, this.options.cors);
  if (req.method === 'POST') {
    this._handlePostRequest(req, res)
      //} else if (false && req.method === 'PROPFIND') {
      /* TODO: CORS preflight request */
  } else {
    res.writeHead(400)
    res.end()
  }
}

BOSHServer.prototype._handlePostRequest = function (req, res) {
  var self = this
  parseBody(req, function (error, bodyEl) {
    if (error ||
      !bodyEl || !bodyEl.attrs || !bodyEl.is ||
      !bodyEl.is('body', NS_HTTPBIND)
    ) {
      self._sendErrorResponse(res, error)
    }

    if (bodyEl.attrs.sid) {
      return self._useExistingSession(req, res, bodyEl)
    }
    self._createSession(req, res, bodyEl)
  })
}

BOSHServer.prototype._sendErrorResponse = function (res, error) {
  res.writeHead(400, {
    'Content-Type': 'text/plain'
  })
  res.end(error.message || error.stack || 'Error')
}

BOSHServer.prototype._useExistingSession = function (req, res, bodyEl) {
  var session = this.sessions[bodyEl.attrs.sid]
  if (session) {
    session.handleHTTP({
      req: req,
      res: res,
      bodyEl: bodyEl
    })
  } else {
    res.writeHead(
      404, {
        'Content-Type': 'text/plain'
      }
    )
    res.end('BOSH session not found')
  }
}

BOSHServer.prototype._createSession = function (req, res, bodyEl) {
  /* No sid: create session */
  var self = this
  var session
  do {
    session = new BOSHServerSession({
      req: req,
      res: res,
      bodyEl: bodyEl
    })
  } while (this.sessions.hasOwnProperty(session.sid))
  this.sessions[session.sid] = session
    /* Hook for destruction */
  session.on('close', function () {
    delete self.sessions[session.sid]
  })

  // emit new connection
  var conn = new Connection({
    socket: session
  })

  this.emit('connect', conn)
}

module.exports = BOSHServer