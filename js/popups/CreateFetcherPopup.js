'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	CreateFolderPopup = require('modules/%ModuleName%/js/popups/CreateFolderPopup.js'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	MailCache = require('modules/%ModuleName%/js/Cache.js'),
	
	CServerPropertiesView = require('modules/%ModuleName%/js/views/CServerPropertiesView.js')
;

/**
 * @constructor
 */
function CCreateFetcherPopup()
{
	CAbstractPopup.call(this);
	
	this.loading = ko.observable(false);
	this.newFolderCreating = ko.observable(false);

	this.incomingLogin = ko.observable('');
	this.incomingPassword = ko.observable('');
	this.oIncoming = new CServerPropertiesView(110, 995, 'fectcher_add_incoming', TextUtils.i18n('%MODULENAME%/LABEL_POP3_SERVER'));

	this.folder = ko.observable('');
	this.options = ko.observableArray([]);
	MailCache.folderList.subscribe(function () {
		this.populateOptions();
	}, this);

	this.addNewFolderCommand = Utils.createCommand(this, this.onAddNewFolderClick);

	this.leaveMessagesOnServer = ko.observable(false);

	this.loginIsSelected = ko.observable(false);
	this.passwordIsSelected = ko.observable(false);

	this.defaultOptionsAfterRender = Utils.defaultOptionsAfterRender;
}

_.extendOwn(CCreateFetcherPopup.prototype, CAbstractPopup.prototype);

CCreateFetcherPopup.prototype.PopupTemplate = '%ModuleName%_Settings_CreateFetcherPopup';

CCreateFetcherPopup.prototype.onShow = function ()
{
	this.bShown = true;
	this.populateOptions();
	
	this.incomingLogin('');
	this.incomingPassword('');
	this.oIncoming.clear();

	this.folder('');

	this.leaveMessagesOnServer(true);
};

CCreateFetcherPopup.prototype.populateOptions = function ()
{
	if (this.bShown)
	{
		this.options(MailCache.folderList().getOptions('', true, false, false));
	}
};

CCreateFetcherPopup.prototype.onHide = function ()
{
	this.bShown = false;
};

CCreateFetcherPopup.prototype.save = function ()
{
	if (this.isEmptyRequiredFields())
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_REQUIRED_FIELDS_EMPTY'));
	}
	else
	{
		var oParameters = {
			'AccountID': AccountList.editedId(),
			'Folder': this.folder(),
			'IncomingLogin': this.incomingLogin(),
			'IncomingPassword': (this.incomingPassword() === '') ? '******' : this.incomingPassword(),
			'IncomingServer': this.oIncoming.server(),
			'IncomingPort': this.oIncoming.getIntPort(),
			'IncomingUseSsl': this.oIncoming.ssl(),
			'LeaveMessagesOnServer': this.leaveMessagesOnServer() ? 1 : 0
		};

		this.loading(true);

		Ajax.send('CreateFetcher', oParameters, this.onCreateFetcherResponse, this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CCreateFetcherPopup.prototype.onCreateFetcherResponse = function (oResponse, oRequest)
{
	this.loading(false);

	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_UNKNOWN'));
	}
	else
	{
		AccountList.populateFetchers();

		this.closePopup();
	}
};

CCreateFetcherPopup.prototype.cancelPopup = function ()
{
	if (!this.newFolderCreating())
	{
		this.closePopup();
	}
};

CCreateFetcherPopup.prototype.isEmptyRequiredFields = function ()
{
	switch ('')
	{
		case this.oIncoming.server():
			this.oIncoming.server.focused(true);
			return true;
		case this.incomingLogin():
			this.loginIsSelected(true);
			return true;
		case this.incomingPassword():
			this.passwordIsSelected(true);
			return true;
		default: return false;
	}
};

CCreateFetcherPopup.prototype.onAddNewFolderClick = function ()
{
	this.newFolderCreating(true);
	Popups.showPopup(CreateFolderPopup, [_.bind(this.chooseFolderInList, this)]);
};

/**
 * @param {string} sFolderName
 * @param {string} sParentFullName
 */
CCreateFetcherPopup.prototype.chooseFolderInList = function (sFolderName, sParentFullName)
{
	var
		sDelimiter = MailCache.folderList().sDelimiter,
		aFolder = []
	;
	
	if (sFolderName !== '' && sParentFullName !== '')
	{
		this.options(MailCache.folderList().getOptions('', true, false, false));
		
		_.each(this.options(), _.bind(function (oOption) {
			if (sFolderName === oOption.name)
			{
				aFolder = oOption.fullName.split(sDelimiter);
				aFolder.pop();
				if (sParentFullName === aFolder.join(sDelimiter))
				{
					this.folder(oOption.fullName);
				}
			}
		}, this));
	}
	
	this.newFolderCreating(false);
};

module.exports = new CCreateFetcherPopup();
