'use strict';

/** 
 * Features implement functionality that is cannot be used 
 * standalone as a XEP-0114: Jabber Component and run on the 
 * same domain as the core server
 */
module.exports = {
    Rfc3921Messaging: require('./Rfc3921-messaging'),
    Rfc3921Roaster : require('./Rfc3921-roaster'),
    Xep0016 : require('./Xep0016-privacylist'),
    Xep0030 : require('./Xep0030-disco'),
    Xep0049 : require('./Xep0049-xmlstorage'),
    Xep0054 : require('./Xep0054-vcard'),
    Xep0092 : require('./Xep0092-version'),
    Xep0199 : require('./Xep0199-ping')
};