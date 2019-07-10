'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	ValidationUtils = require('%PathToCoreWebclientModule%/js/utils/Validation.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	CreateAccountPopup = require('modules/%ModuleName%/js/popups/CreateAccountPopup.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	CAccountModel = require('modules/%ModuleName%/js/models/CAccountModel.js'),
	CServerModel = require('modules/%ModuleName%/js/models/CServerModel.js')
;

/**
 * @constructor
 */
function CreateAccountShortFormPopup()
{
	CAbstractPopup.call(this);

	this.loading = ko.observable(false);

	this.friendlyName = ko.observable('');
	this.email = ko.observable('');
	this.email.focused = ko.observable(false);
	this.password = ko.observable('');
	this.password.focused = ko.observable(false);
	this.aRequiredFields = [this.email, this.password];
}

_.extendOwn(CreateAccountShortFormPopup.prototype, CAbstractPopup.prototype);

CreateAccountShortFormPopup.prototype.PopupTemplate = '%ModuleName%_Settings_CreateAccountShortFormPopup';

CreateAccountShortFormPopup.prototype.init = function ()
{
	this.friendlyName('');
	this.email('');
	this.password('');
};

/**
 * @param {Function=} fCallback
 */
CreateAccountShortFormPopup.prototype.onOpen = function (fCallback)
{
	this.fCallback = fCallback;
	
	this.init();
	
	this.focusFieldToEdit();
};

CreateAccountShortFormPopup.prototype.focusFieldToEdit = function ()
{
	var koFirstEmptyField = _.find(this.aRequiredFields, function (koField) {
		return koField() === '';
	});
	
	if (koFirstEmptyField)
	{
		koFirstEmptyField.focused(true);
	}
	else if (this.aRequiredFields.length > 0)
	{
		this.aRequiredFields[0].focused(true);
	}
};

CreateAccountShortFormPopup.prototype.onClose = function ()
{
	this.init();
};

CreateAccountShortFormPopup.prototype.save = function ()
{
	if (ValidationUtils.checkIfFieldsEmpty(this.aRequiredFields, TextUtils.i18n('%MODULENAME%/ERROR_REQUIRED_FIELDS_EMPTY')))
	{
		var
			oParameters = {
				'Domain': $.trim(this.email()).split('@')[1],
				'AllowWildcardDomain': true
			}
		;

		this.loading(true);

		Ajax.send('GetMailServerByDomain', oParameters, this.onGetMailServerByDomain, this);
	}
	else
	{
		this.loading(false);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CreateAccountShortFormPopup.prototype.onGetMailServerByDomain = function (oResponse, oRequest)
{
	var oServer = null;

	if (oResponse.Result
		&& typeof oResponse.Result.Server !== 'undefined'
		&& typeof oResponse.Result.FoundWithWildcard !== 'undefined'
	)
	{
		if (oResponse.Result.FoundWithWildcard)
		{
			var
				sNewAccountDomain = $.trim(this.email()).split('@')[1],
				sMainAccountEmail = AccountList.getDefault() ? AccountList.getDefault().email() : '',
				sMainAccountDomain = $.trim(sMainAccountEmail).split('@')[1],
				bDomainsMatches = sNewAccountDomain === sMainAccountDomain
			;

			if (bDomainsMatches)
			{
				oServer = new CServerModel(oResponse.Result.Server);
			}
		}
		else
		{
			oServer = new CServerModel(oResponse.Result.Server);
		}
	}

	if (oServer)
	{
		var
			oParameters = {
				'FriendlyName': this.friendlyName(),
				'Email': $.trim(this.email()),
				'IncomingLogin': $.trim(this.email()),
				'IncomingPassword': $.trim(this.password()),
				'Server': {
					'ServerId': oServer.iId
				}
			}
		;

		Ajax.send('CreateAccount', oParameters, this.onAccountCreateResponse, this);
	}
	else
	{
		//second stage
		this.loading(false);
		Popups.showPopup(CreateAccountPopup, [
			_.bind(function (iAccountId) {
				var oAccount = AccountList.getAccount(iAccountId);
				if (oAccount)
				{
					this.editAccount(oAccount.hash());
				}
			}, this),
			this.friendlyName(),
			$.trim(this.email()),
			$.trim(this.password())
		]);
		this.closePopup();
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CreateAccountShortFormPopup.prototype.onAccountCreateResponse = function (oResponse, oRequest)
{
	this.loading(false);

	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_CREATE_ACCOUNT'));
	}
	else
	{
		var
			iAccountId = Types.pInt(oResponse.Result.AccountID),
			oAccount = new CAccountModel(oResponse.Result)
		;
		
		AccountList.addAccount(oAccount);
		AccountList.populateIdentities();
		AccountList.changeEditedAccount(iAccountId);
		if (AccountList.collection().length === 1)
		{
			AccountList.changeCurrentAccount(iAccountId);
		}
		
		if (this.fCallback)
		{
			this.fCallback(iAccountId);
		}
		
		this.closePopup();
	}
};

/**
 * @param {string} sHash
 */
CreateAccountShortFormPopup.prototype.editAccount = function (sHash)
{
	ModulesManager.run('SettingsWebclient', 'setAddHash', [['account', sHash]]);
};

module.exports = new CreateAccountShortFormPopup();
