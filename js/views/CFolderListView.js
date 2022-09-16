'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	App = require('%PathToCoreWebclientModule%/js/App.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),

	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	CreateFolderPopup = require('modules/%ModuleName%/js/popups/CreateFolderPopup.js'),

	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	MailCache = require('modules/%ModuleName%/js/Cache.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CFolderListView()
{
	this.folderList = MailCache.folderList;

	this.folderFullName = ko.computed(function () {
		var oFolder = MailCache.getCurrentFolder();
		return oFolder ? oFolder.fullName() : '';
	}, this);
	this.unifiedInboxAllowed = AccountList.unifiedInboxAllowed;
	this.oUnifiedInbox = MailCache.oUnifiedInbox;

	this.manageFoldersHash = ko.computed(function () {
		if (ModulesManager.isModuleEnabled('SettingsWebclient'))
		{
			var
				oCurrentAccount = AccountList.getCurrent()
			;
			if (oCurrentAccount && oCurrentAccount.allowManageFolders())
			{
				return Routing.buildHashFromArray(['settings', 'mail-accounts', 'account', oCurrentAccount.hash(), 'folders']);
			}
		}
		return '#';
	}, this);

	this.quotaProc = ko.observable(-1);
	this.quotaDesc = ko.observable('');
	this.bShowQuotaBarTextAsTooltip = UserSettings.ShowQuotaBarTextAsTooltip;

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

			if (UserSettings.QuotaWarningPerc > 0 && iProc !== -1 && UserSettings.QuotaWarningPerc > (100 - iProc))
			{
				Screens.showError(TextUtils.i18n('COREWEBCLIENT/WARNING_QUOTA_ALMOST_REACHED'), true);
			}

			return true;

		}, this);
	}

	this.visibleNewFolderButton = ko.computed(function () {
		return Settings.AllowAddNewFolderOnMainScreen && this.folderList().collection().length > 0;
	}, this);

	this.underNewMessageButtonControllers = ko.observableArray([]);
	this.underInboxFolderControllers = ko.observableArray([]);
	this.folderListControllers = ko.computed(function () {
		return this.underNewMessageButtonControllers().concat(this.underInboxFolderControllers());
	}, this);
	App.broadcastEvent('%ModuleName%::RegisterFolderListController', _.bind(function (controller, place) {
		this.registerController(controller, place);
	}, this));
}

CFolderListView.prototype.ViewTemplate = '%ModuleName%_FoldersView';

CFolderListView.prototype.onShow = function ()
{
	this.folderListControllers().forEach(controller => {
		if (_.isFunction(controller.onShow)) {
			controller.onShow();
		}
	});
};

CFolderListView.prototype.onRoute = function (aParams)
{
	this.folderListControllers().forEach(controller => {
		if (_.isFunction(controller.onRoute)) {
			controller.onRoute(aParams);
		}
	});
};

CFolderListView.prototype.addNewFolder = function ()
{
	Popups.showPopup(CreateFolderPopup);
};

/**
 * @param {Object} controller
 * @param {string} place
 */
CFolderListView.prototype.registerController = function (controller, place) {
	switch (place) {
		case 'UnderNewMessageButton':
			this.underNewMessageButtonControllers.push(controller);
			break;
		case 'UnderInboxFolder':
			this.underInboxFolderControllers.push(controller);
			break;
	}
};

module.exports = CFolderListView;
