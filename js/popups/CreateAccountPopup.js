'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	CAccountModel = require('modules/%ModuleName%/js/models/CAccountModel.js'),
	
	CServerPairPropertiesView = require('modules/%ModuleName%/js/views/settings/CServerPairPropertiesView.js')
;

/**
 * @constructor
 */
function CCreateAccountPopup()
{
	CAbstractPopup.call(this);
	
	this.defaultAccountId = AccountList.defaultId;

	this.loading = ko.observable(false);
	

	this.friendlyName = ko.observable('');
	this.email = ko.observable('');
	this.incomingLogin = ko.observable('');
	this.incomingLoginFocused = ko.observable(false);
	this.incomingPassword = ko.observable('');
	
	this.oServerPairPropertiesView = new CServerPairPropertiesView('acc_create');
	
	this.outgoingLogin = ko.observable('');
	
	this.friendlyNameFocus = ko.observable(false);
	this.emailFocus = ko.observable(false);
	this.incomingPasswordFocus = ko.observable(false);
	this.incomingMailFocus = ko.observable(false);

	this.isFirstStep = ko.observable(true);
	this.isFirstTitle = ko.observable(true);
	this.isConnectToMailType = ko.observable(false);
	
	this.isFirstStep.subscribe(function (bValue) {
		if (!bValue)
		{
			this.oServerPairPropertiesView.clear();
		}
	}, this);

	this.incomingLoginFocused.subscribe(function () {
		if (this.incomingLoginFocused() && this.incomingLogin() === '')
		{
			this.incomingLogin(this.email());
		}
	}, this);
}


_.extendOwn(CCreateAccountPopup.prototype, CAbstractPopup.prototype);

CCreateAccountPopup.prototype.PopupTemplate = '%ModuleName%_Settings_CreateAccountPopup';

CCreateAccountPopup.prototype.init = function ()
{
	this.isFirstTitle(true);
	
	this.friendlyName('');
	this.email('');
	this.incomingLogin('');
	this.incomingLoginFocused(false);
	this.incomingPassword('');
	this.outgoingLogin('');

	this.oServerPairPropertiesView.init();
};

/**
 * @param {number} iType
 * @param {string} sEmail
 * @param {Function=} fCallback
 */
CCreateAccountPopup.prototype.onShow = function (iType, sEmail, fCallback)
{
	this.fCallback = fCallback;
	
	this.init();
	
	switch (iType)
	{
		case Enums.AccountCreationPopupType.TwoSteps:
			this.isFirstStep(true);
			this.emailFocus(true);
			break;
		case Enums.AccountCreationPopupType.OneStep:
		case Enums.AccountCreationPopupType.ConnectToMail:
			this.isFirstStep(false);
			this.email(sEmail);
			this.incomingLogin(sEmail);
			this.incomingPasswordFocus(true);
			break;
	}
	
	this.isConnectToMailType(iType === Enums.AccountCreationPopupType.ConnectToMail);
};

CCreateAccountPopup.prototype.onHide = function ()
{
	this.init();
};

CCreateAccountPopup.prototype.onFirstSaveClick = function ()
{
	if (!this.isEmptyFirstFields())
	{
		this.loading(true);
		
		Ajax.send('GetDomainData', { 'Email': this.email() }, this.onDomainGetDataByEmailResponse, this);
	}
	else
	{
		this.loading(false);
	}
};

CCreateAccountPopup.prototype.onSecondSaveClick = function ()
{
	if (!this.isEmptySecondFields())
	{
		var
			oDefaultAccount = AccountList.getDefault(),
			bConfigureMail = this.isConnectToMailType() || oDefaultAccount && !oDefaultAccount.allowMail() && oDefaultAccount.email() === this.email(),
			oParameters = {
				'AccountID': this.defaultAccountId(),
				'FriendlyName': this.friendlyName(),
				'Email': this.email(),
				'IncomingLogin': this.incomingLogin(),
				'IncomingPassword': this.incomingPassword(),
				'OutgoingLogin': this.outgoingLogin(),
				'Server': this.oServerPairPropertiesView.getParametersForSave()
			}
		;

		this.loading(true);

		Ajax.send(bConfigureMail ? 'ConfigureMailAccount' : 'CreateAccount', oParameters, this.onAccountCreateResponse, this);
	}
	else
	{
		this.loading(false);
	}
};

CCreateAccountPopup.prototype.save = function ()
{
	if (!this.loading())
	{
		if (this.isFirstStep())
		{
			this.onFirstSaveClick();
		}
		else
		{
			this.onSecondSaveClick();
		}
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CCreateAccountPopup.prototype.onDomainGetDataByEmailResponse = function (oResponse, oRequest)
{
	var oResult = oResponse.Result;
	
	this.incomingLogin(this.email());

	if (oResult)
	{
//		this.oIncoming.set(oResult.IncomingServer, oResult.IncomingPort, !!oResult.IncomingUseSsl);
//		this.oOutgoing.set(oResult.OutgoingServer, oResult.OutgoingPort, !!oResult.OutgoingUseSsl);

		this.onSecondSaveClick();
	}
	else
	{
		this.loading(false);
		
		this.isFirstStep(false);
		this.isFirstTitle(false);
		this.incomingLoginFocused(true);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CCreateAccountPopup.prototype.onAccountCreateResponse = function (oResponse, oRequest)
{
	this.loading(false);

	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_CREATE_ACCOUNT'));
	}
	else
	{
		var
			iAccountId = Types.pInt(oResponse.Result.IdAccount),
			oAccount = AccountList.getAccount(iAccountId) || new CAccountModel(false),
			oParameters = oRequest.Parameters
		;
		
		oAccount.init(iAccountId, oParameters.Email, oParameters.FriendlyName);
		oAccount.updateExtended(oParameters);
		oAccount.setExtensions(oResponse.Result.Extensions);
		
		if (oRequest.Method === 'AccountConfigureMail')
		{
			oAccount.allowMailAfterConfiguring();
			AccountList.collection.valueHasMutated();
			AccountList.initCurrentAccount();
			AccountList.populateIdentities();
			AccountList.currentId.valueHasMutated();
		}
		else
		{
			AccountList.addAccount(oAccount);
			AccountList.populateIdentities();
			AccountList.changeEditedAccount(iAccountId);
			if (AccountList.collection().length === 1)
			{
				AccountList.changeCurrentAccount(iAccountId);
			}
		}
		
		if (this.fCallback)
		{
			this.fCallback(iAccountId);
		}
		
		this.closePopup();
	}
};

CCreateAccountPopup.prototype.isEmptyFirstFields = function ()
{
	switch ('')
	{
		case this.email():
			this.emailFocus(true);
			return true;
		case this.incomingPassword():
			this.incomingMailFocus(true);
			return true;
		default: return false;
	}
};

CCreateAccountPopup.prototype.isEmptySecondFields = function ()
{
	switch ('')
	{
		case this.email():
			this.emailFocus(true);
			return true;
		case this.incomingLogin():
			this.incomingLoginFocused(true);
			return true;
//		case this.oIncoming.server():
//			this.oIncoming.server.focused(true);
//			return true;
//		case this.oOutgoing.server():
//			this.oOutgoing.server.focused(true);
//			return true;
		default: return false;
	}
};

module.exports = new CCreateAccountPopup();
