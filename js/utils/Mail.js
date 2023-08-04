'use strict';

var
	_ = require('underscore'),
			
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	UrlUtils = require('%PathToCoreWebclientModule%/js/utils/Url.js'),
	
	Storage = require('%PathToCoreWebclientModule%/js/Storage.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),

	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	MailCache = require('modules/%ModuleName%/js/Cache.js'),
	
	MailUtils = {}
;

MailUtils.isPermanentDelete = function ()
{
	if (!MailCache.isSearchInMultiFolders())
	{
		var
			oFolderList = MailCache.folderList(),
			sCurrFolder = oFolderList.currentFolderFullName(),
			oTrash = oFolderList.trashFolder(),
			bInTrash =(oTrash && sCurrFolder === oTrash.fullName()),
			oSpam = oFolderList.spamFolder(),
			bInSpam = (oSpam && sCurrFolder === oSpam.fullName())
		;
		return bInSpam || bInTrash;
	}
	return false;
};

/**
 * Moves the specified messages in the current folder to the Trash or delete permanently 
 * if the current folder is Trash or Spam.
 * 
 * @param {Array} aLongUids
 * @param {Function=} fAfterDelete
 */
MailUtils.deleteMessages = function (aLongUids, fAfterDelete)
{
	if (!_.isFunction(fAfterDelete))
	{
		fAfterDelete = function () {};
	}
	
	var
		bPermanentDelete = MailUtils.isPermanentDelete(),
		fDeleteMessages = function (bResult) {
			if (bResult)
			{
				MailUtils.actualDeleteMessages(aLongUids, bPermanentDelete, fAfterDelete);
			}
		}
	;

	if (bPermanentDelete)
	{
		Popups.showPopup(ConfirmPopup, [
			TextUtils.i18n('%MODULENAME%/CONFIRM_DELETE_MESSAGES_PLURAL', {}, null, aLongUids.length), 
			fDeleteMessages, '', TextUtils.i18n('COREWEBCLIENT/ACTION_DELETE')
		]);
	}
	else
	{
		fDeleteMessages(true);
	}
};

MailUtils.actualDeleteMessages = function (aLongUids, bPermanentDelete, fAfterDelete)
{
	var
		bDeleted = false,
		bDeleteAsked = false,
		oUidsByFolders = MailCache.getUidsSeparatedByFolders(aLongUids),
		fPermanentDeleteMessages = function (oAccFolder, aUids, bResult) {
			if (bResult)
			{
				MailCache.deleteMessagesFromFolder(oAccFolder, aUids);
				fAfterDelete();
			}
		}
	;

	_.each(oUidsByFolders, function (oData) {
		var
			iAccountId = oData.iAccountId,
			oFolderList = MailCache.oFolderListItems[iAccountId],
			oAccount = AccountList.getAccount(iAccountId),
			oAccTrash = oFolderList ? oFolderList.trashFolder() : null,
			oAccFolder = oFolderList ? oFolderList.getFolderByFullName(oData.sFolder) : null
		;
		if (oAccFolder)
		{
			if (bPermanentDelete)
			{
				fPermanentDeleteMessages(oAccFolder, oData.aUids, true);
				bDeleted = true;
			}
			else if (oAccTrash)
			{
				MailCache.moveMessagesToFolder(oAccFolder, oAccTrash, oData.aUids);
				bDeleted = true;
			}
			else
			{
				Popups.showPopup(ConfirmPopup, [
					TextUtils.i18n('%MODULENAME%/CONFIRM_MESSAGES_DELETE_NO_TRASH_FOLDER'),
					fPermanentDeleteMessages.bind(null, oAccFolder, oData.aUids),
					oAccount ? oAccount.fullEmail() : ''
				]);
				bDeleteAsked = true;
			}
		}
	});

	if (bDeleted && !bDeleteAsked)
	{
		fAfterDelete();
	}
};

MailUtils.isAvailableRegisterMailto = function ()
{
	return window.navigator && _.isFunction(window.navigator.registerProtocolHandler);
};

MailUtils.registerMailto = function (bRegisterOnce)
{
	if (MailUtils.isAvailableRegisterMailto() && (!bRegisterOnce || Storage.getData('aurora_mail_is-mailto-asked') !== true))
	{
		window.navigator.registerProtocolHandler(
			'mailto',
			UrlUtils.getAppPath() + '#mail/compose/to/%s',
			UserSettings.SiteName !== '' ? UserSettings.SiteName : 'WebMail'
		);

		Storage.setData('aurora_mail_is-mailto-asked', true);
	}
};

module.exports = MailUtils;
