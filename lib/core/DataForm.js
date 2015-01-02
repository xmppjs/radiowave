'use strict';

var util = require('util'),
  ltx = require('ltx');

var NS_DATAFORM = 'jabber:x:data';

/**
 * Implements XEP-0004: Data Forms
 *
 * @param {[type]} name  [description]
 * @param {[type]} attrs [description]
 */
function DataForm() {
  ltx.Element.call(this, 'x', {
    xmlns: NS_DATAFORM
  });
}

util.inherits(DataForm, ltx.Element);

DataForm.prototype = {
  FORMTYPE_FORM: 'form',
  FORMTYPE_SUBMIT: 'submit',
  FORMTYPE_CANCEL: 'cancel',
  FORMTYPE_RESULT: 'result'
};
