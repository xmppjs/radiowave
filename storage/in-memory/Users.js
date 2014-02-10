'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('storage');

var Promise = require('bluebird');

var Room = require('./Room'),
    Channel = require('./Channel'),
    Contact = require('./Contact');

var User = function (username) {
    this.username = username;

    // all emails of a user
    this.emails = [];

    // users contact
    this.contacts = {};

    // owned rooms
    this.rooms = {};

    // owned channels
    this.channels = {};
};

User.prototype.getName = function () {
    return this.username;
};

// Email
User.prototype.addEmail = function (email) {

    // TODO check the email is valid
    var self = this;
    var promise = new Promise(function (resolve) {
        logger.debug('add ' + email + ' to ' + self.username);
        if (self.emails.indexOf(email) === -1) {
            self.emails.push(email);
        }
        // otherwise it is already added, do nothing
        resolve();
    });
    return promise;
};

User.prototype.removeEmail = function (email) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        logger.debug('remove ' + email + ' to ' + self.username);
        var index = self.emails.indexOf(email);
        if (index === -1) {
            reject('email unknown');
        } else {
            // delete email
            self.emails.splice(index, 1);
        }
        // otherwise it is already added, do nothing
        resolve();
    });
    return promise;
};

User.prototype.listEmails = function () {
    var self = this;
    var promise = new Promise(function (resolve) {
        // clone array
        resolve(self.emails.slice(0));
    });
    return promise;
};

//  Rooms
User.prototype.listRooms = function () {
    var self = this;
    var promise = new Promise(function (resolve) {
        var rooms = [];
        for (var room in self.rooms) {
            if (self.rooms.hasOwnProperty(room)) {
                rooms.push(room);
            }
        }
        resolve(rooms);
    });
    return promise;
};

User.prototype.createRoom = function (roomname, options) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (!self.rooms[roomname]) {
            logger.debug('create new room');
            self.rooms[roomname] = new Room(self.getName(), roomname, options);
            resolve(self.rooms[roomname]);
        } else {
            reject('room exists');
        }
    });
    return promise;
};

User.prototype.getRoom = function (roomname) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        logger.debug('search ' + roomname);
        
        var room = self.rooms[roomname];
        logger.debug(room);
        if (room !== undefined && room !== null) {
            resolve(room);
        } else {
            logger.debug('room ' + roomname + ' does not exists');
            reject('room ' + roomname + ' does not exist');
        }
    });
    return promise;
};

// Channels
User.prototype.listChannels = function () {
    var self = this;
    var promise = new Promise(function (resolve) {
        var channels = [];
        for (var channel in self.channels) {
            if (self.channels.hasOwnProperty(channel)) {
                channels.push(channel);
            }
        }
        resolve(channels);
    });
    return promise;
};

User.prototype.createChannel = function (channelname, options) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (!self.channels[channelname]) {
            logger.debug('create new channel');
            self.channels[channelname] = new Channel(self, self.getName(), channelname, options);
            resolve(self.channels[channelname]);
        } else {
            reject('channel exists');
        }
    });
    return promise;
};

// private delete method, do not call this directly
User.prototype._deleteChannel = function (channelname) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (self.channels[channelname]) {
            delete self.channels[channelname];
            resolve(true);
        } else {
            reject(false);
        }
    });
    return promise;
};

User.prototype.getChannel = function (channelname) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        var channel = self.channels[channelname];
        if (channel !== undefined && channel !== null) {
            logger.debug('channel found: ' + channelname);
            resolve(channel);
        } else {
            logger.debug('channel ' + channelname + ' does not exists');
            reject('channel ' + channelname + ' does not exist');
        }
    });
    return promise;
};

// Contacts
User.prototype.addContact = function (jid, options) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (!self.contacts[jid]) {
            logger.debug('create new contact');
            self.contacts[jid] = new Contact(jid, options);
            resolve(self.contacts[jid]);
        } else {
            reject('contact exists');
        }
    });
    return promise;
};

// overwrite existing flag
User.prototype.addOrUpdateContact = function (jid, options) {
    var self = this;
    var promise = new Promise(function (resolve) {
        logger.debug('update contact');
        self.contacts[jid] = new Contact(jid, options);
        resolve(self.contacts[jid]);
    });
    return promise;
};

User.prototype.removeContact = function (jid) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (self.contacts[jid]) {
            delete self.contacts[jid];
            resolve(true);
        } else {
            reject(false);
        }
    });
    return promise;
};

User.prototype.getContact = function (jid) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (self.contacts[jid]) {
            resolve(self.contacts[jid]);
        } else {
            reject(null);
        }
    });
    return promise;
};

User.prototype.listContacts = function () {
    var self = this;
    var promise = new Promise(function (resolve) {
        var contacts = [];
        for (var contact in self.contacts) {
            if (self.contacts.hasOwnProperty(contact)) {
                contacts.push(self.contacts[contact]);
            }
        }
        resolve(contacts);
    });
    return promise;
};

// Users
var Users = function () {
    this.users = {};
};

Users.prototype.user = function (username) {
    var self = this;
    var promise = new Promise(function (resolve) {
        if (!self.users[username]) {
            self.users[username] = new User(username);
        }
        resolve(self.users[username]);
    });
    return promise;
};

module.exports = Users;