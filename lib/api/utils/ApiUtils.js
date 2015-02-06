'use strict';

var JID = require('node-xmpp-core').JID,
  logger = require('../../core/Logger')('webapi'),
  url = require('url'),
  querystring = require('querystring'),
  Promise = require('bluebird'),
  _ = require('lodash');

function getJID(req) {
  logger.debug(JSON.stringify(req.user));
  return new JID(req.user.jid);
}

function exportJSON(model) {
  if (model instanceof Array) {
    var exportVal = [];
    model.forEach(function (item) {
      exportVal.push(exportJSON(item));
    });
    return exportVal;
  } else if (model && typeof (model.exportJSON) === 'function') {
    return model.exportJSON();
  } else {
    return model.toJSON();
  }
}

/**
 * req : http request
 * host: override http host (optional)
 */
function serverPath(req, host) {

  // determine request url
  var path = req.originalUrl;

  // remove first and last slash
  path = path.replace(/^\/|\/$/g, '');

  // calculate real request url
  var requrl = null;
  if (host) {
    requrl = url.resolve(host, path);
  } else {
    requrl = url.resolve(req.protocol + '://' + req.get('host'), path);
  }

  return requrl.replace(/\/$/, '');
}

// implement as promise
function roomToJSON(room, meetingsPath) {
  var jsonroom = room.exportJSON()
  if (jsonroom.owner && jsonroom.owner.jid) {
    var ownerUsername = new JID(jsonroom.owner.jid).getLocal(true).toString();
    jsonroom.url = url.resolve(meetingsPath, querystring.escape(ownerUsername) + '/' + querystring.escape(jsonroom.name));
  }
  return jsonroom
}

function roomsToJSON(rooms, meetingsPath) {

  // add owner and url to json output
  var jsons = [];

  // add owner to outout
  _.forEach(rooms, function (room) {
    try {
      jsons.push(roomToJSON(room, meetingsPath));
    } catch (e) {
      logger.error(e)
    }
  });

  return Promise.all(jsons);

}

module.exports = {
  getJID: getJID,
  exportJSON: exportJSON,
  serverPath: serverPath,
  roomToJSON: roomToJSON,
  roomsToJSON: roomsToJSON
};
