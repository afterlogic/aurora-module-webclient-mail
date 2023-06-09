'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	MailCache = null,
	ComplexUidUtils = require('modules/%ModuleName%/js/utils/ComplexUid.js'),
	MessagesDictionary = require('modules/%ModuleName%/js/MessagesDictionary.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 * 
 * !!!Attention!!!
 * It is not used underscore, because the collection may contain undefined-elements.
 * They have their own importance. But all underscore-functions removes them automatically.
 */
function CUidListModel()
{
	this.iAccountId = 0;
	this.sFullName = '';
	this.search = ko.observable('');
	this.filters = ko.observable('');
	this.sortBy = ko.observable(Settings.MessagesSortBy.DefaultSortBy);
	this.sortOrder = ko.observable(Settings.MessagesSortBy.DefaultSortOrder);
	
	this.hasChanges = ko.observable(false);
	
	this.resultCount = ko.observable(-1);
	this.collection = ko.observableArray([]);
	this.threadUids = {};
}

/**
 * Requires MailCache. It cannot be required earlier because it is not initialized yet.
 */
CUidListModel.prototype.requireMailCache = function ()
{
	if (MailCache === null)
	{
		MailCache = require('modules/%ModuleName%/js/Cache.js');
	}
};

/**
 * @param {string} sUid
 * @param {Array} aThreadUids
 */
CUidListModel.prototype.addThreadUids = function (sUid, aThreadUids)
{
	if (-1 !== _.indexOf(this.collection(), sUid))
	{
		this.threadUids[sUid] = aThreadUids;
	}
};

/**
 * @param {int} iOffset
 * @param {Object} oResult
 */
CUidListModel.prototype.setUidsAndCount = function (iOffset, oResult)
{
	if (oResult['@Object'] === 'Collection/MessageCollection')
	{
		if (!Array.isArray(oResult.Uids)) {
			oResult.Uids = _.values(oResult.Uids);
		}
		_.each(oResult.Uids, function (sUid, iIndex) {
			
			this.collection()[iIndex + iOffset] = sUid.toString();

		}, this);

		this.resultCount(oResult.MessageResultCount);
	}
};

/**
 * @param {number} iOffset
 */
CUidListModel.prototype.getUidsForOffset = function (iOffset, iLimit)
{
	this.requireMailCache();
	
	var
		iIndex = 0,
		iLen = this.collection().length,
		iExistsCount = 0,
		aUids = []
	;
	
	for(; iIndex < iLen; iIndex++)
	{
		if (iIndex >= iOffset && iExistsCount < iLimit)
		{
			const sUid = this.collection()[iIndex];
			const keysForDict = ComplexUidUtils.parse(this.iAccountId, this.sFullName, sUid);
			const oMsg = (sUid === undefined) ? null : MessagesDictionary.get(keysForDict);

			if (oMsg && !oMsg.deleted() || sUid === undefined)
			{
				iExistsCount++;
				if (sUid !== undefined)
				{
					aUids.push(sUid);
				}
			}
		}
	}
	
	return aUids;
};

/**
 * @param {Array} aUids
 */
CUidListModel.prototype.deleteUids = function (aUids)
{
	var
		iIndex = 0,
		iLen = this.collection().length,
		sUid = '',
		aNewCollection = [],
		iDiff = 0
	;
	
	for (; iIndex < iLen; iIndex++)
	{
		sUid = this.collection()[iIndex];
		if (_.indexOf(aUids, sUid) === -1)
		{
			aNewCollection.push(sUid);
		}
		else
		{
			iDiff++;
		}
	}
	
	this.collection(aNewCollection);
	this.resultCount(this.resultCount() - iDiff);
};

/**
 * Clears data when cache should be cleared.
 */
CUidListModel.prototype.clearData = function ()
{
	this.resultCount(-1);
	this.collection([]);
	this.threadUids = {};
};

module.exports = CUidListModel;
