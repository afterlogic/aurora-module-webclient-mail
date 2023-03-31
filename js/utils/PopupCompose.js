'use strict';

var
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),

	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),
	PrivateMessagingUtils = require('modules/%ModuleName%/js/utils/PrivateMessaging.js'),

	PopupComposeUtils = {}
;

function GetComposePopup(isPrivate = false)
{
	const ComposePopup = require('modules/%ModuleName%/js/popups/ComposePopup.js');
	ComposePopup.setPrivate(isPrivate);
	return ComposePopup;
}

PopupComposeUtils.composeMessage = function (isPrivate = false)
{
	Popups.showPopup(GetComposePopup(isPrivate));
};

/**
 * @param {object} message
 */
PopupComposeUtils.composeMessageFromDrafts = function (message)
{
	const isPrivate = PrivateMessagingUtils.isPrivateMessage(message);
	const params = LinksUtils.getComposeFromMessage('drafts', isPrivate, message.accountId(), message.folder(), message.uid());
	params.shift();
	Popups.showPopup(GetComposePopup(isPrivate), [params]);
};

/**
 * @param {string} sReplyType
 * @param {object} message
 */
PopupComposeUtils.composeMessageAsReplyOrForward = function (sReplyType, message)
{
	const isPrivate = PrivateMessagingUtils.isPrivateMessage(message);
	const params = LinksUtils.getComposeFromMessage(sReplyType, isPrivate, message.accountId(), message.folder(), message.uid());
	params.shift();
	Popups.showPopup(GetComposePopup(isPrivate), [params]);
};

/**
 * @param {string} sToAddresses
 */
PopupComposeUtils.composeMessageToAddresses = function (sToAddresses)
{
	var aParams = LinksUtils.getComposeWithToField(sToAddresses);
	aParams.shift();
	Popups.showPopup(GetComposePopup(), [aParams]);
};

PopupComposeUtils.composeMessageWithData = function (oData)
{
	var aParams = LinksUtils.getComposeWithData(oData);
	aParams.shift();
	Popups.showPopup(GetComposePopup(), [aParams]);
};

/**
 * @param {Object} oMessage
 */
PopupComposeUtils.composeMessageWithEml = function (oMessage)
{
	var aParams = LinksUtils.getComposeWithEmlObject(oMessage.accountId(), oMessage.folder(), oMessage.uid(), oMessage);
	aParams.shift();
	Popups.showPopup(GetComposePopup(), [aParams]);
};

/**
 * @param {Array} aFileItems
 */
PopupComposeUtils.composeMessageWithAttachments = function (aFileItems)
{
	var aParams = LinksUtils.getComposeWithObject('attachments', aFileItems);
	aParams.shift();
	Popups.showPopup(GetComposePopup(), [aParams]);
};

PopupComposeUtils.closeComposePopup = function (iAccountId)
{
	var ComposePopup = GetComposePopup();
	if (ComposePopup.opened() && (!iAccountId || ComposePopup.senderAccountId() === iAccountId))
	{
		Popups.showPopup(ComposePopup, [['close']]);
	}
};

module.exports = PopupComposeUtils;