'use strict';

var
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	MailCache = require('modules/%ModuleName%/js/Cache.js')
;

/**
 * @constructor
 */
function CFolderListView()
{
	this.accounts = AccountList.collection; // todo: only mobile version
	
	this.folderList = MailCache.folderList;
	
	this.manageFoldersHash = ko.computed(function () {
		if (ModulesManager.isModuleEnabled('SettingsWebclient'))
		{
			var
				oCurrentAccount = AccountList.getCurrent()
			;
			if (oCurrentAccount)
			{
				return Routing.buildHashFromArray(['settings', 'mail-accounts', 'account', oCurrentAccount.hash(), 'folders']);
			}
		}
		return '#';
	}, this);
	
	this.quotaProc = ko.observable(-1);
	this.quotaDesc = ko.observable('');

	if (UserSettings.ShowQuotaBar)
	{
		ko.computed(function () {

			MailCache.quotaChangeTrigger();

			var
				oAccount = AccountList.getCurrent(),
				iQuota = oAccount ? oAccount.quota() : 0,
				iUsed = oAccount ? oAccount.usedSpace() : 0,
				iProc = 0 < iQuota ? Math.ceil((iUsed / iQuota) * 100) : -1
			;

			iProc = 100 < iProc ? 100 : iProc;

			this.quotaProc(iProc);
			this.quotaDesc(-1 < iProc ?
				TextUtils.i18n('COREWEBCLIENT/INFO_QUOTA', {
					'PROC': iProc,
					'QUOTA': TextUtils.getFriendlySize(iQuota * 1024)
				}) : '');

			return true;

		}, this);
	}
}

CFolderListView.prototype.ViewTemplate = App.isMobile() ? '%ModuleName%_FoldersMobileView' : '%ModuleName%_FoldersView';

module.exports = CFolderListView;
