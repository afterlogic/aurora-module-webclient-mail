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
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CServerPropertiesView = require('modules/%ModuleName%/js/views/CServerPropertiesView.js')
;

/**
 * @constructor
 */ 
function CAccountPropertiesPaneView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.bAllowChangeEmailSettings =  Settings.AllowChangeEmailSettings;
	this.bAllowIdentities = Settings.AllowIdentities;
	
	this.isInternal = ko.observable(true);
	this.isLinked = ko.observable(true);
	this.isDefault = ko.observable(false);
	this.removeHint = ko.observable('');
	this.canBeRemoved = ko.observable('');
	this.friendlyName = ko.observable('');
	this.email = ko.observable('');
	this.incomingMailLogin = ko.observable('');
	this.incomingMailPassword = ko.observable('');
	this.oIncoming = new CServerPropertiesView(143, 993, 'acc_edit_incoming', TextUtils.i18n('%MODULENAME%/LABEL_IMAP_SERVER'));
	this.outgoingMailLogin = ko.observable('');
	this.outgoingMailPassword = ko.observable('');
	this.oOutgoing = new CServerPropertiesView(25, 465, 'acc_edit_outgoing', TextUtils.i18n('%MODULENAME%/LABEL_SMTP_SERVER'), this.oIncoming.server);

	this.isAllowMail = ko.observable(true);
	this.allowChangePassword = ko.observable(false);
	this.useSmtpAuthentication = ko.observable(false);
	
	this.incLoginFocused = ko.observable(false);
	this.incLoginFocused.subscribe(function () {
		if (this.incLoginFocused() && this.incomingMailLogin() === '')
		{
			this.incomingMailLogin(this.email());
		}
	}, this);

	AccountList.editedId.subscribe(function () {
		this.populate();
	}, this);
	this.populate();
}

_.extendOwn(CAccountPropertiesPaneView.prototype, CAbstractSettingsFormView.prototype);

CAccountPropertiesPaneView.prototype.ViewTemplate = '%ModuleName%_Settings_AccountPropertiesPaneView';

CAccountPropertiesPaneView.prototype.getCurrentValues = function ()
{
	return [
		this.friendlyName(),
		this.email(),
		this.incomingMailLogin(),
		this.oIncoming.port(),
		this.oIncoming.server(),
		this.oIncoming.ssl(),
		this.outgoingMailLogin(),
		this.oOutgoing.port(),
		this.oOutgoing.server(),
		this.oOutgoing.ssl(),
		this.useSmtpAuthentication()
	];
};

CAccountPropertiesPaneView.prototype.getParametersForSave = function ()
{
	var oAccount = AccountList.getEdited();
	return {
		'AccountID': oAccount.id(),
		'FriendlyName': this.friendlyName(),
		'Email': this.email(),
		'IncomingMailLogin': this.incomingMailLogin(),
		'IncomingMailServer': this.oIncoming.server(),
		'IncomingMailPort': this.oIncoming.getIntPort(),
		'IncomingMailSsl': this.oIncoming.getIntSsl(),
		'OutgoingMailLogin': this.outgoingMailLogin(),
		'OutgoingMailServer': this.oOutgoing.server(),
		'OutgoingMailPort': this.oOutgoing.getIntPort(),
		'OutgoingMailSsl': this.oOutgoing.getIntSsl(),
		'OutgoingMailAuth': this.useSmtpAuthentication() ? 2 : 0,
		'IncomingMailPassword': this.incomingMailPassword()
	};
};

CAccountPropertiesPaneView.prototype.populate = function ()
{
	var oAccount = AccountList.getEdited();
	
	if (oAccount)
	{	
		this.allowChangePassword(!!ChangePasswordPopup);// && oAccount.extensionExists('AllowChangePasswordExtension'));

		this.friendlyName(oAccount.friendlyName());
		this.email(oAccount.email());
		this.incomingMailLogin(oAccount.incomingMailLogin());
		this.oIncoming.set(oAccount.incomingMailServer(), oAccount.incomingMailPort(), oAccount.incomingMailSsl());
		this.outgoingMailLogin(oAccount.outgoingMailLogin());
		this.oOutgoing.set(oAccount.outgoingMailServer(), oAccount.outgoingMailPort(), oAccount.outgoingMailSsl());
		this.useSmtpAuthentication(Types.pInt(oAccount.outgoingMailAuth()) === 2 ? true : false);
		
		this.isInternal(oAccount.isInternal());
		this.isLinked(oAccount.isLinked());
		this.isDefault(oAccount.isDefault());
		this.removeHint(oAccount.removeHint());
		this.canBeRemoved(oAccount.canBeRemoved());
		
		if (!oAccount.isExtended())
		{
			var oSubscribtion = oAccount.isExtended.subscribe(function () {
				if (oAccount.isExtended() && oAccount.id() === AccountList.editedId())
				{
					_.defer(_.bind(this.populate, this));
				}
				oSubscribtion.dispose();
			}, this);
		}
	}
	else
	{
		this.allowChangePassword(false);

		this.friendlyName('');
		this.email('');
		this.incomingMailLogin('');
		this.oIncoming.clear();
		this.outgoingMailLogin('');
		this.oOutgoing.clear();
		this.useSmtpAuthentication(true);
		
		this.isInternal(true);
		this.isLinked(true);
		this.isDefault(true);
		this.removeHint('');
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
			oAccount.updateExtended(oParameters);
			Screens.showReport(TextUtils.i18n('COREWEBCLIENT/REPORT_SETTINGS_UPDATE_SUCCESS'));
		}
	}
};

CAccountPropertiesPaneView.prototype.changePassword = function ()
{
	if (ChangePasswordPopup)
	{
		Popups.showPopup(ChangePasswordPopup, [{
			sModule: Settings.ServerModuleName,
			bHasOldPassword: true
		}]);
	}
};

module.exports = new CAccountPropertiesPaneView();
