'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	MailCache = require('modules/%ModuleName%/js/Cache.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CServerPropertiesView = require('modules/%ModuleName%/js/views/CServerPropertiesView.js')
;

/**
 * @constructor
 */
function CFetcherIncomingPaneView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.bShown = false;
	
	this.fetcher = ko.observable(null);
	this.idFetcher = ko.observable(null);

	this.isEnabled = ko.observable(true);

	this.incomingLogin = ko.observable('');
	this.incomingPassword = ko.observable('');
	this.oIncoming = new CServerPropertiesView(110, 995, 'fetcher_edit_incoming', TextUtils.i18n('%MODULENAME%/LABEL_POP3_SERVER'));

	this.sFetcherFolder = '';
	this.folder = ko.observable('');
	this.options = ko.observableArray([]);
	MailCache.folderList.subscribe(function () {
		this.populateOptions();
	}, this);

	this.leaveMessagesOnServer = ko.observable(false);

	this.passwordIsSelected = ko.observable(false);

	this.defaultOptionsAfterRender = Utils.defaultOptionsAfterRender;
}

_.extendOwn(CFetcherIncomingPaneView.prototype, CAbstractSettingsFormView.prototype);

CFetcherIncomingPaneView.prototype.ViewTemplate = '%ModuleName%_Settings_FetcherIncomingPaneView';

/**
 * @param {Object} oFetcher
 */
CFetcherIncomingPaneView.prototype.show = function (oFetcher)
{
	this.bShown = true;
	this.fetcher(oFetcher && oFetcher.FETCHER ? oFetcher : null);
	this.populateOptions();
	this.populate();
};

/**
 * @param {Function} fShowNewTab
 */
CFetcherIncomingPaneView.prototype.hide = function (fShowNewTab)
{
	this.bShown = false;
	fShowNewTab();
};

CFetcherIncomingPaneView.prototype.populateOptions = function ()
{
	if (this.bShown)
	{
		this.options(MailCache.folderList().getOptions('', true, false, false));
		if (this.sFetcherFolder !== this.folder())
		{
			this.folder(this.sFetcherFolder);
			this.updateSavedState();
		}
	}
};

CFetcherIncomingPaneView.prototype.getCurrentValues = function ()
{
	return [
		this.isEnabled(),
		this.oIncoming.server(),
		this.oIncoming.port(),
		this.oIncoming.ssl(),
		this.incomingPassword(),
		this.folder(),
		this.leaveMessagesOnServer()
	];
};

CFetcherIncomingPaneView.prototype.getParametersForSave = function ()
{
	if (this.fetcher())
	{
		return {
			'AccountID': AccountList.editedId(),
			'FetcherID': this.idFetcher(),
			'IsEnabled': this.isEnabled() ? 1 : 0,
			'Folder': this.folder(),
			'IncomingServer': this.oIncoming.server(),
			'IncomingPort': this.oIncoming.getIntPort(),
			'IncomingUseSsl': this.oIncoming.ssl(),
			'IncomingPassword': (this.incomingPassword() === '') ? '******' : this.incomingPassword(),
			'LeaveMessagesOnServer': this.leaveMessagesOnServer() ? 1 : 0
		};
	}
	
	return {};
};

CFetcherIncomingPaneView.prototype.save = function ()
{
	if (this.isEmptyRequiredFields())
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_REQUIRED_FIELDS_EMPTY'));
	}
	else
	{
		this.isSaving(true);

		this.updateSavedState();

		Ajax.send('UpdateFetcher', this.getParametersForSave(), this.onResponse, this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CFetcherIncomingPaneView.prototype.onResponse = function (oResponse, oRequest)
{
	this.isSaving(false);

	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_UNKNOWN'));
	}
	else
	{
		AccountList.populateFetchers();
		
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_SUCCESSFULLY_SAVED'));
	}
};

CFetcherIncomingPaneView.prototype.populate = function ()
{
	var oFetcher = this.fetcher();
	
	if (oFetcher)
	{
		this.sFetcherFolder = oFetcher.folder();

		this.idFetcher(oFetcher.id());

		this.isEnabled(oFetcher.isEnabled());

		this.folder(oFetcher.folder());
		this.oIncoming.set(oFetcher.incomingServer(), oFetcher.incomingPort(), oFetcher.incomingUseSsl());
		this.incomingLogin(oFetcher.incomingLogin());
		this.incomingPassword('******');
		this.leaveMessagesOnServer(oFetcher.leaveMessagesOnServer());

		this.updateSavedState();
	}
};
CFetcherIncomingPaneView.prototype.isEmptyRequiredFields = function ()
{
	if (this.oIncoming.server() === '')
	{
		this.oIncoming.server.focused(true);
		return true;
	}
	
	if (this.incomingPassword() === '')
	{
		this.passwordIsSelected(true);
		return true;
	}
	
	return false;
};

module.exports = new CFetcherIncomingPaneView();
