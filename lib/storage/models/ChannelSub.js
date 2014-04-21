'use strict';

module.exports = function (sequelize, DataTypes) {

    /**
     * @see http://xmpp.org/extensions/xep-0060.html#affiliations
     */
    var Affiliation = {
        'Owner': 'owner',
        'Publisher': 'publisher',
        'Member': 'member',
        'None': 'none',
        'Outcast': 'outcast'
    };

    /**
     * @see http://xmpp.org/extensions/xep-0060.html#substates
     */
    var SubState = {
        'Pending': 'pending',
        'Unconfigured': 'unconfigured',
        'Subscribed': 'subscribed',
        'None': 'none'
    };

    var ChannelSubscription = sequelize.define('ChannelSub', {
        affiliation: {
            type: DataTypes.ENUM(
                Affiliation.Owner,
                Affiliation.Publisher,
                Affiliation.Member,
                Affiliation.None,
                Affiliation.Outcast
            )
        },
        substate: {
            type: DataTypes.ENUM(
                SubState.Pending,
                SubState.Unconfigured,
                SubState.Subscribed,
                SubState.None
            )
        }
    }, {
        associate: function (models) {

        },
        classMethods: {
            Affiliation: Affiliation,
            SubState: SubState
        },
        instanceMethods: {
        }
    });

    return ChannelSubscription;
};