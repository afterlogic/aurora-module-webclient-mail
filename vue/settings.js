import _ from 'lodash'

import typesUtils from 'src/utils/types'

class MailSettings {
  constructor(appData) {
    const mailData = typesUtils.pObject(appData.Mail)
    const mailWebclientData = typesUtils.pObject(appData.MailWebclient)

    if (!_.isEmpty(mailData)) {
      this.allowMultiAccounts = typesUtils.pBool(mailData.AllowMultiAccounts)
      this.autocreateMailAccountOnNewUserFirstLogin = typesUtils.pBool(mailData.AutocreateMailAccountOnNewUserFirstLogin)
      this.smtpAuthTypeEnum = typesUtils.pObject(mailData.SmtpAuthType)
    }

    if (!_.isEmpty(mailWebclientData)) {
      this.allowHorizontalLayout = typesUtils.pBool(mailWebclientData.AllowHorizontalLayout)
      this.horizontalLayoutByDefault = this.allowHorizontalLayout && typesUtils.pBool(mailWebclientData.HorizontalLayoutByDefault)
    }
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

  getEditableByAdmin () {
    return {
      allowMultiAccounts: settings?.allowMultiAccounts || false,
      autocreateMailAccountOnNewUserFirstLogin: settings?.autocreateMailAccountOnNewUserFirstLogin || false,
      allowHorizontalLayout: settings?.allowHorizontalLayout || false,
      horizontalLayoutByDefault: settings?.horizontalLayoutByDefault || false,
    }
  },

  saveEditableByAdmin (data) {
    settings.saveEditableByAdmin(data)
  },

  getSmtpAuthTypeEnum () {
    return settings.smtpAuthTypeEnum
  },
}
