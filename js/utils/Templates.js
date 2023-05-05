'use strict'

const App = require('%PathToCoreWebclientModule%/js/App.js')

const MailCache = require('modules/%ModuleName%/js/Cache.js'),
  Settings = require('modules/%ModuleName%/js/Settings.js')

module.exports = {
  fillTemplatesOptions(templatesOptionsObservable) {
    if (Settings.AllowInsertTemplateOnCompose) {
      templatesOptionsObservable(this.getTemplatesOptions())
    }
  },

  initTemplatesSubscription(templatesOptionsObservable) {
    if (Settings.AllowInsertTemplateOnCompose) {
      App.subscribeEvent('MailWebclient::ParseMessagesBodies::after', (parameters) => {
        if (
          parameters.AccountID === MailCache.currentAccountId() &&
          parameters.Folder === MailCache.getTemplateFolder()
        ) {
          templatesOptionsObservable(this.getTemplatesOptions())
        }
      })
    }
  },

  getTemplatesOptions() {
    const folderList = MailCache.folderList(),
      templateFolderFullName = MailCache.getTemplateFolder(),
      templateFolder = templateFolderFullName ? folderList.getFolderByFullName(templateFolderFullName) : null,
      uidList = templateFolder
        ? templateFolder.getUidList(
            '',
            '',
            Settings.MessagesSortBy.DefaultSortBy,
            Settings.MessagesSortBy.DefaultSortOrder
          )
        : null,
      templatesOptions = []
    if (uidList) {
      const uids = uidList.collection()
      if (uids.length > Settings.MaxTemplatesCountOnCompose) {
        uids = uids.splice(Settings.MaxTemplatesCountOnCompose)
      }
      uids.forEach((uid) => {
        const message = templateFolder.getMessageByUid(uid)
        if (message.text() !== '') {
          templatesOptions.push({
            subject: message.subject(),
            text: message.text(),
          })
        }
      })
    }
    return templatesOptions
  },
}
