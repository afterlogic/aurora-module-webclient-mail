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
function CMailSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);

	this.bRtl = UserSettings.IsRTL;
	this.bAllowMailto = Settings.AllowAppRegisterMailto && (Browser.firefox || Browser.chrome);
	
	this.mailsPerPageValues = ko.observableArray(Types.getAdaptedPerPageList(Settings.MailsPerPage));
	
	this.mailsPerPage = ko.observable(Settings.MailsPerPage);
	this.allowAutosaveInDrafts = ko.observable(Settings.AllowAutosaveInDrafts);
	this.allowChangeInputDirection = ko.observable(Settings.AllowChangeInputDirection);
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
		this.allowChangeInputDirection()
	];
};

CMailSettingsFormView.prototype.revertGlobalValues = function ()
{
	this.mailsPerPage(Settings.MailsPerPage);
	this.allowAutosaveInDrafts(Settings.AllowAutosaveInDrafts);
	this.allowChangeInputDirection(Settings.AllowChangeInputDirection);
};

CMailSettingsFormView.prototype.getParametersForSave = function ()
{
	return {
		'MailsPerPage': this.mailsPerPage(),
		'AllowAutosaveInDrafts': this.allowAutosaveInDrafts(),
		'AllowChangeInputDirection': this.allowChangeInputDirection()
	};
};

CMailSettingsFormView.prototype.applySavedValues = function (oParameters)
{
	Settings.update(oParameters.MailsPerPage, oParameters.AllowAutosaveInDrafts, oParameters.AllowChangeInputDirection);
};

CMailSettingsFormView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === '');
};

module.exports = new CMailSettingsFormView();
