'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	Browser = require('%PathToCoreWebclientModule%/js/Browser.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CHtmlEditorView = require('modules/%ModuleName%/js/views/CHtmlEditorView.js')
;

/**
 * @constructor
 */ 
function CSignaturePaneView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.fetcherOrIdentity = ko.observable(null);
	
	this.useSignatureRadio = ko.observable('0');
	this.signature = ko.observable('');

	this.oHtmlEditor = new CHtmlEditorView(true);
	this.enableImageDragNDrop = ko.observable(false);

	this.enabled = ko.observable(true);
}

_.extendOwn(CSignaturePaneView.prototype, CAbstractSettingsFormView.prototype);

CSignaturePaneView.prototype.ViewTemplate = '%ModuleName%_Settings_SignaturePaneView';
CSignaturePaneView.prototype.ViewConstructorName = 'CSignaturePaneView';

/**
 * @param {Object} oFetcherOrIdentity
 */
CSignaturePaneView.prototype.show = function (oFetcherOrIdentity)
{
	this.fetcherOrIdentity(oFetcherOrIdentity);
	this.populate();
	_.defer(_.bind(this.init, this));
};

CSignaturePaneView.prototype.init = function ()
{
	this.oHtmlEditor.initCrea(this.signature(), false, '');
	this.oHtmlEditor.setActivitySource(this.useSignatureRadio);
	this.enableImageDragNDrop(this.oHtmlEditor.editorUploader && this.oHtmlEditor.editorUploader.isDragAndDropSupported() && !Browser.ie10AndAbove);
};

CSignaturePaneView.prototype.getCurrentValues = function ()
{
	if (this.oHtmlEditor.oCrea)
	{
		this.signature(this.oHtmlEditor.getNotDefaultText());
	}
	return [
		this.useSignatureRadio(),
		this.signature()
	];
};

CSignaturePaneView.prototype.revert = function ()
{
	this.populate();
};

CSignaturePaneView.prototype.getParametersForSave = function ()
{
	this.signature(this.oHtmlEditor.getNotDefaultText());
	
	var
		oAccount = AccountList.getEdited(),
		oParameters = {
			'AccountID': oAccount ? oAccount.id() : 0,
			'UseSignature': this.useSignatureRadio() === '1',
			'Signature': this.signature()
		}
	;
	
	if (this.fetcherOrIdentity())
	{
		if (this.fetcherOrIdentity().FETCHER)
		{
			_.extendOwn(oParameters, { 'FetcherId': this.fetcherOrIdentity().id() });
		}
		else if (!this.fetcherOrIdentity().bAccountPart)
		{
			_.extendOwn(oParameters, { 'IdentityId': this.fetcherOrIdentity().id() });
		}
	}
	
	return oParameters;
};

/**
 * @param {Object} oParameters
 */
CSignaturePaneView.prototype.applySavedValues = function (oParameters)
{
	if (!oParameters.IdentityId)
	{
		var oAccount = AccountList.getEdited();
		if (oAccount)
		{
			oAccount.useSignature(!!oParameters.UseSignature);
			oAccount.signature(oParameters.Signature);
		}
	}
	AccountList.populateIdentities();
};

CSignaturePaneView.prototype.populate = function ()
{
	var
		oAccount = AccountList.getEdited(),
		oSignature = this.fetcherOrIdentity() || oAccount
	;
	
	if (oSignature)
	{
		this.useSignatureRadio(oSignature.useSignature() ? '1' : '0');
		this.signature(oSignature.signature());
		this.oHtmlEditor.setText(this.signature());
	}
	else if (oAccount)
	{
		Ajax.send('GetSignature', {'AccountID': oAccount.id()}, this.onGetSignatureResponse, this);
	}
	
	this.updateSavedState();
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CSignaturePaneView.prototype.onGetSignatureResponse = function (oResponse, oRequest)
{
	if (oResponse && oResponse.Result)
	{
		var
			oParameters = oRequest.Parameters,
			iAccountId = Types.pInt(oParameters.AccountID),
			oAccount = AccountList.getAccount(iAccountId)
		;

		if (oAccount)
		{
			this.parseSignature(oResponse.Result);

			if (iAccountId === AccountList.editedId())
			{
				this.populate();
			}
		}
	}
};

CSignaturePaneView.prototype.save = function ()
{
	this.isSaving(true);
	
	this.updateSavedState();
	
	Ajax.send('UpdateSignature', this.getParametersForSave(), this.onResponse, this);
};

/**
 * Parses the response from the server. If the settings are normally stored, then updates them. 
 * Otherwise an error message.
 * 
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CSignaturePaneView.prototype.onResponse = function (oResponse, oRequest)
{
	this.isSaving(false);
	
	if (oResponse.Result)
	{
		this.applySavedValues(oRequest.Parameters);
		Screens.showReport(TextUtils.i18n('COREWEBCLIENT/REPORT_SETTINGS_UPDATE_SUCCESS'));
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_SAVING_SETTINGS_FAILED'));
	}
};

module.exports = new CSignaturePaneView();
