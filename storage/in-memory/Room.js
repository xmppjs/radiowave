'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('storage');

var Promise = require('bluebird'),
    uuid = require('node-uuid');

// muc roles
var MUC_ROLE_MODERATOR = 'moderator',
    MUC_ROLE_NONE = 'none',
    MUC_ROLE_PARTICIPANT = 'participant',
    MUC_ROLE_VISITOR = 'visitor',

    // affiliation
    MUC_AFFILIATION_OWNER = 'owner',
    MUC_AFFILIATION_ADMIN = 'admin',
    MUC_AFFILIATION_MEMBER = 'member',
    MUC_AFFILIATION_OUTCAST = 'outcast',
    MUC_AFFILIATION_NONE = 'none';

var Room = function (owner, name, options) {
    this.options = options || {
        'xmppid': uuid.v4()
    };

    this.owner = owner;
    this.name = name;
    this.xmppid = this.options.xmppid;

    this.members = {};
    this.messages = [];
};

Room.prototype.getName = function () {
    return this.name;
};

Room.prototype.getOwner = function () {
    return this.owner;
};

// Members

/**
 * A sample output will look like
 *    [{
 *        "jid": "earlofcambridge@shakespeare.lit",
 *        "affiliation": {
 *            "type": "outcast",
 *            "reason": "Treason"
 *        }
 *        // no role at outcast members
 *    }, {
 *        "jid": "hag66@ shakespeare.lit",
 *        "affiliation": {
 *            "type": "member",
 *            "reason": "A worthy witch indeed!",
 *            "nick": "thirdwitch "
 *        },
 *        "role": {
 *            "type ": "moderator"
 *        },
 *        "status ": {
 *            "type" : "unavailable",
 *            "message ": "gone where the goblins go"
 *        },
 *        "content" : {}
 *    }]
 */
Room.prototype.listMembers = function () {
    var self = this;
    var promise = new Promise(function (resolve) {
        logger.debug('list members');
        var members = [];

        for (var jid in self.members) {
            if (self.members.hasOwnProperty(jid)) {
                var member = self.members[jid];
                member.jid = jid;
                members.push(member);
            }
        }

        resolve(members);
    });
    return promise;
};

/**
 * Only the content of the user can be overridden with this method.
 * Affiliations and roles need to be manipulated with the proper method.
 */
Room.prototype.addMember = function (jid, content) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (!self.members[jid]) {
            logger.debug('add member ' + jid + ' to room ' + self.name);
            self.members[jid] = {
                'content': content
            };
            resolve(self.members[jid]);
        } else {
            reject('member already exists');
        }
    });
    return promise;
};

Room.prototype.getMember = function (jid) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (self.members[jid]) {
            resolve(self.members[jid]);
        } else {
            reject('member does not exist');
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
            self.members[jid].content = content;
            resolve(self.members[jid]);
        } else {
            reject('member does not exist');
        }
    });
    return promise;
};

Room.prototype.isMember = function (jid) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        if (self.members[jid]) {
            resolve(true);
        } else {
            reject('member does not exist');
        }
    });
    return promise;
};

// Presence in room
Room.prototype.join = function (jid, nickname) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {

        // every user that joins is required to be a member

        // okay. user exits
        var member = self.members[jid];

        if (member) {
            // set presence status
            if (!member.status) {
                member.status = {};
            }
            member.status = 'available';

            // set nickname
            if (!member.affiliation) {
                member.affiliation = {};
            }
            member.affiliation.nickname = nickname;

            resolve(true);
        } else {
            reject('user is not member of this room');
        }
    });
    return promise;
};

Room.prototype.leave = function (jid) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {

        self.isMember(jid).then(
            function () {
                // okay. user exits
                var member = self.members[jid];

                // set presence status
                if (!member.status) {
                    member.status = {};
                }
                member.status = 'unavailable';

                resolve(member);
            }).
        catch (function (err) {
            reject(err);
        });
    });
    return promise;
};

Room.prototype.getNickname = function (jid) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {

        this.isMember(jid).then(
            function () {
                // okay. user exits
                var member = self.members[jid];

                resolve(member.affiliation.nickname);
            }, function (err) {
                reject(err);
            });
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

// Affiliations
Room.prototype.listAffiliations = function (affiliationtype) {
    logger.debug('listAffiliations');
    var self = this;
    var promise = new Promise(function (resolve) {
        var affiliations = [];

        for (var jid in self.members) {
            if (self.members.hasOwnProperty(jid)) {
                var member = self.members[jid];
                logger.debug(JSON.stringify(member));

                if (member.affiliation && member.affiliation.type === affiliationtype) {
                    var item = {};
                    item.jid = jid;
                    item.affiliation = member.affiliation;
                    if (item.affiliation && item.affiliation.nickname) {
                        delete item.affiliation.nickname;
                    }
                    affiliations.push(item);
                }
            }
        }
        resolve(affiliations);
    });
    return promise;
};

Room.prototype.getAffiliation = function (jid) {
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        var member = self.members[jid];
        if (member) {
            if (member.affiliation) {
                var affiliation = {};
                affiliation.jid = jid;
                affiliation.affiliation = member.affiliation;
                resolve(affiliation);
            } else {
                // This should not happen
                logger.error('could not find affiliation for existing user');
                reject('could not find affiliation for existing user');
            }
        } else {
            reject('member does not exist');
        }
    });
    return promise;
};

Room.prototype.editAffiliation = function (jid, options) {
    logger.debug('editAffiliation');
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        var member = self.members[jid];
        if (member) {
            if (!member.affiliation) {
                member.affiliation = {};
            }

            // set properties
            member.affiliation.type = options.type;
            if (options.reason) {
                member.affiliation.reason = options.reason;
            }

            resolve(member);
        } else {
            reject('member does not exist');
        }
    });
    return promise;
};

Room.prototype.setOwner = function (userjid) {
    logger.debug('set owner ' + userjid);
    var self = this;
    return new Promise(function (resolve, reject) {
        self.editAffiliation(userjid, {
            'type': MUC_AFFILIATION_OWNER,
            'reason': 'Created the room.'
        }).then(function () {
            return self.editRole(userjid, {
                'type': MUC_ROLE_MODERATOR
            });
        }).then(function () {
            resolve();
        }).
        catch (function (err) {
            reject(err);
        });
    });
};

Room.prototype.setMember = function (userjid) {
    logger.debug('set member ' + userjid);
    var self = this;
    return new Promise(function (resolve, reject) {
        self.editAffiliation(userjid, {
            'type': MUC_AFFILIATION_MEMBER,
            'reason': 'Created the room.'
        }).then(function () {
            return self.editRole(userjid, {
                'type': MUC_ROLE_PARTICIPANT
            });
        }).then(function () {
            resolve();
        }).
        catch (function (err) {
            reject(err);
        });
    });
};


Room.prototype.editRole = function (jid, options) {
    logger.debug('editRole');
    var self = this;
    var promise = new Promise(function (resolve, reject) {
        var member = self.members[jid];
        if (member) {
            if (!member.role) {
                member.role = {};
            }

            // set properties
            member.role.type = options.type;

            resolve(member);
        } else {
            reject('member does not exist');
        }
    });
    return promise;
};

Room.prototype.toJSON = function () {
    return {
        'owner': this.owner,
        'name': this.name,
        'xmppid': this.xmppid,
        'type': 'room'
    };
};

module.exports = Room;