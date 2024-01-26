'use strict'

const
  Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

let
  MailCache = null
;

function getInboxFullName(iAccountId) {
  return  MailCache.oUnifiedInbox.getUnifiedInbox(iAccountId) || 'INBOX'
}

module.exports = {
  parse(accountId, folderFullName, uid) {
    MailCache = require('modules/%ModuleName%/js/Cache.js');

    const isUnifiedInbox = folderFullName === MailCache.oUnifiedInbox.fullName();
    const parts = uid.split(':');
    if (isUnifiedInbox && parts.length === 2) {
      const accountIdCorrected = Types.pInt(parts[0]);
      return [accountIdCorrected, getInboxFullName(accountIdCorrected), parts[1]];
    }

    if (parts.length === 3) {
      return [Types.pInt(parts[0]), parts[1], parts[2]];
    }

    return [accountId, folderFullName, uid];
  }
}