'use strict';

var ApiError = function (message) {
    this.message = message;
};

ApiError.prototype.toJSON = function () {
    return {
        'message': this.message
    };
};


module.exports = ApiError;