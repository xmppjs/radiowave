'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('storage');

var Promise = require('rsvp').Promise;

var Room = require('./Room'),
    Channel = require('./Channel');

var User = function (username) {
    this.username = username;
    this.emails = [];
    this.rooms = {};
    this.channels = {};
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
User.prototype.rooms = function () {
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

User.prototype.createRoom = function (roomname) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (!self.rooms[roomname]) {
            logger.debug('create new room');
            self.rooms[roomname] = new Room(roomname);
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
            reject('room does not exist');
        }
    });
    return promise;
};

// Channels
User.prototype.channels = function () {
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

User.prototype.createChannel = function (channelname) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (!self.channels[channelname]) {
            logger.debug('create new channel');
            self.channels[channelname] = new Channel(channelname, self);
            resolve(self.channels[channelname]);
        } else {
            reject('channel exists');
        }
    });
    return promise;
};

// private delete method
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
        logger.debug(channel);

        if (channel !== undefined && channel !== null) {
            logger.debug('channel found');
            resolve(channel);
        } else {
            logger.debug('channel does not exists');
            reject('channel does not exist');
        }
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