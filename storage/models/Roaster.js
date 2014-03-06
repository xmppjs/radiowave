'use strict';

module.exports = function (sequelize, DataTypes) {
    var SubTypes = {
        'Both' : 'both',
        'From' : 'from',
        'To' : 'to',
        'None' : 'none'
    };

    var Roaster = sequelize.define('Roaster', {
        name: {
            type: DataTypes.STRING
        },
        subscription: {
            type: DataTypes.ENUM(
                SubTypes.Both,
                SubTypes.From,
                SubTypes.To,
                SubTypes.None
            )
        },
        // currently one group, but should be multiple, maybe we store groups seperately?
        group: {
            type: DataTypes.STRING,
        }
    }, {
        associate: function (models) {
            
        }
    });

    return Roaster;
};