'use strict';

var FeatureDesc = function (options) {

  if (options) {
    if (options.name) {
      this.name = options.name;
    }

    if (options.desc) {
      this.desc = options.desc;
    }

    if (options.doc) {
      this.doc = options.doc;
    }
  }

};

FeatureDesc.prototype = {

  parse: function (xmlElement) {
    // try to extract data from 
    try {
      this.name = xmlElement.getChild('name').getText();
      this.desc = xmlElement.getChild('desc').getText();
      this.doc = xmlElement.getChild('doc').getText();
    } catch (err) {
      console.log(err);
    }
  }
};

module.exports = FeatureDesc;