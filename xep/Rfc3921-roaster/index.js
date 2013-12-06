'use strict';

var ltx = require('ltx'),
    util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xepcomponent'),
    XepComponent = require('../XepComponent'),
    PostgreRoasterStore = require('./PostgreRoasterStore');

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

    // initialize storage options
    if (!options.storage) {
        options.storage = {};
    }

    XepComponent.call(this);
    this.roasterStorage = new this.RoasterStore(options.storage);
}
util.inherits(Roaster, XepComponent);

Roaster.prototype.name = 'RFC 3921: Roaster';

Roaster.prototype.RoasterStore = PostgreRoasterStore;

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


Roaster.prototype.convertXMLtoJSON = function (xmlList) {
    logger.debug(xmlList);
    return [];
};

Roaster.prototype.convertJSONtoXML = function (jsonList) {
    var query = new ltx.Element('query', {
        xmlns: NS_ROASTER
    });

    for (var i = 0; i < jsonList.length; i++) {
        var item = jsonList[i];

        var xitem = query.c('item', {
            jid: item.jid,
            name: item.name,
            subscription: item.subscription
        });

        // iterate over group items
        for (var j = 0; j < item.group; j++) {
            xitem.c('group').t(item.group[j]);
        }
    }

    return query;
};

Roaster.prototype.handle = function (stanza) {
    var self = this;

    /*
    <iq to='juliet@example.com/balcony' type='result' id='roster_1'>
      <query xmlns='jabber:iq:roster'>
        <item jid='romeo@example.net'
              name='Romeo'
              subscription='both'>
          <group>Friends</group>
        </item>
        <item jid='mercutio@example.org'
              name='Mercutio'
              subscription='from'>
          <group>Friends</group>
        </item>
        <item jid='benvolio@example.org'
              name='Benvolio'
              subscription='both'>
          <group>Friends</group>
        </item>
      </query>
    </iq>
     */
    if (stanza.attrs.type === 'get') {
        this.roasterStorage.list(stanza.attrs.from, function (err, list) {
            // got json list


            // send list

            var roasterResult = new ltx.Element('iq', {
                from: stanza.attrs.to,
                to: stanza.attrs.from,
                id: stanza.attrs.id,
                type: 'result'
            });

            roasterResult.cnode(self.convertJSONtoXML(list));

            logger.debug('send roaster to ' + stanza.attrs.from);
            self.send(roasterResult);

        });

    }
};

module.exports = Roaster;
