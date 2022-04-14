'use strict';

const
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),

	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),

	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	MailCache = require('modules/%ModuleName%/js/Cache.js')
;

/**
 * @constructor
 */
function SpamButtonsView()
{
	this.allowSpamButtons = ko.observable(false);

	this.isCurrentMessageLoaded = ko.observable(false);

	this.neverSpamCommand = Utils.createCommand(this, this.neverSpam, this.isCurrentMessageLoaded);
	this.alwaysSpamCommand = Utils.createCommand(this, this.alwaysSpam, this.isCurrentMessageLoaded);
}

SpamButtonsView.prototype.ViewTemplate = '%ModuleName%_Message_SpamButtonsView';

/**
 * @param {Object} parameters
 */
SpamButtonsView.prototype.doAfterPopulatingMessage = function (parameters)
{
	const
		message = MailCache.currentMessage(),
		account = message ? AccountList.getAccount(message.accountId()) : AccountList.getCurrent(),
		enableAllowBlockLists = account ? account.enableAllowBlockLists() : false,
		isTemplateFolder = MailCache.isTemplateFolder(message && message.folder());
	;
	this.allowSpamButtons(enableAllowBlockLists && !isTemplateFolder);

	this.isCurrentMessageLoaded(!!parameters);
};

SpamButtonsView.prototype.neverSpam = function ()
{
	const
		message = MailCache.currentMessage(),
		email = message.oFrom.getFirstEmail(),
		parameters = {
			'AccountID': AccountList.editedId(),
			'Email': email
		}
	;
	Ajax.send('AddEmailToAllowList', parameters, function (response) {
		if (response && response.Result) {
			Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_ADD_EMAIL_TO_ALLOWLIST_SUCCESS', {'EMAIL': email}));
		} else {
			Api.showErrorByCode(response, TextUtils.i18n('%MODULENAME%/ERROR_ADD_EMAIL_TO_ALLOWLIST', {'EMAIL': email}));
		}
	}, this);
};

SpamButtonsView.prototype.alwaysSpam = function ()
{
	var
		message = MailCache.currentMessage(),
		email = message.oFrom.getFirstEmail(),
		parameters = {
			'AccountID': AccountList.editedId(),
			'Email': email
		}
	;
	Ajax.send('AddEmailToBlockList', parameters, function (response) {
		if (response && response.Result) {
			Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_ADD_EMAIL_TO_BLOCKLIST_SUCCESS', {'EMAIL': email}));
		} else {
			Api.showErrorByCode(response, TextUtils.i18n('%MODULENAME%/ERROR_ADD_EMAIL_TO_BLOCKLIST', {'EMAIL': email}));
		}
	}, this);
};

module.exports = new SpamButtonsView();
