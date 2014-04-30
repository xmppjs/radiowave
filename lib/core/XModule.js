
'use strict';

var util = require('util'),
    XRoute = require('./XRoute');

function XModule() {}

util.inherits(XModule, XRoute);

XModule.prototype.name = 'XModule';

XModule.prototype.version = '0.0.0';

XModule.prototype.initialize = function () {};

module.exports = XModule;