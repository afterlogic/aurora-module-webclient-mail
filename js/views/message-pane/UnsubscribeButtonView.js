'use strict';

const
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),

	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	MailCache  = require('modules/%ModuleName%/js/Cache.js')
;

/**
 * @constructor
 */
function CUnsubscribeButtonView()
{
	this.allowUnsubscribe = ko.observable(true);
	MailCache.currentMessage.subscribe(function () {
		this.allowUnsubscribe(MailCache.currentMessage() && MailCache.currentMessage().canUnsubscribe());
	}, this);
}

CUnsubscribeButtonView.prototype.ViewTemplate = '%ModuleName%_Message_UnsubscribeButtonView';

CUnsubscribeButtonView.prototype.unsubscribe = function ()
{
	const currentMessage = MailCache.currentMessage();
	if (currentMessage) {
		const parameters = {
			'AccountID': currentMessage.accountId(),
			'Folder': currentMessage.folder(),
			'Uid': currentMessage.uid()
		}
		Ajax.send('Unsubscribe', parameters, this.onUnsubscribeResponse, this);
	}
};

CUnsubscribeButtonView.prototype.onUnsubscribeResponse = function (response, request)
{
	if (response && response.Result) {
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_UNSUBSCRIBE_MESSAGE_SUCCESS'));
	} else {
		Api.showErrorByCode(response, TextUtils.i18n('%MODULENAME%/ERROR_UNSUBSCRIBE_MESSAGE_FAIL'));
	}
};

module.exports = new CUnsubscribeButtonView();
