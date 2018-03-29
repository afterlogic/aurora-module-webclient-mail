'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CServerPropertiesView = require('modules/%ModuleName%/js/views/CServerPropertiesView.js')
;

/**
 * @constructor
 */
function CFetcherOutgoingSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.fetcher = ko.observable(null);

	this.idFetcher = ko.observable(null);

	this.isEnabled = ko.observable(true);

	this.email = ko.observable('');
	this.userName = ko.observable('');
	this.isOutgoingEnabled = ko.observable(false);
	this.isOutgoingEnabled.subscribe(function (bEnabled) {
		this.oOutgoing.isEnabled(bEnabled);
	}, this);

	this.focusEmail = ko.observable(false);

	this.oOutgoing = new CServerPropertiesView(25, 465, 'fetcher_edit_outgoing', TextUtils.i18n('%MODULENAME%/LABEL_SMTP_SERVER'));
	this.outgoingUseAuth = ko.observable(false);

	this.firstState = null;
}

_.extendOwn(CFetcherOutgoingSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CFetcherOutgoingSettingsFormView.prototype.ViewTemplate = '%ModuleName%_Settings_FetcherOutgoingSettingsFormView';

/**
 * @param {Object} oFetcher
 */
CFetcherOutgoingSettingsFormView.prototype.onShow = function (oFetcher)
{
	this.fetcher(oFetcher && oFetcher.FETCHER ? oFetcher : null);
	this.populate();
};

CFetcherOutgoingSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.isOutgoingEnabled(),
		this.oOutgoing.server(),
		this.oOutgoing.port(),
		this.oOutgoing.ssl(),
		this.outgoingUseAuth(),
		this.userName(),
		this.email()
	];
};

CFetcherOutgoingSettingsFormView.prototype.getParametersForSave = function ()
{
	if (this.fetcher())
	{
		return {
			'AccountID': AccountList.editedId(),
			'FetcherID': this.idFetcher(),
			'Email': $.trim(this.email()),
			'Name': this.userName(),
			'IsOutgoingEnabled': this.isOutgoingEnabled() ? 1 : 0,
			'OutgoingServer': this.oOutgoing.server(),
			'OutgoingPort': this.oOutgoing.getIntPort(),
			'OutgoingUseSsl': this.oOutgoing.ssl(),
			'OutgoingUseAuth': this.outgoingUseAuth()
		};
	}
	
	return {};
};

CFetcherOutgoingSettingsFormView.prototype.save = function ()
{
	if (this.isEmptyRequiredFields())
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_REQUIRED_FIELDS_EMPTY'));
	}
	else
	{
		this.isSaving(true);

		this.updateSavedState();

		Ajax.send('UpdateFetcher', this.getParametersForSave(), this.onResponse, this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CFetcherOutgoingSettingsFormView.prototype.onResponse = function (oResponse, oRequest)
{
	this.isSaving(false);

	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_UNKNOWN'));
	}
	else
	{
		AccountList.populateFetchers();
		
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_SUCCESSFULLY_SAVED'));
	}
};

CFetcherOutgoingSettingsFormView.prototype.populate = function ()
{
	var oFetcher = this.fetcher();
	
	if (oFetcher)
	{
		this.fetcher(oFetcher);

		this.idFetcher(oFetcher.id());

		this.isEnabled(oFetcher.isEnabled());

		this.email(oFetcher.email());
		this.userName(oFetcher.userName());
		this.isOutgoingEnabled(oFetcher.isOutgoingEnabled());

		this.oOutgoing.set(oFetcher.outgoingServer(), oFetcher.outgoingPort(), oFetcher.outgoingUseSsl());
		this.outgoingUseAuth(oFetcher.outgoingUseAuth());

		this.updateSavedState();
	}
};
CFetcherOutgoingSettingsFormView.prototype.isEmptyRequiredFields = function ()
{
	if (this.outgoingUseAuth() && this.isOutgoingEnabled() && '' === this.oOutgoing.server())
	{
		this.oOutgoing.server.focused(true);
		return true;
	}
	
	if (this.outgoingUseAuth() && '' === $.trim(this.email()))
	{
		this.focusEmail(true);
		return true;
	}

	return false;
};

module.exports = new CFetcherOutgoingSettingsFormView();
