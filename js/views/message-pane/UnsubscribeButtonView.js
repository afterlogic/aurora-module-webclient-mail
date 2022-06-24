'use strict';

const
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),

	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),

	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),

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
		if (message && message.completelyFilled()) {
			this.unsubscribeOneClick(Types.pBool(message.unsubscribe.OneClick));
			this.unsubscribeUrl(Types.pString(message.unsubscribe.Url));
			this.unsubscribeEmail(Types.pString(message.unsubscribe.Email));
			this.allowUnsubscribe(this.unsubscribeOneClick() || this.unsubscribeUrl() !== '' || this.unsubscribeEmail() !== '');
		}
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
			this.unsubscribeWithEmail();
		} else if (this.unsubscribeUrl()) {
			window.open(this.unsubscribeUrl(), '_blank');
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

CUnsubscribeButtonView.prototype.unsubscribeWithEmail = function ()
{
	const
		parts = LinksUtils.parseToAddr(this.unsubscribeEmail()),
		recipients = _.compact([parts.to, parts.cc, parts.bcc]),
		confirmParams = {RECIPIENT: recipients.join(', '), SUBJECT: parts.subject},
		confirmText = parts.subject
			? TextUtils.i18n('%MODULENAME%/CONFIRM_UNSUBSCRIBE_WITH_EMAIL_AND_SUBJECT', confirmParams)
			: TextUtils.i18n('%MODULENAME%/CONFIRM_UNSUBSCRIBE_WITH_EMAIL', confirmParams),
		sendButtonText = TextUtils.i18n('%MODULENAME%/ACTION_SEND'),
		confirmCallback = (isConfirmed) => {
			if (isConfirmed) {
				this.sendUnsubscribeEmail(parts);
			}
		}
	;
	Popups.showPopup(ConfirmPopup, [confirmText, confirmCallback, '', sendButtonText]);
};

CUnsubscribeButtonView.prototype.sendUnsubscribeEmail = function (parts)
{
	const parameters = {
		'To': parts.to,
		'Cc': parts.cc,
		'Bcc': parts.bcc,
		'Subject': parts.subject,
		'Text': parts.body
	};
	Ajax.send('SendMessage', parameters, this.onUnsubscribeResponse, this);
};

module.exports = new CUnsubscribeButtonView();
