
'use strict';

var util = require('util'),
    StanzaRouter = require('./Router');

function XepModule() {}

util.inherits(XepModule, StanzaRouter);

XepModule.prototype.name = 'XepModule';

XepModule.prototype.version = '0.0.0';

XepModule.prototype.initialize = function () {};

module.exports = XepModule;