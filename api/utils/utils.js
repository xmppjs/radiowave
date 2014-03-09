'use strict';

function getJid(req) {
    console.log(JSON.stringify(req.user));
    return req.user.jid;
}

function exportJSON(model) {
    if (model instanceof Array) {
        var exportVal = [];
        model.forEach(function (item) {
            exportVal.push(exportJSON(item));
        });
        return exportVal;
    } else if (model && typeof (model.exportJSON) === 'function') {
        return model.exportJSON();
    } else {
        return model.toJSON();
    }
}

module.exports = {
    getJid: getJid,
    exportJSON: exportJSON
};