'use strict';

var util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xep-0060'),
    ltx = require('ltx'),
    Promise = require('bluebird'),
    XepComponent = require('../../XepComponent'),
    NS = require('../namespace'),
    uuid = require('node-uuid');

var NodeHandler = function (storage) {
    this.storage = storage;
};

util.inherits(NodeHandler, XepComponent);

NodeHandler.prototype.Error = {};
NodeHandler.prototype.Error.Conflict = ltx.parse('<error type=\'cancel\'><conflict xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');


/**
 * set one configuration in a channel
 */
NodeHandler.prototype.setConfiguration = function (node, key, value) {
    var self = this;
    return new Promise(function(resolve, reject) {
        node.getConfiguration({
            where : {
                key: key
            }
        }).success(function(conf) {
            if (conf && conf.length === 1) {
                var c = conf[0];
                c.value = value;
                c.save().success(resolve).error(reject);
            } else {
                self.storage.ChannelConf.create({ 
                    key: key,
                    value: value
                }).success(function(conf) {
                    node.addConfiguration(conf).success(resolve).error(reject);
                });
            }
        });
    });
};


/**
 * set the configuration into the node
 */
NodeHandler.prototype.configureNode = function (node, configuration) {
    logger.debug('configureNode' + node);
    var self = this;
    return new Promise(function(resolve, reject) {
        // no node found
        if (node) {
            var conf = configuration || [];

            var promisses = [];

            // overwrite configuration
            for (var j = 0; j < conf.length; j++) {
                logger.debug('set ' + node.name + ' key: ' + conf[j].key + ' ' + conf[j].value);
                promisses.push(self.setConfiguration(node, conf[j].key, conf[j].value));
            }

            Promise.all(promisses).then(resolve).catch(reject);

        } else {
            reject('node parameter is missing');
        }
    });
};

/**
 * extracts the configuration from a xml stanza
 */
NodeHandler.prototype.extractConfiguration = function (pubsubEl) {
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
    } catch(err){
        logger.error(err);
    }
    return configuration;
};


NodeHandler.prototype.findNode = function (nodename) {
    var self = this;
    return new Promise(function (resolve, reject) {
        self.storage.Channel.find({
            where: {
                name: nodename
            }
        }).success(function (channel) {
            console.log('Found channel: ' + channel);
            resolve(channel);
        }).error(function (err) {
            reject(err);
        });
    });
};

/**
 * finds or creates a node
 */
NodeHandler.prototype.findOrCreateNode = function (nodename, user) {
    var self = this;
    return new Promise(function (resolve, reject) {
        self.storage.Channel.findOrCreate({ name: nodename })
        .success(function(channel, created) {
            if (created) {
                self.associateUser(channel, user, []).then(function(){
                    console.log('Found channel: ' + channel);
                    resolve(channel);
                }).catch(function(err){
                    reject(err);
                });
            } else {
                resolve(channel);
            }
        }).error(function (err) {
            reject(err);
        });
    });
};

/**
 * assign a user to channel
 */
NodeHandler.prototype.associateUser = function (channel, user, configuration) {
    var self = this;
    return new Promise(function(resolve, reject) {
        // add assiciation between room and user
        user.addChannel(channel, {
            affiliation: self.storage.ChannelSub.Affiliation.Owner,
            substate: self.storage.ChannelSub.SubState.Member
        }).success(function () {
            console.log('start configuring node');
            self.configureNode(channel, configuration).then(function(){
                console.log('node configured');
                resolve(channel);
            }).catch(function(err){
                reject(err);
            });
        }).error(function (err) {
            reject(err);
        });
    });
};

/**
 * create a new node in our database
 */
NodeHandler.prototype.createNewNode = function (user, nodename, configuration) {
    logger.debug('create node ' + nodename +' with ' + JSON.stringify(configuration));
    var self = this;

    return new Promise(function(resolve, reject) {
        // create new room
        self.storage.Channel.create({
            name: nodename
        }).success(function (channel) {
            self.associateUser(channel, user, configuration).then(function(){
                resolve(channel);
            }).catch(function(err){
                reject(err);
            });
        }).error(function (err) {
            reject(err);
        });
    });
};

/**
 * handle xmpp create stanza for a user
 */
NodeHandler.prototype.handleCreate = function (user, stanza) {
    logger.debug('handleCreate');
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

    console.log('nodename: ' + nodename);

    var configuration = this.extractConfiguration(pubsub);
    console.log('configuration: ' + JSON.stringify(configuration));

    this.createNewNode(user, nodename, configuration).then(function(){
        self.sendSuccess(stanza, detail);
    }).catch(function(err){
        logger.error(err);
        console.error(err);
        self.sendError(stanza, self.Error.Conflict);
    });
};

/**
 * handle xmpp delete stanza
 */
NodeHandler.prototype.handleDelete = function (user, node, stanza) {
    logger.debug('handleDelete');

    // TODO verify that delete request is from owner

    var self = this;

    node.destroy().success(function() {
        logger.debug('node removed');
        self.sendSuccess(stanza);
    }).error(function(err){
        logger.debug('node could not be removed', err);
        self.sendError(stanza);
    });
};

module.exports = NodeHandler;