'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ChangePasswordPopup = ModulesManager.run('ChangePasswordWebclient', 'getChangePasswordPopup'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CServerPairPropertiesView = require('modules/%ModuleName%/js/views/settings/CServerPairPropertiesView.js')
;

/**
 * @constructor
 */ 
function CAccountUnifiedMailboxFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);

	this.visibleTab = ko.computed(function () {
		return Settings.AllowUnifiedInbox;
	}, this);
	
	this.includeInUnifiedMailbox = ko.observable(false);
	this.showUnifiedMailboxLabel = ko.observable(false);
	this.unifiedMailboxLabelText = ko.observable('');
	this.unifiedMailboxLabelColor = ko.observable('');
}

_.extendOwn(CAccountUnifiedMailboxFormView.prototype, CAbstractSettingsFormView.prototype);

CAccountUnifiedMailboxFormView.prototype.ViewTemplate = '%ModuleName%_Settings_AccountUnifiedMailboxFormView';

CAccountUnifiedMailboxFormView.prototype.getCurrentValues = function ()
{
	return [
		this.includeInUnifiedMailbox(),
		this.showUnifiedMailboxLabel(),
		this.unifiedMailboxLabelText(),
		this.unifiedMailboxLabelColor()
	];
};

CAccountUnifiedMailboxFormView.prototype.getParametersForSave = function ()
{
	return {
		'AccountID': AccountList.editedId(),
		'IncludeInUnifiedMailbox': this.includeInUnifiedMailbox(),
		'ShowUnifiedMailboxLabel': this.showUnifiedMailboxLabel(),
		'UnifiedMailboxLabelText': $.trim(this.unifiedMailboxLabelText()),
		'UnifiedMailboxLabelColor': $.trim(this.unifiedMailboxLabelColor())
	};
};

CAccountUnifiedMailboxFormView.prototype.revert = function ()
{
	this.populate();
};

CAccountUnifiedMailboxFormView.prototype.populate = function ()
{
	var oAccount = AccountList.getEdited();
	
	if (oAccount)
	{
		this.includeInUnifiedMailbox(oAccount.includeInUnifiedMailbox());
		this.showUnifiedMailboxLabel(oAccount.showUnifiedMailboxLabel());
		this.unifiedMailboxLabelText(oAccount.unifiedMailboxLabelText());
		this.unifiedMailboxLabelColor(oAccount.unifiedMailboxLabelColor());
	}
	else
	{
		this.includeInUnifiedMailbox(false);
		this.showUnifiedMailboxLabel(false);
		this.unifiedMailboxLabelText('');
		this.unifiedMailboxLabelColor('');
	}
	
	this.updateSavedState();
};

CAccountUnifiedMailboxFormView.prototype.save = function ()
{
	this.isSaving(true);

	this.updateSavedState();

	Ajax.send('UpdateAccountUnifiedInbox', this.getParametersForSave(), this.onResponse, this);
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAccountUnifiedMailboxFormView.prototype.onResponse = function (oResponse, oRequest)
{
	this.isSaving(false);

	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_SAVING_SETTINGS_FAILED'));
	}
	else
	{
		var
			oParameters = oRequest.Parameters,
			iAccountId = Types.pInt(oParameters.AccountID),
			oAccount = AccountList.getAccount(iAccountId)
		;

		if (oAccount)
		{
			oAccount.updateFromServer(oResponse.Result);
			this.populate();
			Screens.showReport(TextUtils.i18n('COREWEBCLIENT/REPORT_SETTINGS_UPDATE_SUCCESS'));
		}
	}
};

module.exports = new CAccountUnifiedMailboxFormView();
