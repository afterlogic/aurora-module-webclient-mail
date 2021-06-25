import _ from 'lodash'

import typesUtils from 'src/utils/types'

class MailSettings {
  constructor(appData) {
    const mailData = typesUtils.pObject(appData.Mail)
    this.allowChangeMailQuotaOnMailServer = typesUtils.pBool(mailData.AllowChangeMailQuotaOnMailServer)
    this.allowMultiAccounts = typesUtils.pBool(mailData.AllowMultiAccounts)
    this.allowEditDomainsInServer = typesUtils.pBool(mailData.AllowEditDomainsInServer, true)
    this.autocreateMailAccountOnNewUserFirstLogin = typesUtils.pBool(mailData.AutocreateMailAccountOnNewUserFirstLogin)
    this.smtpAuthTypeEnum = typesUtils.pObject(mailData.SmtpAuthType)

    const mailWebclientData = typesUtils.pObject(appData.MailWebclient)
    this.allowHorizontalLayout = typesUtils.pBool(mailWebclientData.AllowHorizontalLayout)
    this.horizontalLayoutByDefault = this.allowHorizontalLayout && typesUtils.pBool(mailWebclientData.HorizontalLayoutByDefault)
  }

  saveEditableByAdmin ({ autocreateMailAccountOnNewUserFirstLogin, allowMultiAccounts, horizontalLayoutByDefault }) {
    this.autocreateMailAccountOnNewUserFirstLogin = autocreateMailAccountOnNewUserFirstLogin
    this.allowMultiAccounts = allowMultiAccounts
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
