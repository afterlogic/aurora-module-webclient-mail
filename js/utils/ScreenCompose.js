'use strict';

var
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	
	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),
	
	ScreenComposeUtils = {}
;

ScreenComposeUtils.composeMessage = function ()
{
	Routing.setHash(LinksUtils.getCompose());
};

/**
 * @param {string} sFolder
 * @param {string} sUid
 */
ScreenComposeUtils.composeMessageFromDrafts = function (sFolder, sUid)
{
	var aParams = LinksUtils.getComposeFromMessage('drafts', sFolder, sUid);
	Routing.setHash(aParams);
};

/**
 * @param {string} sReplyType
 * @param {string} sFolder
 * @param {string} sUid
 */
ScreenComposeUtils.composeMessageAsReplyOrForward = function (sReplyType, sFolder, sUid)
{
	var aParams = LinksUtils.getComposeFromMessage(sReplyType, sFolder, sUid);
	Routing.setHash(aParams);
};

/**
 * @param {string} sToAddresses
 */
ScreenComposeUtils.composeMessageToAddresses = function (sToAddresses)
{
	var aParams = LinksUtils.getComposeWithToField(sToAddresses);
	Routing.setHash(aParams);
};

/**
 * @param {Object} oVcard
 */
ScreenComposeUtils.composeMessageWithVcard = function (oVcard)
{
	var aParams = ['vcard', oVcard];
	Routing.goDirectly(LinksUtils.getCompose(), aParams);
};

/**
 * @param {Object} oMessage
 */
ScreenComposeUtils.composeMessageWithEml = function (oMessage)
{
	var aParams = LinksUtils.getComposeWithEmlObject(oMessage.folder(), oMessage.uid(), oMessage);
	Routing.goDirectly(LinksUtils.compose(), aParams);
};

/**
 * @param {string} sArmor
 * @param {string} sDownloadLinkFilename
 */
ScreenComposeUtils.composeMessageWithPgpKey = function (sArmor, sDownloadLinkFilename)
{
	var aParams = ['data-as-file', sArmor, sDownloadLinkFilename];
	Routing.goDirectly(LinksUtils.getCompose(), aParams);
};

/**
 * @param {Array} aFileItems
 */
ScreenComposeUtils.composeMessageWithAttachments = function (aFileItems)
{
	var aParams = LinksUtils.getComposeWithObject('attachments', aFileItems);
	Routing.goDirectly(LinksUtils.getCompose(), aParams);
};

module.exports = ScreenComposeUtils;