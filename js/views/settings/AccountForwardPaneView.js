'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	AddressUtils = require('%PathToCoreWebclientModule%/js/utils/Address.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	AlertPopup = require('%PathToCoreWebclientModule%/js/popups/AlertPopup.js'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CForwardModel = require('modules/%ModuleName%/js/models/CForwardModel.js')
;

/**
 * @constructor
 */
function CAccountForwardPaneView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.enable = ko.observable(false);
	this.email = ko.observable('');
	this.email.focused = ko.observable(false);

	AccountList.editedId.subscribe(function () {
		if (this.bShown)
		{
			this.populate();
		}
	}, this);
}

_.extendOwn(CAccountForwardPaneView.prototype, CAbstractSettingsFormView.prototype);

CAccountForwardPaneView.prototype.ViewTemplate = '%ModuleName%_Settings_AccountForwardPaneView';

CAccountForwardPaneView.prototype.getCurrentValues = function ()
{
	return [
		this.enable(),
		this.email()
	];
};

CAccountForwardPaneView.prototype.revert = function ()
{
	this.populate();
};

CAccountForwardPaneView.prototype.getParametersForSave = function ()
{
	var oAccount = AccountList.getEdited();
	return {
		'AccountID': oAccount.id(),
		'Enable': this.enable(),
		'Email': this.email()
	};
};

CAccountForwardPaneView.prototype.applySavedValues = function (oParameters)
{
	var
		oAccount = AccountList.getEdited(),
		oForward = oAccount.forward()
	;
	
	if (oForward)
	{
		oForward.enable = oParameters.Enable === '1';
		oForward.email = oParameters.Email;
	}
};

CAccountForwardPaneView.prototype.save = function ()
{
	var
		fSaveData = function() {
			this.isSaving(true);

			this.updateSavedState();

			Ajax.send('UpdateForward', this.getParametersForSave(), this.onResponse, this);
		}.bind(this)
	;

	if (this.enable() && this.email() === '')
	{
		this.email.focused(true);
	}
	else if (this.enable() && this.email() !== '')
	{
		if (!AddressUtils.isCorrectEmail(this.email()))
		{
			Popups.showPopup(AlertPopup, [TextUtils.i18n('%MODULENAME%/ERROR_INPUT_CORRECT_EMAILS') + ' ' + this.email()]);
		}
		else
		{
			fSaveData();
		}
	}
	else
	{
		fSaveData();
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAccountForwardPaneView.prototype.onResponse = function (oResponse, oRequest)
{
	this.isSaving(false);

	if (oResponse.Result === false)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_SAVING_SETTINGS_FAILED'));
	}
	else
	{
		var oParameters = oRequest.Parameters;
		
		this.applySavedValues(oParameters);
		
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_FORWARD_UPDATE_SUCCESS'));
	}
};

CAccountForwardPaneView.prototype.populate = function ()
{
	var 
		oAccount = AccountList.getEdited(),
		oForward = oAccount.forward() ? oAccount.forward() : null
	;
	
	if (oForward !== null)
	{
		this.enable(oForward.enable);
		this.email(oForward.email);
	}
	else
	{
		Ajax.send('GetForward', {'AccountID': oAccount.id()}, this.onGetForwardResponse, this);
	}
	
	this.updateSavedState();
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAccountForwardPaneView.prototype.onGetForwardResponse = function (oResponse, oRequest)
{
	if (oResponse && oResponse.Result)
	{
		var
			oParameters = oRequest.Parameters,
			iAccountId = Types.pInt(oParameters.AccountID),
			oAccount = AccountList.getAccount(iAccountId),
			oForward = new CForwardModel()
		;

		if (oAccount)
		{
			oForward.parse(iAccountId, oResponse.Result);
			oAccount.forward(oForward);

			if (iAccountId === AccountList.editedId())
			{
				this.populate();
			}
		}
	}
};

module.exports = new CAccountForwardPaneView();
