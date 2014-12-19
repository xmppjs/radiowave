'use strict';

var util = require('util'),
    ltx = require('ltx'),
    Promise = require('bluebird'),
    XModule = require('../../../core/XModule'),
    NS = require('../namespace'),
    JID = require('node-xmpp-core').JID,
    uuid = require('node-uuid'),
    pubutil = require('../Util');

/**
 * Implements the owner use cases
 * @see http://www.xmpp.org/extensions/xep-0060.html#owner
 */
var Owner = function (storage, options) {
    XModule.call(this);
    this.logger = require('../../../core/Logger')('xep-0060:owner');

    // storage
    this.storage = storage;

    // pubsub options
    this.options = options;
};

util.inherits(Owner, XModule);

Owner.prototype.name = 'XEP-0060: Owner';

Owner.prototype.match = function (stanza) {
    // owner requests
    return (stanza.is('iq') && stanza.getChild('pubsub', NS.PUBSUB) && stanza.getChild('pubsub', NS.PUBSUB).getChild('create')) ||
    // configure requests
    (stanza.is('iq') && stanza.getChild('pubsub', NS.PUBSUB_OWNER) && stanza.getChild('pubsub', NS.PUBSUB_OWNER).getChild('delete'));
};

/**
 * set one configuration in a channel
 */
Owner.prototype.setConfiguration = function (node, key, value) {
    var self = this;
    return new Promise(function (resolve, reject) {
        node.getConfigurations({
            where: {
                key: key
            }
        }).then(function (conf) {
            if (conf && conf.length === 1) {
                var c = conf[0];
                c.value = value;
                c.save().then(resolve).catch(reject);
            } else {
                self.storage.ChannelConf.create({
                    key: key,
                    value: value
                }).then(function (conf) {
                    node.addConfiguration(conf).then(resolve).catch(reject);
                });
            }
        });
    });
};


/**
 * set the configuration into the node
 */
Owner.prototype.configureNode = function (node, configuration) {
    this.logger.debug('configureNode' + node);
    var self = this;
    return new Promise(function (resolve, reject) {
        // no node found
        if (node) {
            var conf = configuration || [];

            var promisses = [];

            // overwrite configuration
            for (var j = 0; j < conf.length; j++) {
                self.logger.debug('set ' + node.name + ' key: ' + conf[j].key + ' ' + conf[j].value);
                promisses.push(self.setConfiguration(node, conf[j].key, conf[j].value));
            }

            return Promise.all(promisses);

        } else {
            reject('node parameter is missing');
        }
    });
};

/**
 * extracts the configuration from a xml stanza
 */
Owner.prototype.extractConfiguration = function (pubsubEl) {
    var configuration = [];
    try {
        // extract configuration
        var configure = pubsubEl.getChild('configure');
        if (configure) {
            var x = configure.getChild('x', 'jabber:x:data');
            if (x) {
                var fields = x.getChildren('field');
                for (var i = 0, l = fields.length; i < l; i++) {
                    configuration.push({
                        key: fields[i].attrs['var'],
                        value: fields[i].getChild('value').text()
                    });
                }
            }
        }
    } catch (err) {
        this.logger.error(err);
    }
    return configuration;
};

/**
 * assign a user to channel
 */
Owner.prototype.associateUser = function (channel, user, configuration) {
    var self = this;
    return new Promise(function (resolve, reject) {
        // add assiciation between room and user
        user.addChannel(channel, {
            affiliation: self.storage.ChannelSub.Affiliation.Owner,
            substate: self.storage.ChannelSub.SubState.Member
        }).then(function () {
            self.logger.debug('start configuring node');
            return self.configureNode(channel, configuration).then(function () {
                self.logger.debug('node configured');
                resolve(channel);
            })
        }).catch(function (err) {
            reject(err);
        });
    });
};

/**
 * create a new node in our database
 */
Owner.prototype.createNewNode = function (user, nodename, configuration) {
    this.logger.debug('create node ' + nodename + ' with ' + JSON.stringify(configuration));
    var self = this;

    return new Promise(function (resolve, reject) {
        // create new room
        self.storage.Channel.create({
            name: nodename
        }).then(function (channel) {
            return self.associateUser(channel, user, configuration).then(function () {
                resolve(channel);
            })
        }).catch(function (err) {
            reject(err);
        });
    });
};

/**
 * handle xmpp create stanza for a user
 */
Owner.prototype.handleCreate = function (user, stanza) {
    this.logger.debug('handleCreate');
    var self = this;
    var detail = null;

    // extract nodename
    var pubsub = stanza.getChild('pubsub', NS.PUBSUB);
    var create = pubsub.getChild('create');
    var nodename = create.attrs.node;

    if (nodename === undefined) {
        nodename = null;
    }

    // generate instant nodename
    if (nodename === null) {
        nodename = uuid.v4();

        // generate response message
        detail = new ltx.Element(
            'pubsub', {
                'xmlns': 'http://jabber.org/protocol/pubsub'
            }
        ).c(
            'create', {
                node: nodename
            }).up();
    }

    this.logger.debug('nodename: ' + nodename);

    var configuration = this.extractConfiguration(pubsub);
    this.logger.debug('configuration: ' + JSON.stringify(configuration));

    this.createNewNode(user, nodename, configuration).then(function () {
        self.sendSuccess(stanza, detail);
    }).
    catch (function (err) {
        self.logger.error(err);
        self.sendError(stanza, pubutil.Error.Conflict);
    });
};

/**
 * handle xmpp delete stanza
 */
Owner.prototype.handleDelete = function (user, node, stanza) {
    this.logger.debug('handleDelete');

    // TODO verify that delete request is from owner

    var self = this;

    node.destroy().then(function () {
        self.logger.debug('node removed');
        self.sendSuccess(stanza);
    }).catch(function (err) {
        self.logger.debug('node could not be removed', err);
        self.sendError(stanza);
    });
};

Owner.prototype.handle = function (stanza) {

    var pubsub = stanza.getChild('pubsub', NS.PUBSUB);

    if (!pubsub) {
        pubsub = stanza.getChild('pubsub', NS.PUBSUB_OWNER);
    }

    // detect method
    var method, pubsubEl = null;
    if (pubsub.getChild('create')) {
        method = 'create';
        pubsubEl = pubsub.getChild('create');
    } else if (pubsub.getChild('delete', NS.PUBSUB_OWNER)) {
        method = 'delete';
        pubsubEl = pubsub.getChild('delete');
    }

    // process
    var self = this;
    var fromJid = new JID(stanza.attrs.from).bare().toString();
    this.storage.findOrCreateUser(fromJid).then(function (user) {
        // detect node name
        var nodename = pubsubEl.attrs.node;
        self.logger.debug('nodename: ' + nodename);

        // okay, we have the user
        switch (method) {
        case 'create':
            self.handleCreate(user, stanza, pubsubEl);
            break;

        case 'delete':
            pubutil.findChannel(self.storage, nodename, user, false).then(function (node) {
                self.logger.debug('found: ' + node);
                if (node) {
                    self.handleDelete(user, node, stanza, pubsubEl);
                } else {
                    self.sendError(stanza, pubutil.Error.NotFound);
                }
            });
            break;
        default:
            self.sendError(stanza, pubutil.Error.NotFound);
        }

    });

    return true;
};

module.exports = Owner;
