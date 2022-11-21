'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Browser = require('%PathToCoreWebclientModule%/js/Browser.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	MailUtils = require('modules/%ModuleName%/js/utils/Mail.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CMailSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);

	this.bRtl = UserSettings.IsRTL;
	this.bAllowChangeStarredMessagesSource = Settings.AllowChangeStarredMessagesSource;
	this.bAllowMailto = Settings.AllowAppRegisterMailto && MailUtils.isAvailableRegisterMailto();
	this.bAllowShowMessagesCountInFolderList = Settings.AllowShowMessagesCountInFolderList;
	this.bAllowHorizontalLayout = Settings.AllowHorizontalLayout;
	
	this.mailsPerPageValues = ko.observableArray(Types.getAdaptedPerPageList(Settings.MailsPerPage));
	this.starredMessagesSourceValues = [
		{
			text: TextUtils.i18n('%MODULENAME%/LABEL_STARRED_MESSAGES_SOURCE_INBOX'),
			value: Enums.StarredMessagesSource.InboxOnly
		},
		{
			text: TextUtils.i18n('%MODULENAME%/LABEL_STARRED_MESSAGES_SOURCE_ALL_FOLDERS'),
			value: Enums.StarredMessagesSource.AllFolders
		}
	];
	this.aLayoutValues = [
		{ text: TextUtils.i18n('%MODULENAME%/LABEL_VERT_SPLIT_LAYOUT'), value: false },
		{ text: TextUtils.i18n('%MODULENAME%/LABEL_HORIZ_SPLIT_LAYOUT'), value: true }
	];
	
	this.mailsPerPage = ko.observable(Settings.MailsPerPage);
	this.starredMessagesSource = ko.observable(Settings.StarredMessagesSource);
	this.allowAutosaveInDrafts = ko.observable(Settings.AllowAutosaveInDrafts);
	this.allowChangeInputDirection = ko.observable(Settings.AllowChangeInputDirection);
	this.showMessagesCountInFolderList = ko.observable(Settings.showMessagesCountInFolderList());
	this.horizontalLayout = ko.observable(Settings.HorizontalLayout);
}

_.extendOwn(CMailSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CMailSettingsFormView.prototype.ViewTemplate = '%ModuleName%_Settings_MailSettingsFormView';

CMailSettingsFormView.prototype.registerMailto = function ()
{
	MailUtils.registerMailto();
};

CMailSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.mailsPerPage(),
		this.allowAutosaveInDrafts(),
		this.allowChangeInputDirection(),
		this.showMessagesCountInFolderList(),
		this.horizontalLayout()
	];
};

CMailSettingsFormView.prototype.revertGlobalValues = function ()
{
	this.mailsPerPage(Settings.MailsPerPage);
	this.starredMessagesSource(Settings.StarredMessagesSource);
	this.allowAutosaveInDrafts(Settings.AllowAutosaveInDrafts);
	this.allowChangeInputDirection(Settings.AllowChangeInputDirection);
	this.showMessagesCountInFolderList(Settings.showMessagesCountInFolderList());
	this.horizontalLayout(Settings.HorizontalLayout);
};

CMailSettingsFormView.prototype.getParametersForSave = function ()
{
	return {
		'MailsPerPage': this.mailsPerPage(),
		'StarredMessagesSource': this.starredMessagesSource(),
		'AllowAutosaveInDrafts': this.allowAutosaveInDrafts(),
		'AllowChangeInputDirection': this.allowChangeInputDirection(),
		'ShowMessagesCountInFolderList': this.showMessagesCountInFolderList(),
		'HorizontalLayout': this.horizontalLayout()
	};
};

CMailSettingsFormView.prototype.applySavedValues = function (parameters)
{
	if (parameters.HorizontalLayout !== Settings.HorizontalLayout) {
		window.location.reload();
	}
	Settings.update(parameters);
};

CMailSettingsFormView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === '');
};

module.exports = new CMailSettingsFormView();
