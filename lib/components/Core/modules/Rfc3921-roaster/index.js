'use strict';

var ltx = require('ltx'),
  util = require('util'),
  XModule = require('../../../../core/XModule'),
  JID = require('node-xmpp-core').JID,
  logger = require('../../../../core/Logger')('roaster');

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

  this.options = options;

  XModule.call(this);

  this.storage = options.storage;

  logger.info('load ' + this.name);
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
    logger.debug('detected roaster get request');
    return true;
  } else if (stanza.is('iq') && stanza.attrs.type === 'set' && (stanza.getChild('query', NS_ROASTER))) {
    logger.debug('detected roaster set request');
    return true;
  }
  return false;
};

Roaster.prototype.convertXMLtoJSON = function (xmlItem) {

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

  logger.debug('Converted ' + xmlItem.toString() + ' to ' + JSON.stringify(item));
      
  return item;
};

Roaster.prototype.convertJSONItemtoXML = function (item, xmlQuery) {
  var xitem = xmlQuery.c('item', {
    jid: item.jid,
    name: item.Roaster.name,
    subscription: item.Roaster.subscription
  });

  // iterate over group items
  if (item.Roaster.group) {
    try {
      var groups = JSON.parse(item.Roaster.group);
      for (var j = 0; j < groups.length; j++) {
        logger.debug(groups[j]);
        xitem.c('group').t(groups[j]);
      }
    } catch (err) {
      logger.warn(err);
    }
  }
}

Roaster.prototype.convertJSONtoXML = function (jsonList) {
  var query = new ltx.Element('query', {
    xmlns: NS_ROASTER
  });

  for (var i = 0; i < jsonList.length; i++) {
    this.convertJSONItemtoXML(jsonList[i], query);
  }

  logger.debug('Converted ' + jsonList.toString() + ' to ' + JSON.stringify(query));

  return query;
};

Roaster.prototype.generateRoasterResultMessage = function (params) {
  var roasterResult = new ltx.Element('iq', {
    from: params.to,
    to: params.from,
    id: params.id,
    type: 'result'
  });

  if (!params.list) {
    params.list = [];
  }

  roasterResult.cnode(this.convertJSONtoXML(params.list));
  return roasterResult;
}

/**
 * Returns the roaster list
 */
Roaster.prototype.handleGetRoaster = function (stanza) {
  logger.debug('handleGetRoaster ' + stanza.toString());
  var self = this;
  var storage = this.storage;

  var jid = new JID(stanza.attrs.from).bare();

  var transaction = null;
  var resultList = null;
  storage.sequelize.transaction().then(function (t) {
    transaction = t;
    return storage.findUser(jid.toString(), {
      transaction: transaction
    });
  }).then(function (user) {
    logger.debug('roaster user: ' + JSON.stringify(user));
    return user.getRoaster({
      transaction: transaction
    });
  }).then(function(list){
    resultList = list;
    return transaction.commit();
  }).then(function () {
    
    logger.debug('roaster entries: ' + JSON.stringify(resultList));

    var roasterResult = self.generateRoasterResultMessage({
      'from' : stanza.attrs.from, 
      'to' : stanza.attrs.to,
      'id' : stanza.attrs.id,
      'list' : resultList
    });
    
    logger.debug('send roaster to ' + stanza.attrs.from + ' ' + roasterResult.toString() );
    self.send(roasterResult);

  }).catch(function (err) {
    logger.warn(err);
    transaction.rollback();
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
    logger.error('jid not set for roaster item');
    return false;
  }
  return true;
};

/**
 * Updates a roaster item
 */
Roaster.prototype.handleUpdateRoasterItem = function (stanza, item) {
  logger.debug('handleUpdateRoasterItem ' + stanza.toString());
    var self = this;
    var storage = this.storage;

    var roasteritem = null;
    var transaction = null;
    var user = null;

    storage.sequelize.transaction().then(function (t) {
      transaction = t;

      var jid = new JID(stanza.attrs.from).bare();
      return storage.findUser(jid.toString(), {
        transaction: transaction
      })
    }).then(function (usr) {
      user = usr;

      if (!usr) {
        throw new Error('could not find user')
      }

      logger.debug(item.toString())
      roasteritem = self.convertXMLtoJSON(item);
      
      if (!self.verifyItem(roasteritem)) {
        throw new Error('roaster item not properly set');
      }
      
      // search friend
      return storage.findOrCreateUser(roasteritem.jid.toString(), {
        transaction: transaction
      })
    }).spread(function (friend, created) { // jshint ignore:line

      logger.debug(JSON.stringify(user))
      logger.debug(JSON.stringify(friend))

      if (!friend) {
        throw new Error('could not create the roaster jid');
      }
        
      // extract from roasteritem
      return user.addRoaster(friend, {
        name: roasteritem.name,
        group: roasteritem.group,
        subscription: 'none',
        transaction : transaction
      });
    }).then(function () {
      return transaction.commit();
    }).then(function () {
      self.sendSuccess(stanza);
    }).catch(function (err) {
      // lets catch error and respond with
      logger.warn(err);
      transaction.rollback();
      self.sendError(stanza);
    });
};

/**
 * Deletes a roaster item
 */
Roaster.prototype.handleDeleteRoasterItem = function (stanza, item) {
  logger.debug('handleDeleteRoasterItem ' + stanza.toString());

  var self = this;
  var storage = this.storage;
  var user, transaction = null;
  var dbopts = {};

  // TODO: search both user with one request
  // eg. find user with roasters and delete the specific roaster
  storage.sequelize.transaction().then(function (t) {
    transaction = t;
    dbopts = {
      transaction: transaction
    };

    var jid = new JID(stanza.attrs.from).bare();
    return storage.findUser(jid.toString(), dbopts)
  }).then(function (u) {
    user = u;
    if (user) {
      throw new Error('no user found');
    }

    var roasteritem = this.convertXMLtoJSON(item);

    if (!this.verifyItem(roasteritem)) {
      throw new Error('roaster item not properly set');
    }

    // search friend
    return storage.findOrCreateUser(roasteritem.jid.toString(), dbopts)
  }).then(function (friend) {

    if (!friend) {
      throw new Error('could not create the roaster jid');
    }

    // extract from roasteritem
    return user.removeRoaster(friend, dbopts)
  }).then(function () {
    self.sendSuccess(stanza);    
  }).catch(function (err) {
    logger.error(err);
    transaction.rollback();
    self.sendError(stanza);
  });
};

/** 
 * handles the component requests
 */
Roaster.prototype.handle = function (stanza) {

  // return roaster list
  if (stanza.attrs.type === 'get') {
    this.handleGetRoaster(stanza);
    return true;
  }
  // update or remove
  else if (stanza.attrs.type === 'set') {
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
