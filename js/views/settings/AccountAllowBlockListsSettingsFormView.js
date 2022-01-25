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

	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js')
;

/**
 * @constructor
 */ 
function CAccountAllowBlockListsSettingsFormView()
{
	CAbstractSettingsFormView.call(this, '%ModuleName%');

	this.spamScore = ko.observable('');
	this.allowList = ko.observable('');
	this.blockList = ko.observable('');
}

_.extendOwn(CAccountAllowBlockListsSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CAccountAllowBlockListsSettingsFormView.prototype.ViewTemplate = '%ModuleName%_Settings_AccountAllowBlockListsSettingsFormView';

CAccountAllowBlockListsSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.spamScore(),
		this.allowList(),
		this.blockList()
	];
};

CAccountAllowBlockListsSettingsFormView.prototype.onShow = function ()
{
	this.populate();
};

CAccountAllowBlockListsSettingsFormView.prototype.getParametersForSave = function ()
{
	return {
		'AccountID': AccountList.editedId(),
		'SpamScore': Types.pInt(this.spamScore()),
		'AllowList': this.allowList() !== '' ? this.allowList().split('\n') : [],
		'BlockList': this.blockList() !== '' ? this.blockList().split('\n') : []
	};
};

CAccountAllowBlockListsSettingsFormView.prototype.save = function ()
{
	this.isSaving(true);

	this.updateSavedState();

	Ajax.send('SetAccountSpamSettings', this.getParametersForSave(), this.onResponse, this);
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAccountAllowBlockListsSettingsFormView.prototype.onResponse = function (oResponse, oRequest)
{
	this.isSaving(false);

	if (oResponse.Result === false)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_SAVING_SETTINGS_FAILED'));
	}
	else
	{
		Screens.showReport(TextUtils.i18n('COREWEBCLIENT/REPORT_SETTINGS_UPDATE_SUCCESS'));
	}
};

CAccountAllowBlockListsSettingsFormView.prototype.populate = function()
{
	var oAccount = AccountList.getEdited();
	
	if (oAccount)
	{
		Ajax.send('GetAccountSpamSettings', {'AccountID': oAccount.id()}, this.onGetAllowBlockListsResponse, this);
	}
	
	this.updateSavedState();
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAccountAllowBlockListsSettingsFormView.prototype.onGetAllowBlockListsResponse = function (oResponse, oRequest)
{
	var oResult = oResponse && oResponse.Result;
	if (oResult)
	{
		var
			iSpamScore = Types.pInt(oResult.SpamScore),
			aAllowList = Types.pArray(oResult.AllowList),
			aBlockList = Types.pArray(oResult.BlockList)
		;

		this.spamScore(iSpamScore);
		this.allowList(aAllowList.join('\n'));
		this.blockList(aBlockList.join('\n'));

		this.updateSavedState();
	}
};

module.exports = new CAccountAllowBlockListsSettingsFormView();
