'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	CoreAjax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 * 
 * @param {Object} oParent
 * @param {boolean} bCreate
 */
function CAliasSettingsFormView(oParent, bCreate)
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.alias = ko.observable(null);
	
	this.oParent = oParent;
	this.bCreate = bCreate;

	this.disableRemoveAlias = ko.observable(bCreate);
	this.friendlyName = ko.observable('');
	this.friendlyNameHasFocus = ko.observable(false);
}

_.extendOwn(CAliasSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CAliasSettingsFormView.prototype.ViewTemplate = '%ModuleName%_Settings_AliasSettingsFormView';
CAliasSettingsFormView.prototype.ViewConstructorName = 'CAliasSettingsFormView';

/**
 * @param {Object} oAlias
 */
CAliasSettingsFormView.prototype.onShow = function (oAlias)
{
	this.alias(oAlias && oAlias.ALIAS ? oAlias : null);
	this.populate();
};

CAliasSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.friendlyName()
	];
};

CAliasSettingsFormView.prototype.getParametersForSave = function ()
{
	if (this.alias())
	{
		var
			oParameters = {
				'AccountID': this.alias().accountId(),
				'FriendlyName': this.friendlyName()
			}
		;

		if (!this.bCreate)
		{
			oParameters.EntityId = this.alias().id();
		}

		return oParameters;
	}
	
	return {};
};

CAliasSettingsFormView.prototype.save = function ()
{
	this.isSaving(true);
	this.updateSavedState();
	CoreAjax.send(Settings.AliasesServerModuleName, this.bCreate ? 'CreateAlias' : 'UpdateAlias', this.getParametersForSave(), this.onResponse, this);
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAliasSettingsFormView.prototype.onResponse = function (oResponse, oRequest)
{
	this.isSaving(false);

	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_ALIAS_ADDING'));
	}
	else
	{
		var oParameters = oRequest.Parameters;
		
		AccountList.populateAliases(function () {
			var
				oCurrAccount = AccountList.getCurrent(),
				aCurrAliases = oCurrAccount.aliases(),
				oCreatedAlias = _.find(aCurrAliases, function (oAlias) {
					return oAlias.id() === oResponse.Result;
				})
			;
			if (oCreatedAlias)
			{
				ModulesManager.run('SettingsWebclient', 'setAddHash', [['alias', oCreatedAlias.hash()]]);
			}
		});
		
		if (this.bCreate && _.isFunction(this.oParent.closePopup))
		{
			this.oParent.closePopup();
		}

		Screens.showReport(TextUtils.i18n('COREWEBCLIENT/REPORT_SETTINGS_UPDATE_SUCCESS'));
	}
};

CAliasSettingsFormView.prototype.populate = function ()
{
	var oAlias = this.alias();
	
	if (oAlias)
	{
		this.disableRemoveAlias(this.bCreate);
		this.friendlyName(oAlias.friendlyName());

		setTimeout(function () {
			this.updateSavedState();
		}.bind(this), 1);
	}
};

CAliasSettingsFormView.prototype.remove = function ()
{
	if (this.alias())
	{
		var oParameters = {
			'AccountID': this.alias().accountId(),
			'Aliases': [this.alias().email()]
		};

		CoreAjax.send(Settings.AliasesServerModuleName, 'DeleteAliases', oParameters, this.onAccountAliasDeleteResponse, this);

		if (!this.bCreate && _.isFunction(this.oParent.onRemoveAlias))
		{
			this.oParent.onRemoveAlias();
		}
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAliasSettingsFormView.prototype.onAccountAliasDeleteResponse = function (oResponse, oRequest)
{
	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_ALIAS_DELETING'));
	}
	AccountList.populateAliases();
};

CAliasSettingsFormView.prototype.cancel = function ()
{
	if (_.isFunction(this.oParent.cancelPopup))
	{
		this.oParent.cancelPopup();
	}
};

module.exports = CAliasSettingsFormView;
