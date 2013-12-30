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

        return this.item.members;
    },

    getMembers: function () {
        var members = this.members();
        var member = null;
        var jids = [];
        for (member in members) {
            if (members.hasOwnProperty(member)) {
                jids.push(member);
            }
        }
        return jids;
    },

    join: function (jid, nickname) {
    	logger.debug("join " + jid + " for room " + this.name());
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

	leave: function (jid) {
		logger.debug("leave " + jid + " for room " + this.name());
        if (!(jid instanceof JID)) {
            // detected jid instance
            jid = new JID(jid);
        }

        // check that we have the bare jid
        jid = jid.bare();

        // leave
        var members = this.members();
        delete members[jid.toString()];
    },

    getNick : function (jid) {
        var members = this.members();
        var member = members[jid.toString()]

        if (member['nick']) {
            return member['nick'];
        } else {
             return null;
        }
    },

	countMembers: function() {
        var members = this.members();
        return Object.keys(members).length;
	},

    isMember: function(jid) {
        if (!(jid instanceof JID)) {
            // detected jid instance
            jid = new JID(jid);
        }

        var bare = jid.bare();

        var members = this.members();
        if (members[bare.toString()]) {
            return true;
        } else {
            return false;
        }
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
					callback(member);
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

module.exports = MucRoom;