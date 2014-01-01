'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('storage');

var Promise = require('rsvp').Promise;

var Channel = function (name) {
    this.name = name;
    this.members = {};
    this.messages = [];
};

// Subscribers
Channel.prototype.subscribe = function (jid, content) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (!self.members[jid]) {
            logger.debug('add subscriber ' + jid + ' to channel ' + self.name);
            self.members[jid] = content;
            logger.debug(JSON.stringify(self.members));
            resolve(self.members[jid]);
        } else {
            reject('subscriber already exists');
        }
    });
    return promise;
};

Channel.prototype.unsubscribe = function (jid) {
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

Channel.prototype.listSubscribers = function () {
    logger.debug('list subscriber');
    var self = this;
    var promise = new Promise(function (resolve) {
        resolve(JSON.parse(JSON.stringify(self.members)));
    });
    return promise;
};

// Event
Channel.prototype.trigger = function (data) {
    var self = this;
    var promise = new Promise(function (resolve) {
        var id = self.messages.push(data);
        resolve(id - 1);
    });
    return promise;
};

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

module.exports = Channel;