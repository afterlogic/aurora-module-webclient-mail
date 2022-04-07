'use strict';

const
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),

	AlertPopup = require('%PathToCoreWebclientModule%/js/popups/AlertPopup.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),

	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	MailCache  = require('modules/%ModuleName%/js/Cache.js')
;

/**
 * @constructor
 */
function CUnsubscribeButtonView()
{
	this.unsubscribeOneClick = ko.observable(false);
	this.unsubscribeUrl = ko.observable('');
	this.unsubscribeEmail = ko.observable('');
	this.allowUnsubscribe = ko.observable(false);
	ko.computed(function () {
		const message = MailCache.currentMessage();
		this.unsubscribeOneClick(Types.pBool(message && message.unsubscribe.OneClick));
		this.unsubscribeUrl(Types.pString(message && message.unsubscribe.Url));
		this.unsubscribeEmail(Types.pString(message && message.unsubscribe.Email));
		console.log({OneClick: this.unsubscribeOneClick(), Url: this.unsubscribeUrl(), Email: this.unsubscribeEmail()});
		this.allowUnsubscribe(this.unsubscribeOneClick() || this.unsubscribeUrl() !== '' || this.unsubscribeEmail() !== '');
	}, this).extend({ rateLimit: 100 });
}

CUnsubscribeButtonView.prototype.ViewTemplate = '%ModuleName%_Message_UnsubscribeButtonView';

CUnsubscribeButtonView.prototype.unsubscribe = function ()
{
	const currentMessage = MailCache.currentMessage();
	if (currentMessage) {
		if (this.unsubscribeOneClick()) {
			const parameters = {
				'AccountID': currentMessage.accountId(),
				'Folder': currentMessage.folder(),
				'Uid': currentMessage.uid()
			};
			Ajax.send('Unsubscribe', parameters, this.onUnsubscribeResponse, this);
		} else if (this.unsubscribeEmail()) {
			Popups.showPopup(AlertPopup, [`unsubscribe Email: ${this.unsubscribeEmail()}`]);
		} else if (this.unsubscribeUrl()) {
			Popups.showPopup(AlertPopup, [`unsubscribe Url: ${this.unsubscribeUrl()}`]);
		}
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
