'use strict';
/**
 * Defines the subscriptions states as defined in RFC 3921 
 * @see  http://xmpp.org/rfcs/rfc3921.html#substates
 * @type all states
 */
var SubscriptionStates = {

    // contact and user are not subscribed to each other, and neither has 
    // requested a subscription from the other
    NONE: 'None',

    // contact and user are not subscribed to each other, and user has sent
    // contact a subscription request but contact has not replied yet
    NONE_PENDING_OUT : 'None + Pending Out',

    // contact and user are not subscribed to each other, and contact has 
    // sent user a subscription request but user has not replied yet 
    // (note: contact's server SHOULD NOT push or deliver roster items in 
    // this state, but instead SHOULD wait until contact has approved 
    // subscription request from user)
    NONE_PENDING_IN : 'None + Pending In',

    // contact and user are not subscribed to each other, contact has sent 
    // user a subscription request but user has not replied yet, and user 
    // has sent contact a subscription request but contact has not replied yet
    NONE_PENDING_IN_OUT : 'None + Pending Out/In',

    // user is subscribed to contact (one-way)
    TO : 'To',

    // user is subscribed to contact, and contact has sent user a subscription 
    // request but user has not replied yet
    TO_PENDING_IN : 'To + Pending In',

    // contact is subscribed to user (one-way)
    FROM : 'From',

    // contact is subscribed to user, and user has sent contact a subscription 
    // request but contact has not replied yet
    FROM_PENDING_OUT : 'From + Pending Out',

    // user and contact are subscribed to each other (two-way)
    BOTH : 'Both',
};

module.exports = SubscriptionStates;