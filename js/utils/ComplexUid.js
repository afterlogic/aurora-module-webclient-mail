'use strict'

const
  Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),

  Settings = require('modules/%ModuleName%/js/Settings.js')
;

function getInboxFullName(iAccountId) {
  return  MailCache.oUnifiedInbox.getUnifiedInbox(iAccountId) || 'INBOX'
}

module.exports = {
  parse(accountId, folderFullName, uid) {
    const MailCache = require('modules/%ModuleName%/js/Cache.js');
    const isUnifiedInbox = folderFullName === MailCache.oUnifiedInbox.fullName();
    if (isUnifiedInbox || folderFullName === Settings.AllMailsFolder) {
      const parts = uid.split(':');
      if (isUnifiedInbox && parts.length === 2) {
        return [Types.pInt(parts[0]), getInboxFullName(accountIdCorrected), parts[1]];
      } else if (parts.length === 3) {
        return [Types.pInt(parts[0]), parts[1], parts[2]];
      }
    }
    return [accountId, folderFullName, uid];
  }
}