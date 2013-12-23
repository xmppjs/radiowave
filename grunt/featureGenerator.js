'use strict';

var ltx = require('ltx'),
    fs = require('fs'),
    path = require('path');

var Feature = require('./FeatureDesc');

function loadFile(filename) {
    var content = fs.readFileSync(filename, {
        encoding: 'utf8'
    });
    var featureNode = ltx.parse(content);
    var varNodes = featureNode.getChildren('var');

    var features = [];

    for (var i = 0; i < varNodes.length; i++) {
        var feature = new Feature();
        feature.parse(varNodes[i]);
        features.push(feature);
    }

    return features;
}


function generateFeatureJs(filename) {
    var directory = path.dirname(filename);
    var jsfile = path.resolve(directory, 'features.js');

    // load features
    var features = loadFile(filename);
    console.log(features);

    var fileContent = '';

    fileContent += '\'use strict\n;';

    // generate features as javascript file
    var headline = '// Generated with xRocket. Please change the feature.xml file and run grunt generate:features';
    var fileContent = headline + '\n';

    fileContent += '\n';
    fileContent += 'var Features = {';
    fileContent += '\n';

    for (var i = 0; i < features.length; i++) {
        var feature = features[i];

        fileContent += '\n';
        fileContent += '/**\n';
        fileContent += ' * @description ' + feature.desc + '\n';
        fileContent += ' * @see ' + feature.doc + '\n';
        fileContent += ' */\n';

        var featurename = feature.name.toUpperCase();
        featurename = featurename.replace(/-/g, '_');
        var key = featurename.match(/#(\w*)/);

        console.log(key);

        // fileContent += key + ' : ' + '\'' + feature.name + '\','
        fileContent += key[1] + ' : ' + JSON.stringify(feature)
        if (i+1 < features.length) {
            fileContent += ',';
        }
        fileContent += '\n';

    };

    fileContent += '}'
    fileContent += '\n\n'
    fileContent += 'module.exports = Features;'

    console.log(fileContent);
    fs.writeFileSync(jsfile, fileContent);

}

module.exports = {
    loadFile: loadFile,
    generateFeatureJs: generateFeatureJs
}
