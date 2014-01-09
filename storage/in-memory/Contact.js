'use strict';

var Contact = function (jid, options) {
    var opt = options || {};

    this.cjid = jid;
    this.cname = opt.name || null;
    this.csubscription = opt.subscription || "none";
    this.cgroup = opt.groups || null;
};

Object.defineProperties(Contact.prototype, {
    "name": {
        get: function () {
            return this.cname;
        }
    },
    "jid": {
        get: function () {
            return this.cjid;
        }
    },
    "groups": {
        get: function () {
            return this.cgroup;
        }
    },
    "subscription": {
        get: function () {
            return this.csubscription;
        }
    },
});

module.exports = Contact;