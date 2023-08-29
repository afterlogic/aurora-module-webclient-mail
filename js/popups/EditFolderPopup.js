'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	MailCache = require('modules/%ModuleName%/js/Cache.js')
;

/**
 * @constructor
 */
function CEditFolderPopup()
{
	CAbstractPopup.call(this);
	
	this.isSaving = ko.observable(false);
	MailCache.folderListLoading.subscribe(function () {
		var bListLoading = MailCache.folderListLoading.indexOf(MailCache.editedFolderList().iAccountId) !== -1;
		if (!bListLoading && this.isSaving())
		{
			this.isSaving(false);
			this.closePopup();
		}
	}, this);

	this.options = ko.observableArray([]);

	this.parentFolder = ko.observable('');
	this.folderName = ko.observable('');
	this.folderNameFocus = ko.observable(false);
	
	this.oFolder = null;

	this.defaultOptionsAfterRender = Utils.defaultOptionsAfterRender;
}

_.extendOwn(CEditFolderPopup.prototype, CAbstractPopup.prototype);

CEditFolderPopup.prototype.PopupTemplate = '%ModuleName%_Settings_EditFolderPopup';

/**
 * @param {object} oFolder
 */
CEditFolderPopup.prototype.onOpen = function (oFolder)
{
	this.oFolder = oFolder;
	this.options(MailCache.editedFolderList().getOptions(TextUtils.i18n('%MODULENAME%/LABEL_NO_PARENT_FOLDER'), true, false, true, false, [oFolder.fullName()]));
	
	this.parentFolder(oFolder.parentFullName());
	this.folderName(oFolder.name());
	this.folderNameFocus(true);
};

CEditFolderPopup.prototype.save = function ()
{
	if (this.oFolder.parentFullName() !== this.parentFolder())
	{
		var
			oParameters = {
				'AccountID': this.oFolder.iAccountId,
				'PrevFolderFullNameRaw': this.oFolder.fullName(),
				'NewFolderNameInUtf8': this.folderName(),
				'ChangeParent': true,
				'NewParentFolder': this.parentFolder()
			}
		;

		this.isSaving(true);
		Ajax.send('RenameFolder', oParameters, _.bind(this.onResponseFolderRename, this), this);
	}
	else if (this.oFolder.name() !== this.folderName())
	{
		var
			oParameters = {
				'AccountID': this.oFolder.iAccountId,
				'PrevFolderFullNameRaw': this.oFolder.fullName(),
				'NewFolderNameInUtf8': this.folderName(),
				'ChangeParent': false
			}
		;

		this.isSaving(true);
		Ajax.send('RenameFolder', oParameters, _.bind(this.onResponseFolderRename, this), this);
	}
	else
	{
		this.closePopup();
	}
};

CEditFolderPopup.prototype.onResponseFolderRename = function (oResponse, oRequest)
{
	if (oResponse && oResponse.Result && oResponse.Result.FullName)
	{
		MailCache.getFolderList(AccountList.editedId());
	}
	else
	{
		this.isSaving(false);
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_RENAME_FOLDER'));
		MailCache.getFolderList(AccountList.editedId());
	}
};

CEditFolderPopup.prototype.cancelPopup = function ()
{
	if (!this.isSaving())
	{
		this.closePopup();
	}
};

module.exports = new CEditFolderPopup();
