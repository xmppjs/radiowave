'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('xepcomponent'),
    JID = require('node-xmpp-core').JID;


/*
{
    "name" : "nodename",
    "subdomain" : "pubsub",
    "subscription": {
        "romeo@example.net" : "",
        "julia@example.net" : ""
    },
    "fields" : {
        "pubsub#title" : "pubsub title",
        "pubsub#description" : "pubsub description"
    }
}
*/
function PubSubNode(item) {

    if ((item === null) ||  (!item.name) ||  (!item.subdomain)) {
        throw new Error('required node properties not set');
    }

    // stores the node description
    this.item = item;
}

PubSubNode.prototype = {

    name : function () {
        return this.item.name;
    },

    subdomain : function () {
        return this.item.subdomain;
    },

    jid: function () {
        return new JID(null, this.domain, null);
    },

    // internal only
    subscriptions: function() {
        if (!this.item.subscriptions) {
            this.item.subscriptions = {};
        }

        return this.item.subscriptions;
    },

    getSubscriptions: function () {
        var subs = this.subscriptions();
        var sub = null;
        var jids = [];
        for (sub in subs) {
            if (subs.hasOwnProperty(sub)) {
                jids.push(sub);
            }
        }
        return jids;
    },

    subscribe: function (jid) {
        if (!(jid instanceof JID)) {
            // detected jid instance
            jid = new JID(jid);
        }

        // check that we have the bare jid
        jid = jid.bare();

        // subscribe
        logger.debug('subscribe ' + jid + ' for node ' + this.id);
        var subs = this.subscriptions();
        subs[jid.toString()] = true;
        return true;
    },

    isSubscribed: function (jid) {
        if (!(jid instanceof JID)) {
            // detected jid instance
            jid = new JID(jid);
        }

        var bare = jid.bare();

        var subs = this.subscriptions();
        if (subs[bare.toString()] === true) {
            return true;
        } else {
            return false;
        }
    },

    unsubscribe: function (jid) {
        if (!(jid instanceof JID)) {
            // detected jid instance
            jid = new JID(jid);
        }

        // check that we have the bare jid
        jid = jid.bare();

        // unsubscribe
        logger.debug('unsubscribe ' + jid + ' for node ' + this.id);
        var subs = this.subscriptions();
        delete subs[jid.toString()];
    },

    countSubscriptions: function () {
        var subs = this.subscriptions();
        return Object.keys(subs).length;
    },

    eachSubscriber: function (callback) {
        var sub;
        if (callback) {
            var subs = this.subscriptions();
            for (sub in subs) {
                if (subs.hasOwnProperty(sub)) {
                    callback(sub);
                }
            }
        }
    },

    setConfiguration: function (key, value) {
        if (!this.item.fields) {
            this.item.fields = {};
        }
        this.item.fields[key] = value;
    },

    getConfiguration: function (key) {
        if (!this.item.fields) {
            this.item.fields = {};
        }
        return this.item.fields[key];
    },

    /**
     * Check whether the given JID is allowed to perform the requested task.
     * @param sender
     * @param requestedAffiliation
     * @return
     */
    isAuthorized: function () {},

    /**
     * Adds the given entity to the owner list.
     *
     * @param owner
     */
    setAffiliation: function () {},

    /**
     * Returns the affiliation for the given bareJID.
     * @param entity the entity for which the affiliation should be returned.
     * @return All affiliations ("NONE" if no other affiliation is known).
     */
    getAffiliation: function () {},

    getNodeDescription: function () {
        return this.item;
    }
};

module.exports = PubSubNode;