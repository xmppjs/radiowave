'use strict';

module.exports = {
    Api : require('./api/routes'),
    Xep : require('./xep'),
    Router : require('./router'),
    Net : require('./net'),
    Auth :require('./auth'),
    XRocket : require('./core/XRocket'),
    Storage : require('./storage/in-memory')
};