'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('storage');

var Promise = require('bluebird'),
    uuid = require('node-uuid');

var Channel = function (parent, owner, name, options) {

    this.options = options || {
        'xmppid': uuid.v4()
    };

    this.parent = parent;

    this.owner = owner;
    this.name = name;
    this.xmppid = this.options.xmppid;

    this.members = {};
    this.messages = [];
    this.fields = {};

    // set default configuration
    this.setConfiguration('pubsub#deliver_payloads', 1);
    this.setConfiguration('pubsub#deliver_notifications', 1);
    this.setConfiguration('pubsub#persist_items', 1);
    this.setConfiguration('pubsub#access_model', 'open');
    this.setConfiguration('pubsub#notify_delete', 1);
};

Channel.prototype.getName = function () {
    return this.name;
};

// Subscribers

// subscribe a user to the channel
Channel.prototype.subscribe = function (jid, content) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (!self.members[jid]) {
            logger.debug('add subscriber ' + jid + ' to channel ' + self.name);
            self.members[jid] = {
                'content': content
            };
            logger.debug(JSON.stringify(self.members));
            resolve(self.members[jid]);
        } else {
            reject('subscriber already exists');
        }
    });
    return promise;
};

// unsubscribe a user to the channel
Channel.prototype.unsubscribe = function (jid) {
    console.log('unsubscribe' + jid);
    console.log(JSON.stringify(this.members));
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (self.members[jid]) {
            logger.debug('remove subscriber ' + jid + ' to channel ' + self.name);
            delete self.members[jid];
            resolve();
        } else {
            reject('subscriber does not exist');
        }
    });
    return promise;
};

Channel.prototype.genSubscriberArray = function () {
    var members = [];
                
    for (var jid in this.members) {
        if (this.members.hasOwnProperty(jid)) {
            var member = this.members[jid];
            member.jid = jid;
            members.push(member);
        }
    }
    return members;
};

// list all active subscriber
Channel.prototype.listSubscribers = function () {
    logger.debug('list subscriber');
    var self = this;
    var promise = new Promise(function (resolve) {
        logger.debug('list members');
        resolve(self.genSubscriberArray());
    });
    return promise;
};

Channel.prototype.isSubscriber = function (jid) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (self.members[jid]) {
            resolve(true);
        } else {
            reject('subscriber does not exist');
        }
    });
    return promise;
};


// Event

// trigger a new event
// Note: The current implementation does not trigger
// anything. It will just store the message.
Channel.prototype.trigger = function (data) {
    var self = this;
    var promise = new Promise(function (resolve) {
        var id = self.messages.push(data);
        resolve(id - 1);
    });
    return promise;
};

// recieve all existing events
Channel.prototype.getEvents = function () {
    var self = this;
    var promise = new Promise(function (resolve) {
        // remove empty elements
        var clone = self.messages.filter(function (n) {
            return n;
        });
        resolve(clone);
    });
    return promise;
};

// recieve all existing events
Channel.prototype.remove = function () {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        console.log(self.getName());
        console.log(self.user);
        self.parent._deleteChannel(self.getName());
        resolve(true);
    });
    return promise;
};

// set a configuration value
Channel.prototype.setConfiguration = function (key, value) {
    this.fields[key] = value;
};

// retrieve a configuration value
Channel.prototype.getConfiguration = function (key) {
    return this.fields[key];
};

// toJSON
Channel.prototype.toJSON = function () {
    return {
        'owner' : this.owner,
        'name': this.getName(),
        'xmppid' : this.xmppid,
        'type' : 'channel',
        'members' : this.genSubscriberArray(),
        'messages': this.messages
    };
};

module.exports = Channel;