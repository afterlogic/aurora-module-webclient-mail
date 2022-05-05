import eventBus from 'src/event-bus'

import typesUtils from 'src/utils/types'

function _getAllowEditDomainsInServer (mailData) {
  let allowEditDomainsInServer = typesUtils.pBool(mailData.AllowEditDomainsInServer, true)
  const params = { disableEditDomainsInServer: false }
  eventBus.$emit('MailWebclient::DisableEditDomainsInServer', params)
  if (params.disableEditDomainsInServer) {
    allowEditDomainsInServer = false
  }
  return allowEditDomainsInServer
}

class MailSettings {
  constructor(appData) {
    const mailData = typesUtils.pObject(appData.Mail)
    this.allowChangeMailQuotaOnMailServer = typesUtils.pBool(mailData.AllowChangeMailQuotaOnMailServer)
    this.allowMultiAccounts = typesUtils.pBool(mailData.AllowMultiAccounts)
    this.allowAddAccounts = typesUtils.pBool(mailData.AllowAddAccounts)
    this.allowEditDomainsInServer = _getAllowEditDomainsInServer(mailData)
    this.autocreateMailAccountOnNewUserFirstLogin = typesUtils.pBool(mailData.AutocreateMailAccountOnNewUserFirstLogin)
    this.smtpAuthTypeEnum = typesUtils.pObject(mailData.SmtpAuthType)

    const mailWebclientData = typesUtils.pObject(appData.MailWebclient)
    this.allowHorizontalLayout = typesUtils.pBool(mailWebclientData.AllowHorizontalLayout)
    this.horizontalLayoutByDefault = this.allowHorizontalLayout && typesUtils.pBool(mailWebclientData.HorizontalLayoutByDefault)
  }

  saveEditableByAdmin ({ autocreateMailAccountOnNewUserFirstLogin, allowAddAccounts, horizontalLayoutByDefault }) {
    this.autocreateMailAccountOnNewUserFirstLogin = autocreateMailAccountOnNewUserFirstLogin
    this.allowAddAccounts = allowAddAccounts
    this.horizontalLayoutByDefault = horizontalLayoutByDefault
  }
}

let settings = null

export default {
  init (appData) {
    settings = new MailSettings(appData)
  },

  getAllowChangeMailQuotaOnMailServer () {
    return settings.allowChangeMailQuotaOnMailServer
  },

  getEditableByAdmin () {
    return {
      allowMultiAccounts: settings.allowMultiAccounts,
      allowAddAccounts: settings.allowAddAccounts,
      autocreateMailAccountOnNewUserFirstLogin: settings.autocreateMailAccountOnNewUserFirstLogin,
      allowHorizontalLayout: settings.allowHorizontalLayout,
      horizontalLayoutByDefault: settings.horizontalLayoutByDefault,
    }
  },

  saveEditableByAdmin (data) {
    settings.saveEditableByAdmin(data)
  },

  getSmtpAuthTypeEnum () {
    return settings.smtpAuthTypeEnum
  },

  getAllowEditDomainsInServer () {
    return settings.allowEditDomainsInServer
  },
}
