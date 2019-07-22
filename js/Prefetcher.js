'use strict';

var
	_ = require('underscore'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	MailCache = require('modules/%ModuleName%/js/Cache.js'),
	MessagesDictionary = require('modules/%ModuleName%/js/MessagesDictionary.js'),
	
	Prefetcher = {},
	bFetchersIdentitiesPrefetched = false
;

Prefetcher.prefetchFetchersIdentities = function ()
{
	if (!App.isNewTab() && !bFetchersIdentitiesPrefetched && (Settings.AllowFetchers || Settings.AllowIdentities))
	{
		AccountList.populateFetchersIdentities();
		bFetchersIdentitiesPrefetched = true;
		
		return true;
	}
	return false;
};

Prefetcher.prefetchAccountFilters = function ()
{
	var
		oAccount = AccountList.getCurrent(),
		bFiltersRequested = false
	;
	
	if (oAccount && oAccount.allowFilters() && !oAccount.filters())
	{
		oAccount.requestFilters();
		bFiltersRequested = true;
	}
	
	return bFiltersRequested;
};

/**
 * Prefetches message list with specified parameters. Checks if this list have already prefetched earlier.
 * @param {Object} oFolder
 * @param {number} iPage
 * @param {string} sSearch
 * @param {string} sFilters
 * @returns {Boolean}
 */
Prefetcher.prefetchMessageList = function (oFolder, iPage, sSearch, sFilters)
{
	var
		oParams = {
			page: iPage,
			search: sSearch,
			filters: sFilters
		},
		bDoNotRequest = oFolder.hasListBeenRequested(oParams),
		oRequestData = null
	;

	oRequestData = MailCache.requestMessageList(oFolder.fullName(), oParams.page, oParams.search, oParams.filters,
										Settings.MessagesSortBy.DefaultSortBy, Settings.MessagesSortBy.DefaultSortOrder,
										false, false, bDoNotRequest);

	return !bDoNotRequest && !!oRequestData && oRequestData.RequestStarted;
};

Prefetcher.prefetchStarredMessageList = function ()
{
	var
		oFolderList = MailCache.folderList(),
		oInbox = oFolderList ? oFolderList.inboxFolder() : null,
		bRequestStarted = false
	;

	if (oInbox)
	{
		bRequestStarted = this.prefetchMessageList(oInbox, 1, '', Enums.FolderFilter.Flagged);
	}
	
	return bRequestStarted;
};

Prefetcher.prefetchUnseenMessageList = function ()
{
	var
		oFolderList = MailCache.folderList(),
		oInbox = oFolderList ? oFolderList.inboxFolder() : null,
		bRequestStarted = false
	;

	if (oInbox)
	{
		bRequestStarted = this.prefetchMessageList(oInbox, 1, '', Enums.FolderFilter.Unseen);
	}

	return bRequestStarted;
};

/**
 * @param {string} sCurrentUid
 */
Prefetcher.prefetchNextPage = function (sCurrentUid)
{
	var
		oUidList = MailCache.uidList(),
		iIndex = _.indexOf(oUidList.collection(), sCurrentUid),
		iPage = Math.ceil(iIndex/Settings.MailsPerPage) + 1
	;
	this.startPagePrefetch(iPage - 1);
};

/**
 * @param {string} sCurrentUid
 */
Prefetcher.prefetchPrevPage = function (sCurrentUid)
{
	var
		oUidList = MailCache.uidList(),
		iIndex = _.indexOf(oUidList.collection(), sCurrentUid),
		iPage = Math.ceil((iIndex + 1)/Settings.MailsPerPage) + 1
	;
	this.startPagePrefetch(iPage);
};

/**
 * @param {number} iPage
 */
Prefetcher.startPagePrefetch = function (iPage)
{
	var
		oCurrFolder = MailCache.folderList().currentFolder(),
		oUidList = MailCache.uidList(),
		iOffset = (iPage - 1) * Settings.MailsPerPage,
		bPageExists = iPage > 0 && iOffset < oUidList.resultCount(),
		bRequestStarted = false
	;
	
	if (oCurrFolder && !oCurrFolder.hasChanges() && bPageExists)
	{
		bRequestStarted = this.prefetchMessageList(oCurrFolder, iPage, oUidList.search(), '');
	}
	
	return bRequestStarted;
};

Prefetcher.startOtherFoldersPrefetch = function ()
{
	var
		oFolderList = MailCache.folderList(),
		sCurrFolder = oFolderList.currentFolderFullName(),
		aFoldersFromAccount = MailCache.getNamesOfFoldersToRefresh(),
		aSystemFolders = oFolderList ? [oFolderList.inboxFolderFullName(), oFolderList.sentFolderFullName(), oFolderList.draftsFolderFullName(), oFolderList.spamFolderFullName()] : [],
		aOtherFolders = (aFoldersFromAccount.length < 5) ? this.getOtherFolderNames(5 - aFoldersFromAccount.length) : [],
		aFolders = _.uniq(_.compact(_.union(aSystemFolders, aFoldersFromAccount, aOtherFolders))),
		bPrefetchStarted = false
	;

	_.each(aFolders, _.bind(function (sFolder) {
		if (!bPrefetchStarted && sCurrFolder !== sFolder)
		{
			bPrefetchStarted = this.startFolderPrefetch(oFolderList.getFolderByFullName(sFolder));
		}
	}, this));

	return bPrefetchStarted;
};

/**
 * @param {number} iCount
 * @returns {Array}
 */
Prefetcher.getOtherFolderNames = function (iCount)
{
	var
		oInbox = MailCache.folderList().inboxFolder(),
		aInboxSubFolders = oInbox ? oInbox.subfolders() : [],
		aOtherFolders = _.filter(MailCache.folderList().collection(), function (oFolder) {
			return !oFolder.isSystem();
		}, this),
		aFolders = _.first(_.union(aInboxSubFolders, aOtherFolders), iCount)
	;
	
	return _.map(aFolders, function (oFolder) {
		return oFolder.fullName();
	});
};

/**
 * @param {Object} oFolder
 */
Prefetcher.startFolderPrefetch = function (oFolder)
{
	var bRequestStarted = false;

	if (oFolder)
	{
		bRequestStarted = this.prefetchMessageList(oFolder, 1, '', '');
	}

	return bRequestStarted;
};

Prefetcher.startThreadListPrefetch = function ()
{
	var
		aUidsForLoad = [],
		oCurrFolder = MailCache.getCurrentFolder()
	;

	_.each(MailCache.messages(), function (oCacheMess) {
		if (oCacheMess.threadCount() > 0)
		{
			_.each(oCacheMess.threadUids(), function (sThreadUid) {
				if (!oCurrFolder.hasThreadUidBeenRequested(sThreadUid))
				{
					aUidsForLoad.push(sThreadUid);
				}
			});
		}
	}, this);

	if (aUidsForLoad.length > 0)
	{
		aUidsForLoad = aUidsForLoad.slice(0, Settings.MailsPerPage);
		oCurrFolder.addRequestedThreadUids(aUidsForLoad);
		oCurrFolder.loadThreadMessages(aUidsForLoad);
		return true;
	}

	return false;
};

Prefetcher.startMessagesPrefetch = function ()
{
	var
		iAccountId = MailCache.currentAccountId(),
		oCurrFolder = MailCache.getCurrentFolder(),
		sCurrFolderFullName = oCurrFolder ? oCurrFolder.fullName() : '',
		iTotalSize = 0,
		iMaxSize = Settings.MaxMessagesBodiesSizeToPrefetch,
		aUids = [],
		oParameters = null,
		iJsonSizeOf1Message = 2048,
		fFillUids = function (oMsg) {
			var
				bNotFilled = (!oMsg.deleted() && !oMsg.completelyFilled()),
				bUidNotAdded = !_.find(aUids, function (sUid) {
					return sUid === oMsg.uid();
				}, this),
				bHasNotBeenRequested = !oCurrFolder.hasUidBeenRequested(oMsg.uid()),
				iTextSize = oMsg.textSize() < Settings.MessageBodyTruncationThreshold ? oMsg.textSize() : Settings.MessageBodyTruncationThreshold
			;

			if (iTotalSize < iMaxSize && bNotFilled && bUidNotAdded && bHasNotBeenRequested)
			{
				aUids.push(oMsg.uid());
				iTotalSize += iTextSize + iJsonSizeOf1Message;
			}
		}
	;

	if (oCurrFolder && oCurrFolder.selected())
	{
		_.each(MailCache.messages(), fFillUids);
		oCurrFolder.doForAllMessages(fFillUids);

		if (aUids.length > 0)
		{
			oCurrFolder.addRequestedUids(aUids);

			oParameters = {
				'AccountID': iAccountId,
				'Folder': sCurrFolderFullName,
				'Uids': aUids,
				'MessageBodyTruncationThreshold': Settings.MessageBodyTruncationThreshold
			};

			Ajax.send('GetMessagesBodies', oParameters, this.onGetMessagesBodiesResponse, this);
			return true;
		}
	}

	return false;
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
Prefetcher.onGetMessagesBodiesResponse = function (oResponse, oRequest)
{
	var
		oParameters = oRequest.Parameters,
		oFolder = MailCache.getFolderByFullName(oParameters.AccountID, oParameters.Folder)
	;
	
	if (_.isArray(oResponse.Result))
	{
		_.each(oResponse.Result, function (oRawMessage) {
			oFolder.parseAndCacheMessage(oRawMessage, false, false);
		});
	}
};

Prefetcher.prefetchAccountQuota = function ()
{
	var
		oAccount = AccountList.getCurrent(),
		bNeedQuotaRequest = oAccount && !oAccount.quotaRecieved()
	;
	
	if (UserSettings.ShowQuotaBar && bNeedQuotaRequest)
	{
		oAccount.updateQuotaParams();
		return true;
	}
	
	return false;
};

module.exports = {
	startMin: function () {
		var bPrefetchStarted = false;
		
		bPrefetchStarted = Prefetcher.prefetchFetchersIdentities();
		
		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchAccountFilters();
		}
		
		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchStarredMessageList();
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchAccountQuota();
		}
		
		return bPrefetchStarted;
	},
	startAll: function () {
		var bPrefetchStarted = false;
		
		bPrefetchStarted = Prefetcher.prefetchFetchersIdentities();
		
		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchAccountFilters();
		}
		
		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.startMessagesPrefetch();
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.startThreadListPrefetch();
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchStarredMessageList();
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.startPagePrefetch(MailCache.page() + 1);
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.startPagePrefetch(MailCache.page() - 1);
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchUnseenMessageList();
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.prefetchAccountQuota();
		}

		if (!bPrefetchStarted)
		{
			bPrefetchStarted = Prefetcher.startOtherFoldersPrefetch();
		}
		
		return bPrefetchStarted;
	},
	prefetchStarredMessageList: function () {
		Prefetcher.prefetchStarredMessageList();
	},
	startFolderPrefetch: function (oFolder) {
		Prefetcher.startFolderPrefetch(oFolder);
	},
	prefetchNextPage: function (sCurrentUid) {
		Prefetcher.prefetchNextPage(sCurrentUid);
	},
	prefetchPrevPage: function (sCurrentUid) {
		Prefetcher.prefetchPrevPage(sCurrentUid);
	}
};
