'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CChangeLayoutPopup()
{
	CAbstractPopup.call(this);
	
	this.isSaving = ko.observable(false);

	this.aMessageListItemSizeValues = [
		{ text: TextUtils.i18n('%MODULENAME%/LABEL_MESSAGE_LIST_ITEM_SIZE_BIG'), value: 'big' },
		{ text: TextUtils.i18n('%MODULENAME%/LABEL_MESSAGE_LIST_ITEM_SIZE_SMALL'), value: 'small' },
		{ text: TextUtils.i18n('%MODULENAME%/LABEL_MESSAGE_LIST_ITEM_SIZE_TINY'), value: 'tiny' }
	];
	this.messageListItemSize = ko.observable(Settings.MessageListItemSize);

	this.aPreviewPanePositionValues = [
		{ text: TextUtils.i18n('%MODULENAME%/LABEL_PREVIEW_PANE_POSITION_RIGHT'), value: 'right' },
		{ text: TextUtils.i18n('%MODULENAME%/LABEL_PREVIEW_PANE_POSITION_BOTTOM'), value: 'bottom' },
		{ text: TextUtils.i18n('%MODULENAME%/LABEL_PREVIEW_PANE_POSITION_NONE'), value: 'none' }
	];
	this.previewPanePosition = ko.observable(Settings.PreviewPanePosition);

	this.openMessagesInPopup = ko.observable(Settings.OpenMessagesInPopup);
}

_.extendOwn(CChangeLayoutPopup.prototype, CAbstractPopup.prototype);

CChangeLayoutPopup.prototype.PopupTemplate = '%ModuleName%_ChangeLayoutPopup';

CChangeLayoutPopup.prototype.onOpen = function ()
{
	this.messageListItemSize(Settings.MessageListItemSize);
	this.previewPanePosition(Settings.PreviewPanePosition);
	this.openMessagesInPopup(Settings.OpenMessagesInPopup);
};

CChangeLayoutPopup.prototype.save = function ()
{
	var
		oParameters = {
			'MessageListItemSize': this.messageListItemSize(),
			'PreviewPanePosition': this.previewPanePosition(),
			'OpenMessagesInPopup': this.openMessagesInPopup()
		}
	;

	this.isSaving(true);

	Ajax.send('%ModuleName%', 'UpdateLayoutSettings', oParameters, this.onSaveLayoutSettingsResponse, this);
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CChangeLayoutPopup.prototype.onSaveLayoutSettingsResponse = function (oResponse, oRequest)
{
	this.isSaving(false);
	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_SAVE_LAYOUT_SETTINGS'));
	}
	else
	{
		var oParameters = oRequest.Parameters;
		if (oParameters.MessageListItemSize !== Settings.MessageListItemSize ||
			oParameters.PreviewPanePosition !== Settings.PreviewPanePosition ||
			oParameters.OpenMessagesInPopup !== Settings.OpenMessagesInPopup)
		{
			window.location.reload();
		}
	}
};

module.exports = new CChangeLayoutPopup();
