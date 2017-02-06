'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
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
function CMailSettingsPaneView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);

	this.bRtl = UserSettings.IsRTL;
	this.bAllowThreads = Settings.AllowThreads;
	this.bAllowMailto = Settings.AllowAppRegisterMailto && (Browser.firefox || Browser.chrome);
	
	this.mailsPerPageValues = ko.observableArray(Types.getAdaptedPerPageList(Settings.MailsPerPage));
	
	this.mailsPerPage = ko.observable(Settings.MailsPerPage);
	this.useThreads = ko.observable(Settings.useThreads());
	this.saveRepliesToCurrFolder = ko.observable(Settings.SaveRepliesToCurrFolder);
	this.allowChangeInputDirection = ko.observable(Settings.AllowChangeInputDirection);
}

_.extendOwn(CMailSettingsPaneView.prototype, CAbstractSettingsFormView.prototype);

CMailSettingsPaneView.prototype.ViewTemplate = '%ModuleName%_Settings_MailSettingsPaneView';

CMailSettingsPaneView.prototype.registerMailto = function ()
{
	MailUtils.registerMailto();
};

CMailSettingsPaneView.prototype.getCurrentValues = function ()
{
	return [
		this.mailsPerPage(),
		this.useThreads(),
		this.saveRepliesToCurrFolder(),
		this.allowChangeInputDirection()
	];
};

CMailSettingsPaneView.prototype.revertGlobalValues = function ()
{
	this.mailsPerPage(Settings.MailsPerPage);
	this.useThreads(Settings.useThreads());
	this.saveRepliesToCurrFolder(Settings.SaveRepliesToCurrFolder);
	this.allowChangeInputDirection(Settings.AllowChangeInputDirection);
};

CMailSettingsPaneView.prototype.getParametersForSave = function ()
{
	return {
		'MailsPerPage': this.mailsPerPage(),
		'UseThreads': this.useThreads(),
		'SaveRepliesToCurrFolder': this.saveRepliesToCurrFolder(),
		'AllowChangeInputDirection': this.allowChangeInputDirection()
	};
};

CMailSettingsPaneView.prototype.applySavedValues = function (oParameters)
{
	Settings.update(oParameters.MailsPerPage, oParameters.UseThreads, oParameters.SaveRepliesToCurrFolder, oParameters.AllowChangeInputDirection);
};

CMailSettingsPaneView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === '');
};

module.exports = new CMailSettingsPaneView();
