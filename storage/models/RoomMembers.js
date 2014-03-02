'use strict';

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

var roles = [
        MUC_ROLE_MODERATOR,
        MUC_ROLE_NONE,
        MUC_ROLE_PARTICIPANT,
        MUC_ROLE_VISITOR
    ],
    affiliations = [
        MUC_AFFILIATION_OWNER,
        MUC_AFFILIATION_ADMIN,
        MUC_AFFILIATION_MEMBER,
        MUC_AFFILIATION_OUTCAST,
        MUC_AFFILIATION_NONE
    ];

module.exports = function (sequelize, DataTypes) {

    var RoomMembers = sequelize.define('RoomMembers', {
        nickname: {
            type: DataTypes.STRING
        },
        role: {
            type: DataTypes.STRING,
            validate: {
                isRole: function (value) {
                    if (roles.indexOf(value) === -1) {
                        throw new Error('Not a valid xmpp muc role');
                    }
                }
            }
        },
        affiliation: {
            type: DataTypes.STRING,
            validate: {
                isAffiliation: function (value) {
                    if (affiliations.indexOf(value) === -1) {
                        throw new Error('Not a valid xmpp muc affiliation');
                    }
                }
            }
        }
    }, {
        associate: function (models) {

        }
    });

    return RoomMembers;
};