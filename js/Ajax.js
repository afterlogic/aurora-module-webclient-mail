'use strict'

const _ = require('underscore')

const TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
  Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
  Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
  App = require('%PathToCoreWebclientModule%/js/App.js'),
  Screens = require('%PathToCoreWebclientModule%/js/Screens.js')

const Settings = require('modules/%ModuleName%/js/Settings.js')

Ajax.registerAbortRequestHandler(Settings.ServerModuleName, function (oRequest, oOpenedRequest) {
  var oParameters = oRequest.Parameters,
    oOpenedParameters = oOpenedRequest.Parameters
  switch (oRequest.Method) {
    case 'MoveMessages':
    case 'DeleteMessages':
      return (
        oOpenedRequest.Method === 'GetRelevantFoldersInformation' ||
        oOpenedRequest.Method === 'GetUnifiedRelevantFoldersInformation' ||
        oOpenedRequest.Method === 'GetMessage' ||
        oOpenedRequest.Method === 'GetUnifiedMailboxMessages' ||
        oOpenedRequest.Method === 'GetMessagesByFolders' ||
        (oOpenedRequest.Method === 'GetMessages' && oOpenedParameters.Folder === oParameters.Folder)
      )
    case 'GetMessages':
    case 'GetUnifiedMailboxMessages':
      return (
        oOpenedRequest.Method === 'GetUnifiedMailboxMessages' ||
        oOpenedRequest.Method === 'GetMessagesByFolders' ||
        (oOpenedRequest.Method === 'GetMessages' && oOpenedParameters.Folder === oParameters.Folder)
      )
    case 'SetMessagesSeen':
    case 'SetMessageFlagged':
      return (
        oOpenedRequest.Method === 'GetRelevantFoldersInformation' ||
        oOpenedRequest.Method === 'GetUnifiedRelevantFoldersInformation' ||
        oOpenedRequest.Method === 'GetUnifiedMailboxMessages' ||
        oOpenedRequest.Method === 'GetMessagesByFolders' ||
        (oOpenedRequest.Method === 'GetMessages' && oOpenedParameters.Folder === oParameters.Folder)
      )
    case 'SetAllMessagesSeen':
      return (
        oOpenedRequest.Method === 'GetRelevantFoldersInformation' ||
        oOpenedRequest.Method === 'GetUnifiedRelevantFoldersInformation' ||
        (oOpenedRequest.Method === 'GetMessages' && oOpenedParameters.Folder === oParameters.Folder)
      )
    case 'ClearFolder':
      // GetRelevantFoldersInformation-request aborted during folder cleaning, not to get the wrong information.
      return (
        oOpenedRequest.Method === 'GetRelevantFoldersInformation' ||
        oOpenedRequest.Method === 'GetUnifiedRelevantFoldersInformation' ||
        (oOpenedRequest.Method === 'GetMessages' && oOpenedParameters.Folder === oParameters.Folder)
      )
    case 'GetRelevantFoldersInformation':
      return (
        (oOpenedRequest.Method === 'GetRelevantFoldersInformation' &&
          oParameters.AccountID === oOpenedParameters.AccountID) ||
        oOpenedRequest.Method === 'GetUnifiedRelevantFoldersInformation'
      )
    case 'GetMessagesFlags':
      return oOpenedRequest.Method === 'GetMessagesFlags'
  }

  return false
})

module.exports = {
  getOpenedRequest: function (sMethod) {
    Ajax.getOpenedRequest('Mail', sMethod)
  },
  hasOpenedRequests: function (sMethod) {
    return Ajax.hasOpenedRequests('Mail', sMethod || '')
  },
  hasInternetConnectionProblem: function () {
    return Ajax.hasInternetConnectionProblem()
  },
  registerOnAllRequestsClosedHandler: Ajax.registerOnAllRequestsClosedHandler,
  send: function (sMethod, oParameters, fResponseHandler, oContext) {
    var MailCache = require('modules/%ModuleName%/js/Cache.js'),
      fBaseResponseHandler = function (oResponse, oRequest) {
        if (!oResponse.Result && oResponse.ErrorCode === 4002 && App.getUserRole() !== Enums.UserRole.Anonymous) {
          var AccountList = require('modules/%ModuleName%/js/AccountList.js'),
            aErrorMessageParts = oResponse.ErrorMessage.split(':'),
            iAccountId = Types.pInt(aErrorMessageParts.shift()),
            oAccount = AccountList.getAccount(iAccountId),
            sErrorMessage = aErrorMessageParts.join(':')
          if (oAccount && oAccount.bDefault) {
            oResponse = { Result: false, ErrorCode: Enums.Errors.AuthError }
            App.logoutAndGotoLogin()
          } else if (oAccount) {
            oAccount.passwordMightBeIncorrect(true)
            var sResultError = TextUtils.i18n('%MODULENAME%/ERROR_CREDENTIALS_INCORRECT', { EMAIL: oAccount.email() })
            if (sErrorMessage) {
              sResultError += ' (' + sErrorMessage + ')'
            }
            Screens.showError(sResultError, true)
            oResponse = { Result: false, ErrorCode: Enums.Errors.NotDisplayedError }
          }
        }
        if (_.isFunction(fResponseHandler)) {
          fResponseHandler.apply(oContext, [oResponse, oRequest])
        }
      }
    if (oParameters && !oParameters.AccountID && sMethod !== 'GetUnifiedMailboxMessages') {
      oParameters.AccountID = MailCache.currentAccountId()
    }
    Ajax.send(Settings.ServerModuleName, sMethod, oParameters, fBaseResponseHandler, null)
  },
}
