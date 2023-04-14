'use strict';

const
  App = require('%PathToCoreWebclientModule%/js/App.js'),

  CHtmlEditorView = require('modules/%ModuleName%/js/views/CHtmlEditorView.js')
;

module.exports = {
  getCHtmlEditorView() {
    const params = { CHtmlEditorView: null };
    App.broadcastEvent('%ModuleName%::GetCHtmlEditorView', params);
    return params.CHtmlEditorView || CHtmlEditorView;
  }
}