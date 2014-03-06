'use strict';

module.exports = function (sequelize, DataTypes) {

    /**
     * @see http://xmpp.org/extensions/xep-0045.html#roles
     */
    var Role = {
        'Moderator': 'moderator',
        'Participant': 'participant',
        'Visitor': 'visitor',
        'None': 'none'
    };

    /**
     * @see http://xmpp.org/extensions/xep-0045.html#affil
     */
    var Affiliation = {
        'Owner': 'owner',
        'Admin': 'admin',
        'Member': 'member',
        'None': 'none',
        'Outcast': 'outcast'
    };

    var RoomMembers = sequelize.define('RoomMembers', {
        nickname: {
            type: DataTypes.STRING
        },
        role: {
            type: DataTypes.ENUM(
                Role.Moderator,
                Role.Participant,
                Role.Visitor,
                Role.None
            )
        },
        affiliation: {
            type: DataTypes.ENUM(
                Affiliation.Owner,
                Affiliation.Admin,
                Affiliation.Member,
                Affiliation.None,
                Affiliation.Outcast
            )
        }
    }, {
        associate: function (models) {

        },
        classMethods: {
            Affiliation: Affiliation,
            Role: Role
        },
        instanceMethods: {
            
        }
    });

    return RoomMembers;
};