'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('xep-0060'),
    ltx = require('ltx'),
    NS = require('./namespace'),
    JID = require('node-xmpp-core').JID,
    uuid = require('node-uuid');

var PubSub = function (sender, Users, Lookup) {
    this.sender = sender;

    this.Users = Users;
    this.Lookup = Lookup;
};

PubSub.prototype.configureNode = function (node, configuration, callback) {
    logger.debug('configureNode' + node);

    // no node found
    if (node) {
        // set default parameter
        node.setConfiguration('pubsub#deliver_payloads', 1);
        node.setConfiguration('pubsub#deliver_notifications', 1);
        node.setConfiguration('pubsub#persist_items', 1);
        node.setConfiguration('pubsub#access_model', 'open');
        node.setConfiguration('pubsub#notify_delete', 1);


        var conf = configuration || [];

        // overwrite configuration
        for (var j = 0; j < conf.length; j++) {
            logger.debug('set ' + node.getName() + ' key: ' + conf[j].key + ' ' + conf[j].value);
            node.setConfiguration(conf[j].key, conf[j].value);
        }

        callback();
    } else {
        callback('node parameter is missing');
    }
};

PubSub.prototype.createNode = function (user, nodename, configuration, callback) {
    logger.debug('createNode' + user + ' ' + nodename);
    var self = this;
    // channel does not exist
    user.createChannel(nodename).then(
        function (channel) {
            // store lookup
            self.Lookup.add('pubsub', user.getName(), nodename, nodename).then(function () {
                self.configureNode(channel, configuration, function () {
                    callback();
                });
            });
        }, function () {
            callback('could not create channel');
        }
    );
};

PubSub.prototype.handleCreate = function (stanza) {
    logger.debug('handleCreate');
    var self = this;
    var jid = new JID(stanza.attrs.from).bare();
    var pubsub = stanza.getChild('pubsub', NS.PUBSUB);
    var create = pubsub.getChild('create');
    var nodename = create.attrs.node;
    var detail = null;

    if (nodename === undefined) {
        nodename = null;
    }

    if (nodename === null) {
        // generate instant nodename
        nodename = uuid.v4();
        detail = new ltx.Element(
            'pubsub', {
                'xmlns': 'http://jabber.org/protocol/pubsub'
            }
        ).c(
            'create', {
                node: nodename
            }).up();
    }

    // if we found a node with this name, we cannot create it
    self.Lookup.find('pubsub', nodename).then(
        function () {
            // channel exists, error
            var errXml = ltx.parse('<error type=\'cancel\'><conflict xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
            self.sender.sendError(stanza, errXml);
        },
        function () {
            var username = jid.getLocal();

            // check if the room exists, if not create it
            self.Users.user(username).then(
                function (user) {
                    user.getChannel(nodename).then(
                        function () {
                            // channel exists, error
                            var errXml = ltx.parse('<error type=\'cancel\'><conflict xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
                            self.sender.sendError(stanza, errXml);
                        },
                        function () {
                            // create new node
                            // extract features
                            var configuration = [];
                            var configure = pubsub.getChild('configure');
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
                            logger.debug('create node with ' + JSON.stringify(configuration));
                            self.createNode(user, nodename, configuration, function () {
                                logger.debug('return from callback');
                                self.sender.sendSuccess(stanza, detail);
                            });
                        });
                });
        });
};


PubSub.prototype.handleDelete = function (node, stanza) {
    logger.debug('handleDelete');
    var self = this;
    logger.debug(stanza.root().toString());
    logger.debug(node);
    node.remove().then(
        function () {
            logger.debug('node removed');
            self.sender.sendSuccess(stanza);
        },
        function () {
            logger.debug('node could not be removed');
            self.sender.sendError(stanza);
        }
    );
};

module.exports = PubSub;