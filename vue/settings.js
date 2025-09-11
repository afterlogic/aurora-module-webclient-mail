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
    this.allowChangeLayout = typesUtils.pBool(mailWebclientData.AllowChangeLayout)
    this.layoutByDefault = typesUtils.pString(mailWebclientData.LayoutByDefault)
  }

  saveEditableByAdmin ({ autocreateMailAccountOnNewUserFirstLogin, allowAddAccounts, allowChangeLayout, layoutByDefault }) {
    this.autocreateMailAccountOnNewUserFirstLogin = autocreateMailAccountOnNewUserFirstLogin
    this.allowAddAccounts = allowAddAccounts
    this.allowChangeLayout = allowChangeLayout
    this.layoutByDefault = layoutByDefault
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
      allowChangeLayout: settings.allowChangeLayout,
      layoutByDefault: settings.layoutByDefault,
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
