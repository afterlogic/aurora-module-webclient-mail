'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ChangePasswordPopup = ModulesManager.run('ChangePasswordWebclient', 'getChangePasswordPopup'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	CAccountModel = require('modules/%ModuleName%/js/models/CAccountModel.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CServerPairPropertiesView = require('modules/%ModuleName%/js/views/settings/CServerPairPropertiesView.js')
;

/**
 * @constructor
 */ 
function CAccountPropertiesPaneView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.sFakePass = 'xxxxxxxx'; // fake password uses to display something in password input while account editing
	
	this.bAllowChangeEmailSettings =  Settings.AllowChangeEmailSettings;
	this.bAllowIdentities = Settings.AllowIdentities;
	
	this.useToAuthorize = ko.observable(false);
	this.canBeUsedToAuthorize = ko.observable(false);
	this.canBeRemoved = ko.observable('');
	this.friendlyName = ko.observable('');
	this.email = ko.observable('');
	this.incomingLogin = ko.observable('');
	this.incomingPassword = ko.observable('');

	this.oServerPairPropertiesView = new CServerPairPropertiesView('acc_edit');

	this.allowChangePassword = ko.observable(false);
	
	this.incLoginFocused = ko.observable(false);
	this.incLoginFocused.subscribe(function () {
		if (this.incLoginFocused() && this.incomingLogin() === '')
		{
			this.incomingLogin(this.email());
		}
	}, this);

	AccountList.editedId.subscribe(function () {
		if (this.bShown)
		{
			this.populate();
		}
	}, this);
	this.updateSavedState();
	this.oServerPairPropertiesView.currentValues.subscribe(function () {
		this.updateSavedState();
	}, this);
}

_.extendOwn(CAccountPropertiesPaneView.prototype, CAbstractSettingsFormView.prototype);

CAccountPropertiesPaneView.prototype.ViewTemplate = '%ModuleName%_Settings_AccountPropertiesPaneView';

CAccountPropertiesPaneView.prototype.onShow = function ()
{
	this.oServerPairPropertiesView.init(false);
	this.populate();
};

CAccountPropertiesPaneView.prototype.getCurrentValues = function ()
{
	var
		aMain = [
			this.useToAuthorize(),
			this.friendlyName(),
			this.email(),
			this.incomingLogin(),
			this.incomingPassword()
		],
		aServers = this.oServerPairPropertiesView.currentValues()
	;
	
	return aMain.concat(aServers);
};

CAccountPropertiesPaneView.prototype.getParametersForSave = function ()
{
	var oAccount = AccountList.getEdited();
	return {
		'AccountID': oAccount.id(),
		'UseToAuthorize': this.useToAuthorize(),
		'FriendlyName': this.friendlyName(),
		'Email': this.email(),
		'IncomingLogin': this.incomingLogin(),
		'IncomingPassword': this.incomingPassword() === this.sFakePass ? '' : this.incomingPassword(),
		'Server': this.oServerPairPropertiesView.getParametersForSave()
	};
};

CAccountPropertiesPaneView.prototype.revert = function ()
{
	this.populate();
};

CAccountPropertiesPaneView.prototype.populate = function ()
{
	var oAccount = AccountList.getEdited();
	if (oAccount)
	{	
		this.allowChangePassword(!!ChangePasswordPopup);

		this.friendlyName(oAccount.friendlyName());
		this.email(oAccount.email());
		this.incomingLogin(oAccount.incomingLogin());
		this.incomingPassword(this.sFakePass);
		this.oServerPairPropertiesView.setServer(oAccount.oServer);
		
		this.useToAuthorize(oAccount.useToAuthorize());
		this.canBeUsedToAuthorize(oAccount.canBeUsedToAuthorize());
		this.canBeRemoved(oAccount.canBeRemoved());
	}
	else
	{
		this.allowChangePassword(false);

		this.friendlyName('');
		this.email('');
		this.incomingLogin('');
		this.incomingPassword('');
		
		this.oServerPairPropertiesView.clear();
		
		this.useToAuthorize(true);
		this.canBeUsedToAuthorize(false);
		this.canBeRemoved(false);
	}
	
	this.updateSavedState();
};

CAccountPropertiesPaneView.prototype.remove = function ()
{
	var oAccount = AccountList.getEdited();
	
	if (oAccount)
	{
		oAccount.remove();
	}
};

CAccountPropertiesPaneView.prototype.save = function ()
{
	this.isSaving(true);
	
	this.updateSavedState();
	
	Ajax.send('UpdateAccount', this.getParametersForSave(), this.onResponse, this);
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAccountPropertiesPaneView.prototype.onResponse = function (oResponse, oRequest)
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

CAccountPropertiesPaneView.prototype.changePassword = function ()
{
	if (ChangePasswordPopup)
	{
		Popups.showPopup(ChangePasswordPopup, [{
			iAccountId: AccountList.editedId(),
			sModule: Settings.ServerModuleName,
			bHasOldPassword: true
		}]);
	}
};

module.exports = new CAccountPropertiesPaneView();
