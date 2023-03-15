'use strict';

var
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),

	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),
	PrivateComposeUtils = require('modules/%ModuleName%/js/utils/PrivateCompose.js'),

	ScreenComposeUtils = {}
;

ScreenComposeUtils.composeMessage = function (isPrivate = false)
{
	Routing.setHash(LinksUtils.getCompose(isPrivate));
};

/**
 * @param {object} message
 */
ScreenComposeUtils.composeMessageFromDrafts = function (message)
{
	const isPrivate = PrivateComposeUtils.isPrivateMessage(message);
	const params = LinksUtils.getComposeFromMessage('drafts', isPrivate, message.accountId(), message.folder(), message.uid());
	Routing.setHash(params);
};

/**
 * @param {string} sReplyType
 * @param {object} message
 */
ScreenComposeUtils.composeMessageAsReplyOrForward = function (sReplyType, message)
{
	const isPrivate = PrivateComposeUtils.shouldMessageReplyBePrivate(message);
	var params = LinksUtils.getComposeFromMessage(sReplyType, isPrivate, message.accountId(), message.folder(), message.uid());
	Routing.setHash(params);
};

/**
 * @param {string} sToAddresses
 */
ScreenComposeUtils.composeMessageToAddresses = function (sToAddresses)
{
	var aParams = LinksUtils.getComposeWithToField(sToAddresses);
	Routing.setHash(aParams);
};

ScreenComposeUtils.composeMessageWithData = function (oData)
{
	var aParams = LinksUtils.getComposeWithData(oData);
	aParams.shift();
	aParams.shift();
	Routing.goDirectly(LinksUtils.getCompose(), aParams);
};

/**
 * @param {Object} oMessage
 */
ScreenComposeUtils.composeMessageWithEml = function (oMessage)
{
	var aParams = LinksUtils.getComposeWithEmlObject(oMessage.accountId(), oMessage.folder(), oMessage.uid(), oMessage);
	aParams.shift();
	aParams.shift();
	Routing.goDirectly(LinksUtils.getCompose(), aParams);
};

/**
 * @param {Array} aFileItems
 */
ScreenComposeUtils.composeMessageWithAttachments = function (aFileItems)
{
	var aParams = LinksUtils.getComposeWithObject('attachments', aFileItems);
	aParams.shift();
	aParams.shift();
	Routing.goDirectly(LinksUtils.getCompose(), aParams);
};

module.exports = ScreenComposeUtils;