'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 * 
 * @param {Object} oParent
 * @param {boolean} bCreate
 */
function CIdentityPropertiesPaneView(oParent, bCreate)
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.identity = ko.observable(null);
	
	this.oParent = oParent;
	this.bCreate = bCreate;

	this.disableCheckbox = ko.observable(false);

	this.isDefault = ko.observable(false);
	this.email = ko.observable('');
	this.accountPart = ko.observable(false);
	this.friendlyName = ko.observable('');
	this.friendlyNameHasFocus = ko.observable(false);
}

_.extendOwn(CIdentityPropertiesPaneView.prototype, CAbstractSettingsFormView.prototype);

CIdentityPropertiesPaneView.prototype.ViewTemplate = '%ModuleName%_Settings_IdentityPropertiesPaneView';
CIdentityPropertiesPaneView.prototype.ViewConstructorName = 'CIdentityPropertiesPaneView';

/**
 * @param {Object} oIdentity
 */
CIdentityPropertiesPaneView.prototype.show = function (oIdentity)
{
	this.identity(oIdentity && !oIdentity.FETCHER ? oIdentity : null);
	this.populate();
};

CIdentityPropertiesPaneView.prototype.getCurrentValues = function ()
{
	return [
		this.friendlyName(),
		this.email()
	];
};

CIdentityPropertiesPaneView.prototype.getParametersForSave = function ()
{
	if (this.identity())
	{
		var
			oParameters = {
				'AccountID': this.identity().accountId(),
				'Default': this.isDefault(),
				'FriendlyName': this.friendlyName(),
				'AccountPart': this.identity().bAccountPart
			}
		;

		if (!this.identity().bAccountPart)
		{
			_.extendOwn(oParameters, {
				'Email': this.email()
			});

			if (!this.bCreate)
			{
				oParameters.EntityId = this.identity().id();
			}
		}

		return oParameters;
	}
	
	return {};
};

CIdentityPropertiesPaneView.prototype.save = function ()
{
	if (this.email() === '')
	{
		Screens.showError(Utils.i18n('%MODULENAME%/ERROR_IDENTITY_FIELDS_BLANK'));
	}
	else
	{
		this.isSaving(true);

		this.updateSavedState();

		Ajax.send(this.bCreate ? 'CreateIdentity' : 'UpdateIdentity', this.getParametersForSave(), this.onResponse, this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CIdentityPropertiesPaneView.prototype.onResponse = function (oResponse, oRequest)
{
	this.isSaving(false);

	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_IDENTITY_ADDING'));
	}
	else
	{
		var
			oParameters = oRequest.Parameters,
			iAccountId = Types.pInt(oParameters.AccountID),
			oAccount = 0 < iAccountId ? AccountList.getAccount(iAccountId) : null
		;
		
		AccountList.populateIdentities();
		
		if (this.bCreate && $.isFunction(this.oParent.closePopup))
		{
			this.oParent.closePopup();
		}

		if (oParameters.AccountPart && oAccount)
		{
			oAccount.updateFriendlyName(oParameters.FriendlyName);
		}

		this.disableCheckbox(this.isDefault());
		
		Screens.showReport(TextUtils.i18n('COREWEBCLIENT/REPORT_SETTINGS_UPDATE_SUCCESS'));
	}
};

CIdentityPropertiesPaneView.prototype.populate = function ()
{
	var oIdentity = this.identity();
	
	if (oIdentity)
	{
		this.isDefault(oIdentity.isDefault());
		this.email(oIdentity.email());
		this.accountPart(oIdentity.bAccountPart);
		this.friendlyName(oIdentity.friendlyName());

		this.disableCheckbox(oIdentity.isDefault());

		setTimeout(function () {
			this.updateSavedState();
		}.bind(this), 1);
	}
};

CIdentityPropertiesPaneView.prototype.remove = function ()
{
	if (this.identity() && !this.identity().bAccountPart)
	{
		var oParameters = {
			'AccountID': this.identity().accountId(),
			'EntityId': this.identity().id()
		};

		Ajax.send('DeleteIdentity', oParameters, this.onAccountIdentityDeleteResponse, this);

		if (!this.bCreate && $.isFunction(this.oParent.onRemoveIdentity))
		{
			this.oParent.onRemoveIdentity();
		}
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CIdentityPropertiesPaneView.prototype.onAccountIdentityDeleteResponse = function (oResponse, oRequest)
{
	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_IDENTITY_DELETING'));
	}
	AccountList.populateIdentities();
};

CIdentityPropertiesPaneView.prototype.cancel = function ()
{
	if ($.isFunction(this.oParent.cancelPopup))
	{
		this.oParent.cancelPopup();
	}
};

module.exports = CIdentityPropertiesPaneView;
