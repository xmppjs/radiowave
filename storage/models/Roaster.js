'use strict';

module.exports = function (sequelize, DataTypes) {

    var Roaster = sequelize.define('Roaster', {
        name: {
            type: DataTypes.STRING
        },
        subscription: {
            type: DataTypes.STRING,
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