'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('storage');

var Promise = require('rsvp').Promise;

var Room = function (name) {
    this.name = name;
    this.members = {};
    this.messages = [];
};

// Members
Room.prototype.listMembers = function () {
    var self = this;
    var promise = new Promise(function (resolve) {
        resolve(JSON.parse(JSON.stringify(self.members)));
    });
    return promise;
};
Room.prototype.addMember = function (jid, content) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (!self.members[jid]) {
            logger.debug('add member ' + jid + ' to room ' + self.name);
            self.members[jid] = content;
            resolve(self.members[jid]);
        } else {
            reject('member already exists');
        }
    });
    return promise;
};
Room.prototype.removeMember = function (jid) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (self.members[jid]) {
            logger.debug('remove member ' + jid + ' to room ' + self.name);
            delete self.members[jid];
            resolve();
        } else {
            reject('member does not exist');
        }
    });
    return promise;
};

Room.prototype.editMember = function (jid, content) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (self.members[jid]) {
            self.members[jid] = content;
            resolve(self.members[jid]);
        } else {
            reject('member does not exist');
        }
    });
    return promise;
};

// Messages
Room.prototype.listMessages = function () {
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

Room.prototype.createMessage = function (data) {
    var self = this;
    var promise = new Promise(function (resolve) {
        var id = self.messages.push(data);
        resolve(id - 1);
    });
    return promise;
};

Room.prototype.getMessage = function (id) {
    var self = this;
    var promise = new Promise(function (resolve) {
        resolve(self.messages[id]);
    });
    return promise;
};

Room.prototype.editMessage = function (id, data) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (id < self.messages.length) {
            self.messages[id] = data;
            resolve();
        } else {
            reject('id not found');
        }
    });
    return promise;
};

Room.prototype.removeMessage = function (id) {
    var self = this;
    var promise = new Promise(function (resolve) {
        // we cannot remove the entry, otherwise the index
        // would not work anymore
        self.messages[id] = null;
        resolve();
    });
    return promise;
};

module.exports = Room;