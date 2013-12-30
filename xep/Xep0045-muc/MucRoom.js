'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('xepcomponent'),
    JID = require('node-xmpp-core').JID;

/*
{
    "name" : "room1",
    "subdomain" : "chat",
    "members": {
        "romeo@example.net" : {
			"nick" : "romeo" 
        },
        "julia@example.net" : {
			"nick" : "julia"
        }
    },
    "fields" : {
        "muc#roomconfig_roomname" : "room title"
    }
}
*/
function MucRoom(item) {

	if ((item === null) ||  (!item.name) ||  (!item.subdomain)) {
        throw new Error('required node properties not set');
    }

    // stores the node description
    this.item = item;
}

MucRoom.prototype = {

	name : function () {
        return this.item.name;
    },

    subdomain : function () {
        return this.item.subdomain;
    },

    jid: function () {
        return new JID(this.name(), this.subdomain(), null);
    },

    // internal only
    members: function() {
        if (!this.item.members) {
            this.item.members = {};
        }

        return this.item.subscriptions;
    },

    join: function (jid, nickname) {
    	logger.debug("join " + jid + " for room " + this.id);
        if (!(jid instanceof JID)) {
            // detected jid instance
            jid = new JID(jid);
        }

        // check that we have the bare jid
        jid = jid.bare();

        // subscribe
        var members = this.members();
        members[jid.toString()] = {
        	nick : nickname
        };
        return true;
    },

	isSubscribed: function() {},

	leave: function (jid) {
		logger.debug("leave " + jid + " for room " + this.id);
        if (!(jid instanceof JID)) {
            // detected jid instance
            jid = new JID(jid);
        }

        // check that we have the bare jid
        jid = jid.bare();

        // unsubscribe
        logger.debug('unsubscribe ' + jid + ' for node ' + this.id);
        var members = this.members();
        delete members[jid.toString()];
    },


	countMembers: function() {
        var members = this.members();
        return Object.keys(members).length;
	},

	/**
	 * This is used to store more nicks than members. Here we store nicks of other nodes,
	 * but they are not members on this node
	 */
	addNick: function(jid, nickname) {
		this.nicks[jid] = nickname;
	},

	getNick: function(jid) {
		return this.nicks[jid];
	},

	removeNick: function(jid, nickname) {
		delete this.nicks[jid];
	},

	/**
	 * [eachMember description]
	 * @param  {Function} callback is called for each member
	 * @param  {[String]}   filter   a jid that should not be called e.g. sender of message
	 */
	eachMember: function(callback, filter) {
		var member;
		if (callback) {
			for (member in this.members) {
				if (this.members.hasOwnProperty(member) && member !== filter) {
					console.log("mem:" + JSON.stringify(member));
					callback(member);
				}
			}
		}
	},

	eachMessage: function(callback) {
		var i, l, el;
		if (callback) {
			for (i = 0, l = this.messages.length; i < l; i += 1) {
				// extract message
				el = ltx.parse(this.messages[i]);
				callback(el);
			}
		}
	},

	addMessage: function(msg)  {
		// store message in history
		// implement storage filter
		this.messages.push(msg.toString());
	},

	setConfiguration: function(key, value) {
		this.configuration[key] = value;
	},

	getConfiguration: function(key) {
		return this.configuration[key];
	},

	/**
	 * Check whether the given JID is allowed to perform the requested task.
	 * @param sender
	 * @param requestedAffiliation
	 * @return
	 */
	isAuthorized: function() {},

	/**
	 * Adds the given entity to the owner list.
	 *
	 * @param owner
	 */
	setAffiliation: function() {},

	/**
	 * Returns the affiliation for the given bareJID.
	 * @param entity the entity for which the affiliation should be returned.
	 * @return All affiliations ("NONE" if no other affiliation is known).
	 */
	getAffiliation: function(jid) {},

    getRoomDescription: function () {
        return this.item;
    }
};