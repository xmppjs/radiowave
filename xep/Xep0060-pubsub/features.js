'use strict';
// Generated with xRocket. Please change the feature.xml file and run grunt generate:features

var Features = {

    /**
     * @description The default node access model is authorize.
     * @see XEP-0060
     */
    ACCESS_AUTHORIZE: {
        "name": "http://jabber.org/protocol/pubsub#access-authorize",
        "desc": "The default node access model is authorize.",
        "doc": "XEP-0060"
    },

    /**
     * @description The default node access model is open.
     * @see XEP-0060
     */
    ACCESS_OPEN: {
        "name": "http://jabber.org/protocol/pubsub#access-open",
        "desc": "The default node access model is open.",
        "doc": "XEP-0060"
    },

    /**
     * @description The default node access model is presence.
     * @see XEP-0060
     */
    ACCESS_PRESENCE: {
        "name": "http://jabber.org/protocol/pubsub#access-presence",
        "desc": "The default node access model is presence.",
        "doc": "XEP-0060"
    },

    /**
     * @description The default node access model is roster.
     * @see XEP-0060
     */
    ACCESS_ROSTER: {
        "name": "http://jabber.org/protocol/pubsub#access-roster",
        "desc": "The default node access model is roster.",
        "doc": "XEP-0060"
    },

    /**
     * @description The default node access model is whitelist.
     * @see XEP-0060
     */
    ACCESS_WHITELIST: {
        "name": "http://jabber.org/protocol/pubsub#access-whitelist",
        "desc": "The default node access model is whitelist.",
        "doc": "XEP-0060"
    },

    /**
     * @description The service supports automatic creation of nodes on first publish.
     * @see XEP-0060
     */
    AUTO_CREATE: {
        "name": "http://jabber.org/protocol/pubsub#auto-create",
        "desc": "The service supports automatic creation of nodes on first publish.",
        "doc": "XEP-0060"
    },

    /**
     * @description The service supports automatic subscription to a nodes based on presence subscription.
     * @see XEP-0060
     */
    AUTO_SUBSCRIBE: {
        "name": "http://jabber.org/protocol/pubsub#auto-subscribe",
        "desc": "The service supports automatic subscription to a nodes based on presence subscription.",
        "doc": "XEP-0060"
    },

    /**
     * @description Collection nodes are supported.
     * @see XEP-0248
     */
    COLLECTIONS: {
        "name": "http://jabber.org/protocol/pubsub#collections",
        "desc": "Collection nodes are supported.",
        "doc": "XEP-0248"
    },

    /**
     * @description Configuration of node options is supported.
     * @see XEP-0060
     */
    CONFIG_NODE: {
        "name": "http://jabber.org/protocol/pubsub#config-node",
        "desc": "Configuration of node options is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Simultaneous creation and configuration of nodes is supported.
     * @see XEP-0060
     */
    CREATE_AND_CONFIGURE: {
        "name": "http://jabber.org/protocol/pubsub#create-and-configure",
        "desc": "Simultaneous creation and configuration of nodes is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Creation of nodes is supported.
     * @see XEP-0060
     */
    CREATE_NODES: {
        "name": "http://jabber.org/protocol/pubsub#create-nodes",
        "desc": "Creation of nodes is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Deletion of items is supported.
     * @see XEP-0060
     */
    DELETE_ITEMS: {
        "name": "http://jabber.org/protocol/pubsub#delete-items",
        "desc": "Deletion of items is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Deletion of nodes is supported.
     * @see XEP-0060
     */
    DELETE_NODES: {
        "name": "http://jabber.org/protocol/pubsub#delete-nodes",
        "desc": "Deletion of nodes is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description The service supports filtering of notifications based on Entity Capabilities.
     * @see XEP-0060
     */
    FILTERED_NOTIFICATIONS: {
        "name": "http://jabber.org/protocol/pubsub#filtered-notifications",
        "desc": "The service supports filtering of notifications based on Entity Capabilities.",
        "doc": "XEP-0060"
    },

    /**
     * @description Retrieval of pending subscription approvals is supported.
     * @see XEP-0060
     */
    GET_PENDING: {
        "name": "http://jabber.org/protocol/pubsub#get-pending",
        "desc": "Retrieval of pending subscription approvals is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Creation of instant nodes is supported.
     * @see XEP-0060
     */
    INSTANT_NODES: {
        "name": "http://jabber.org/protocol/pubsub#instant-nodes",
        "desc": "Creation of instant nodes is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Publishers may specify item identifiers.
     * @see XEP-0060
     */
    ITEM_IDS: {
        "name": "http://jabber.org/protocol/pubsub#item-ids",
        "desc": "Publishers may specify item identifiers.",
        "doc": "XEP-0060"
    },

    /**
 * @description 
    The service supports sending of the last published item to new 
    subscribers and to newly available resources.
  
 * @see XEP-0060
 */
    LAST_PUBLISHED: {
        "name": "http://jabber.org/protocol/pubsub#last-published",
        "desc": "\n    The service supports sending of the last published item to new \n    subscribers and to newly available resources.\n  ",
        "doc": "XEP-0060"
    },

    /**
     * @description Time-based subscriptions are supported.
     * @see XEP-0060
     */
    LEASED_SUBSCRIPTION: {
        "name": "http://jabber.org/protocol/pubsub#leased-subscription",
        "desc": "Time-based subscriptions are supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Node owners may manage subscriptions.
     * @see XEP-0060
     */
    MANAGE_SUBSCRIPTIONS: {
        "name": "http://jabber.org/protocol/pubsub#manage-subscriptions",
        "desc": "Node owners may manage subscriptions.",
        "doc": "XEP-0060"
    },

    /**
     * @description The member affiliation is supported.
     * @see XEP-0060
     */
    MEMBER_AFFILIATION: {
        "name": "http://jabber.org/protocol/pubsub#member-affiliation",
        "desc": "The member affiliation is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Node meta-data is supported.
     * @see XEP-0060
     */
    META_DATA: {
        "name": "http://jabber.org/protocol/pubsub#meta-data",
        "desc": "Node meta-data is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Node owners may modify affiliations.
     * @see XEP-0060
     */
    MODIFY_AFFILIATIONS: {
        "name": "http://jabber.org/protocol/pubsub#modify-affiliations",
        "desc": "Node owners may modify affiliations.",
        "doc": "XEP-0060"
    },

    /**
     * @description A single leaf node can be associated with multiple collections.
     * @see XEP-0060
     */
    MULTI_COLLECTION: {
        "name": "http://jabber.org/protocol/pubsub#multi-collection",
        "desc": "A single leaf node can be associated with multiple collections.",
        "doc": "XEP-0060"
    },

    /**
     * @description A single entity may subscribe to a node multiple times.
     * @see XEP-0060
     */
    MULTI_SUBSCRIBE: {
        "name": "http://jabber.org/protocol/pubsub#multi-subscribe",
        "desc": "A single entity may subscribe to a node multiple times.",
        "doc": "XEP-0060"
    },

    /**
     * @description The outcast affiliation is supported.
     * @see XEP-0060
     */
    OUTCAST_AFFILIATION: {
        "name": "http://jabber.org/protocol/pubsub#outcast-affiliation",
        "desc": "The outcast affiliation is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Persistent items are supported.
     * @see XEP-0060
     */
    PERSISTENT_ITEMS: {
        "name": "http://jabber.org/protocol/pubsub#persistent-items",
        "desc": "Persistent items are supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Presence-based delivery of event notifications is supported.
     * @see XEP-0060
     */
    PRESENCE_NOTIFICATIONS: {
        "name": "http://jabber.org/protocol/pubsub#presence-notifications",
        "desc": "Presence-based delivery of event notifications is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Implicit presence-based subscriptions are supported.
     * @see XEP-0060
     */
    PRESENCE_SUBSCRIBE: {
        "name": "http://jabber.org/protocol/pubsub#presence-subscribe",
        "desc": "Implicit presence-based subscriptions are supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Publishing items is supported.
     * @see XEP-0060
     */
    PUBLISH: {
        "name": "http://jabber.org/protocol/pubsub#publish",
        "desc": "Publishing items is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Publication with publish options is supported.
     * @see XEP-0060
     */
    PUBLISH_OPTIONS: {
        "name": "http://jabber.org/protocol/pubsub#publish-options",
        "desc": "Publication with publish options is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description The publish-only affiliation is supported.
     * @see XEP-0060
     */
    PUBLISH_ONLY_AFFILIATION: {
        "name": "http://jabber.org/protocol/pubsub#publish-only-affiliation",
        "desc": "The publish-only affiliation is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description The publisher affiliation is supported.
     * @see XEP-0060
     */
    PUBLISHER_AFFILIATION: {
        "name": "http://jabber.org/protocol/pubsub#publisher-affiliation",
        "desc": "The publisher affiliation is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Purging of nodes is supported.
     * @see XEP-0060
     */
    PURGE_NODES: {
        "name": "http://jabber.org/protocol/pubsub#purge-nodes",
        "desc": "Purging of nodes is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Item retraction is supported.
     * @see XEP-0060
     */
    RETRACT_ITEMS: {
        "name": "http://jabber.org/protocol/pubsub#retract-items",
        "desc": "Item retraction is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Retrieval of current affiliations is supported.
     * @see XEP-0060
     */
    RETRIEVE_AFFILIATIONS: {
        "name": "http://jabber.org/protocol/pubsub#retrieve-affiliations",
        "desc": "Retrieval of current affiliations is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Retrieval of default node configuration is supported.
     * @see XEP-0060
     */
    RETRIEVE_DEFAULT: {
        "name": "http://jabber.org/protocol/pubsub#retrieve-default",
        "desc": "Retrieval of default node configuration is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Item retrieval is supported.
     * @see XEP-0060
     */
    RETRIEVE_ITEMS: {
        "name": "http://jabber.org/protocol/pubsub#retrieve-items",
        "desc": "Item retrieval is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Retrieval of current subscriptions is supported.
     * @see XEP-0060
     */
    RETRIEVE_SUBSCRIPTIONS: {
        "name": "http://jabber.org/protocol/pubsub#retrieve-subscriptions",
        "desc": "Retrieval of current subscriptions is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Subscribing and unsubscribing are supported.
     * @see XEP-0060
     */
    SUBSCRIBE: {
        "name": "http://jabber.org/protocol/pubsub#subscribe",
        "desc": "Subscribing and unsubscribing are supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Configuration of subscription options is supported.
     * @see XEP-0060
     */
    SUBSCRIPTION_OPTIONS: {
        "name": "http://jabber.org/protocol/pubsub#subscription-options",
        "desc": "Configuration of subscription options is supported.",
        "doc": "XEP-0060"
    },

    /**
     * @description Notification of subscription state changes is supported.
     * @see XEP-0060
     */
    SUBSCRIPTION_NOTIFICATIONS: {
        "name": "http://jabber.org/protocol/pubsub#subscription-notifications",
        "desc": "Notification of subscription state changes is supported.",
        "doc": "XEP-0060"
    }
};

module.exports = Features;