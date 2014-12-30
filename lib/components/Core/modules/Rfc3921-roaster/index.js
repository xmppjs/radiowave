'use strict';

var ltx = require('ltx'),
  util = require('util'),
  XModule = require('../../../../core/XModule'),
  JID = require('node-xmpp-core').JID;

var NS_ROASTER = 'jabber:iq:roster';

/*
 * RFC 3921: Roaster
 * http://xmpp.org/rfcs/rfc3921.html#roster
 */
function Roaster(options) {
  // initialize options
  if (!options) {
    options = {};
  }

  this.logger = require('../../../../core/Logger')('roaster');
  this.options = options;

  XModule.call(this);

  this.storage = options.storage;

  this.logger.info('load ' + this.name);
}
util.inherits(Roaster, XModule);

Roaster.prototype.name = 'RFC 3921: Roaster';
Roaster.prototype.version = '0.1.0';

Roaster.prototype.Error = {
  NotFound: ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>')
};

Roaster.prototype.initialize = function () {};

/*
 * Detects if the stanza is a roaster request
 *
 * Sample:
 * <iq from='juliet@example.com/balcony' type='get' id='roster_1'>
 *   <query xmlns='jabber:iq:roster'/>
 * </iq>
 */
Roaster.prototype.match = function (stanza) {
  if (stanza.is('iq') && stanza.attrs.type === 'get' && (stanza.getChild('query', NS_ROASTER))) {
    this.logger.debug('detected roaster get request');
    return true;
  } else if (stanza.is('iq') && stanza.attrs.type === 'set' && (stanza.getChild('query', NS_ROASTER))) {
    this.logger.debug('detected roaster set request');
    return true;
  }
  return false;
};

Roaster.prototype.convertXMLtoJSON = function (xmlItem) {
  this.logger.debug(xmlItem.root().toString());

  var item = {};
  // set jid
  item.jid = xmlItem.attrs.jid;

  // set name
  if (xmlItem.attrs.name) {
    item.name = xmlItem.attrs.name;
  }

  var groupItems = [];
  var groups = xmlItem.getChildren('group');
  for (var i = 0; i < groups.length; i++) {
    groupItems.push(groups[i].getText());
  }
  item.group = JSON.stringify(groupItems);

  this.logger.debug('ITEM:' + JSON.stringify(item));

  return item;
};

Roaster.prototype.convertJSONtoXML = function (jsonList) {
  var query = new ltx.Element('query', {
    xmlns: NS_ROASTER
  });

  for (var i = 0; i < jsonList.length; i++) {
    var item = jsonList[i];

    var xitem = query.c('item', {
      jid: item.jid,
      name: item.Roaster.name,
      subscription: item.Roaster.subscription
    });

    // iterate over group items
    if (item.Roaster.group) {
      try {
        var groups = JSON.parse(item.Roaster.group);
        for (var j = 0; j < groups.length; j++) {
          this.logger.debug(groups[j]);
          xitem.c('group').t(groups[j]);
        }
      } catch (err) {

      }
    }
  }
  return query;
};

/**
 * Returns the roaster list
 */
Roaster.prototype.handleGetRoaster = function (stanza) {
  this.logger.debug('handleGetRoaster ' + stanza.toString());
  var self = this;
  var jid = new JID(stanza.attrs.from).bare();

  // create user if required
  this.storage.findOrCreateUser(jid.toString())
    .then(function (user) {
      self.logger.debug('roaster user: ' + JSON.stringify(user));
      return user.getRoaster();
    }).then(function (list) {
      // send response
      self.logger.debug('roaster entries: ' + JSON.stringify(list));

      var roasterResult = new ltx.Element('iq', {
        from: stanza.attrs.to,
        to: stanza.attrs.from,
        id: stanza.attrs.id,
        type: 'result'
      });

      if (!list) {
        list = [];
      }

      roasterResult.cnode(self.convertJSONtoXML(list));
      self.logger.debug(roasterResult.toString());
      self.logger.debug('send roaster to ' + stanza.attrs.from);
      self.send(roasterResult);

    }).catch(function (err) {
      self.logger.warn(err);
      self.sendError(stanza);
    });
};

/**
 * Verifies a roaster item before we store it
 * @param  {[type]} item json roaster item
 * @return {[type]}      true if the item is okay
 */
Roaster.prototype.verifyItem = function (item) {
  if ((item === null) ||
    (item.jid === null) ||
    (item.jid === undefined)) {
    this.logger.error('jid not set');
    return false;
  }

  return true;
};

/**
 * Updates a roaster item
 */
Roaster.prototype.handleUpdateRoasterItem = function (stanza, item) {
  this.logger.debug('handleUpdateRoasterItem ' + stanza.toString());
  try {
    var self = this;
    var jid = new JID(stanza.attrs.from).bare();
    var roasteritem = this.convertXMLtoJSON(item);
    this.logger.debug(item.toString());
    this.logger.debug(JSON.stringify(roasteritem));

    if (!this.verifyItem(roasteritem)) {
      throw new Error('roaster item not properly set');
    }

    this.storage.findOrCreateUser(jid.toString())
      .spread(function (user, created) {
        if (user) {
          // search friend:
          self.storage.findOrCreateUser(
            roasteritem.jid.toString()
          ).spread(function (friend, created) {

            if (friend) {
              // extract from roasteritem
              user.addRoaster(friend, {
                name: roasteritem.name,
                group: roasteritem.group,
                subscription: 'none'
              }).success(function () {
                self.sendSuccess(stanza);
              });
            } else {
              self.sendError(stanza);
            }
          }).catch(function (err) {
            self.sendError(stanza);
          });

        } else {
          self.sendError(stanza);
        }

      }).catch(function (err) {
        // lets catch error and respond with
        self.logger.warn(err);
        self.sendError(stanza);
      });

  } catch (err) {
    self.sendError(stanza, err);
  }
};

/**
 * Deletes a roaster item
 */
Roaster.prototype.handleDeleteRoasterItem = function (stanza, item) {
  this.logger.debug('handleDeleteRoasterItem ' + stanza.toString());
  try {
    var self = this;
    var jid = new JID(stanza.attrs.from).bare();
    var roasteritem = this.convertXMLtoJSON(item);

    if (!this.verifyItem(roasteritem)) {
      throw new Error('roaster item not properly set');
    }

    this.storage.User.find({
      where: {
        jid: jid.toString()
      }
    }).success(function (user) {
      if (user) {
        // search friend:
        self.storage.User.find({
          where: {
            jid: roasteritem.jid
          }
        }).success(function (friend) {

          if (friend) {
            // extract from roasteritem
            user.removeRoaster(friend).success(function () {
              self.sendSuccess(stanza);
            });
          } else {
            self.sendError(stanza);
          }
        }).error(function (err) {
          self.logger.error(err);
          self.sendError(stanza);
        });

      } else {
        self.sendError(stanza);
      }
    }).error(function (err) {
      self.logger.error(err);
      self.sendError(stanza);
    });

  } catch (err) {
    self.sendError(stanza, err);
  }
};

/** 
 * handles the component requests
 */
Roaster.prototype.handle = function (stanza) {

  // return roaster list
  if (stanza.attrs.type === 'get') {
    this.handleGetRoaster(stanza);
    return true;
  } else if (stanza.attrs.type === 'set') {
    var query = stanza.getChild('query', NS_ROASTER);
    var item = query.getChild('item');

    // delete an item
    if (item.attrs.subscription === 'remove') {
      this.handleDeleteRoasterItem(stanza, item);
      return true;
    }
    // update an item
    else {
      this.handleUpdateRoasterItem(stanza, item);
      return true;
    }
  }

  return false;
};

module.exports = Roaster;
