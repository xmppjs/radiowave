'use strict';

module.exports = function (sequelize, DataTypes) {

    var ChannelConfiguration = sequelize.define( 'ChannelConfiguration', {
        key: {
            type: DataTypes.STRING,
            validate: {}
        },
        value: {
            type: DataTypes.TEXT,
            validate: {}
        }
    }, {
        associate: function (models) {

        }
    });

    return ChannelConfiguration;
};
