'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Storage = require('%PathToCoreWebclientModule%/js/Storage.js'),
	
	MailCache = null,
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	CFolderModel = require('modules/%ModuleName%/js/models/CFolderModel.js')
;

/**
 * @constructor
 */
function CFolderListModel()
{
	this.iAccountId = 0;
	this.initialized = ko.observable(false);

	this.bExpandFolders = false;
	this.expandNames = ko.observableArray([]);
	this.collection = ko.observableArray([]);
	this.options = ko.observableArray([]);
	this.sNamespaceFolder = '';
	this.oStarredFolder = null;

	this.oNamedCollection = {};
	this.aLinedCollection = [];

	var
		self = this,
		fSetSystemType = function (iType) {
			return function (oFolder) {
				if (oFolder)
				{
					oFolder.type(iType);
				}
			};
		},
		fFullNameHelper = function (fFolder) {
			return {
				'read': function () {
					this.collection();
					return fFolder() ? fFolder().fullName() : '';
				},
				'write': function (sValue) {
					fFolder(this.getFolderByFullName(sValue));
				},
				'owner': self
			};
		}
	;

	this.currentFolder = ko.observable(null);

	this.inboxFolder = ko.observable(null);
	this.sentFolder = ko.observable(null);
	this.draftsFolder = ko.observable(null);
	this.spamFolder = ko.observable(null);
	this.trashFolder = ko.observable(null);
	this.aTemplateFolders = [];
	
	this.countsCompletelyFilled = ko.observable(false);

	this.inboxFolder.subscribe(fSetSystemType(Enums.FolderTypes.User), this, 'beforeChange');
	this.sentFolder.subscribe(fSetSystemType(Enums.FolderTypes.User), this, 'beforeChange');
	this.draftsFolder.subscribe(fSetSystemType(Enums.FolderTypes.User), this, 'beforeChange');
	this.spamFolder.subscribe(fSetSystemType(Enums.FolderTypes.User), this, 'beforeChange');
	this.trashFolder.subscribe(fSetSystemType(Enums.FolderTypes.User), this, 'beforeChange');
	
	this.inboxFolder.subscribe(fSetSystemType(Enums.FolderTypes.Inbox));
	this.sentFolder.subscribe(fSetSystemType(Enums.FolderTypes.Sent));
	this.draftsFolder.subscribe(fSetSystemType(Enums.FolderTypes.Drafts));
	this.spamFolder.subscribe(fSetSystemType(Enums.FolderTypes.Spam));
	this.trashFolder.subscribe(fSetSystemType(Enums.FolderTypes.Trash));
	
	this.inboxFolderFullName = ko.computed(fFullNameHelper(this.inboxFolder));
	this.sentFolderFullName = ko.computed(fFullNameHelper(this.sentFolder));
	this.draftsFolderFullName = ko.computed(fFullNameHelper(this.draftsFolder));
	this.spamFolderFullName = ko.computed(fFullNameHelper(this.spamFolder));
	this.trashFolderFullName = ko.computed(fFullNameHelper(this.trashFolder));
	
	this.currentFolderFullName = ko.computed(fFullNameHelper(this.currentFolder));
	this.currentFolderType = ko.computed(function () {
		return this.currentFolder() ? this.currentFolder().type() : Enums.FolderTypes.User;
	}, this);
	
	this.sDelimiter = '';
}

/**
 * Requires MailCache. It cannot be required earlier because it is not initialized yet.
 */
CFolderListModel.prototype.requireMailCache = function ()
{
	if (MailCache === null)
	{
		MailCache = require('modules/%ModuleName%/js/Cache.js');
	}
};

CFolderListModel.prototype.getFoldersCount = function ()
{
	return this.aLinedCollection.length;
};

CFolderListModel.prototype.getTotalMessageCount = function ()
{
	var iCount = 0;
	
	_.each(this.oNamedCollection, function (oFolder) {
		iCount += oFolder.messageCount();
	}, this);
	
	return iCount;
};

/**
 * @returns {Array}
 */
CFolderListModel.prototype.getFoldersWithoutCountInfo = function ()
{
	var aFolders = _.compact(_.map(this.oNamedCollection, function(oFolder, sFullName) {
		if (oFolder.canBeSelected() && !oFolder.hasExtendedInfo())
		{
			return sFullName;
		}
		
		return null;
	}));
	
	return aFolders;
};

CFolderListModel.prototype.getNamesOfFoldersToRefresh = function ()
{
	var aFolders = [this.inboxFolderFullName(), this.spamFolderFullName(), this.currentFolderFullName()];
	
	_.each(this.oNamedCollection, function (oFolder) {
		if (oFolder.isAlwaysRefresh())
		{
			aFolders.push(oFolder.fullName());
		}
	});
	
	return _.uniq(aFolders);
};

/**
 * @param {string} sFolderFullName
 * @param {string} sFilters
 */
CFolderListModel.prototype.setCurrentFolder = function (sFolderFullName, sFilters)
{
	this.requireMailCache();
	
	var
		oFolder = this.getFolderByFullName(sFolderFullName)
	;
	
	if (oFolder === null || !oFolder.canBeSelected())
	{
		oFolder = this.inboxFolder();
	}
	
	if (oFolder !== null)
	{
		if (this.currentFolder())
		{
			this.currentFolder().selected(false);
			if (this.oStarredFolder)
			{
				this.oStarredFolder.selected(false);
			}
		}
		
		if (sFolderFullName === MailCache.oUnifiedInbox.fullName())
		{
			this.currentFolder(null);
		}
		else
		{
			this.currentFolder(oFolder);
			if (sFilters === Enums.FolderFilter.Flagged)
			{
				if (this.oStarredFolder)
				{
					this.oStarredFolder.selected(true);
				}
			}
			else
			{
				this.currentFolder().selected(true);
			}
		}
	}
};

/**
 * Returns a folder, found by the full name.
 * 
 * @param {string} sFolderFullName
 * @returns {CFolderModel|null}
 */
CFolderListModel.prototype.getFolderByFullName = function (sFolderFullName)
{
	var oFolder = this.oNamedCollection[sFolderFullName];
	
	return oFolder ? oFolder : null;
};

CFolderListModel.prototype.renameFolder = function (sFullName, sNewFullName, sNewFullNameHash)
{
	var oFolder = this.oNamedCollection[sFullName];
	oFolder.fullName(sNewFullName);
	oFolder.fullNameHash(sNewFullNameHash);
	this.oNamedCollection[sNewFullName] = oFolder;
	delete this.oNamedCollection[sFullName];
};

CFolderListModel.prototype.changeTemplateFolder = function (sFolderName, bTemplate)
{
	if (Settings.AllowTemplateFolders)
	{
		if (bTemplate)
		{
			this.aTemplateFolders.push(sFolderName);
		}
		else
		{
			this.aTemplateFolders = _.without(this.aTemplateFolders, sFolderName);
		}
	}
};

/**
 * Calls a recursive parsing of the folder tree.
 * 
 * @param {number} iAccountId
 * @param {Object} oData
 * @param {Object} oNamedFolderListOld
 */
CFolderListModel.prototype.parse = function (iAccountId, oData, oNamedFolderListOld)
{
	var
		sNamespace = Types.pString(oData.Namespace),
		aCollection = oData.Folders['@Collection']
	;
	if (sNamespace.length > 0)
	{
		this.sNamespaceFolder = sNamespace.substring(0, sNamespace.length - 1);
	}
	
	this.iAccountId = iAccountId;
	this.initialized(true);

	this.bExpandFolders = Settings.FoldersExpandedByDefault && !Storage.hasData('folderAccordion');
	if (!Storage.hasData('folderAccordion'))
	{
		Storage.setData('folderAccordion', []);
	}
	
	this.oNamedCollection = {};
	this.aLinedCollection = [];
	this.collection(this.parseRecursively(aCollection, oNamedFolderListOld));
};

/**
 * Destroys all the remaining folders before the list will be destroyed itself.
 */
CFolderListModel.prototype.destroyFolders = function ()
{
	Utils.destroyObjectWithObservables(this, 'oStarredFolder');
	this.collection.removeAll();
	this.aLinedCollection = [];
	for (var sKey in this.oNamedCollection)
	{
		Utils.destroyObjectWithObservables(this.oNamedCollection, sKey);
	}
};

/**
 * Recursively parses the folder tree.
 * 
 * @param {Array} aRawCollection
 * @param {Object} oNamedFolderListOld
 * @param {number=} iLevel
 * @param {string=} sParentFullName
 * @param {string=} sParentDisplayFullName
 * @returns {Array}
 */
CFolderListModel.prototype.parseRecursively = function (aRawCollection, oNamedFolderListOld, iLevel,
														sParentFullName, sParentDisplayFullName)
{
	var
		aParsedCollection = [],
		iIndex = 0,
		iLen = 0,
		oFolder = null,
		oFolderOld = null,
		sFolderFullName = '',
		oSubFolders = null,
		aSubfolders = []
	;

	sParentFullName = sParentFullName || '';
	
	if (iLevel === undefined)
	{
		iLevel = -1;
	}

	iLevel++;
	if (_.isArray(aRawCollection))
	{
		for (iLen = aRawCollection.length; iIndex < iLen; iIndex++)
		{
			sFolderFullName = Types.pString(aRawCollection[iIndex].FullNameRaw);
			oFolderOld = oNamedFolderListOld[sFolderFullName];
			
			// Do not create a new folder object if possible. A new object will use memory that is difficult to free.
			oFolder = oFolderOld ? oFolderOld : new CFolderModel(this.iAccountId);
			oSubFolders = oFolder.parse(aRawCollection[iIndex], sParentFullName, this.sNamespaceFolder, sParentDisplayFullName);
			
			// Remove from the old folder list reference to the folder. The remaining folders will be destroyed.
			delete oNamedFolderListOld[sFolderFullName];

			if (this.bExpandFolders && oSubFolders !== null)
			{
				oFolder.expanded(true);
				this.expandNames().push(Types.pString(aRawCollection[iIndex].Name));
			}

			oFolder.setDisplayedLevel(iLevel);

			switch (oFolder.type())
			{
				case Enums.FolderTypes.Inbox:
					this.inboxFolder(oFolder);
					this.sDelimiter = oFolder.sDelimiter;
					break;
				case Enums.FolderTypes.Sent:
					this.sentFolder(oFolder);
					break;
				case Enums.FolderTypes.Drafts:
					this.draftsFolder(oFolder);
					break;
				case Enums.FolderTypes.Trash:
					this.trashFolder(oFolder);
					break;
				case Enums.FolderTypes.Spam:
					this.spamFolder(oFolder);
					break;
				case Enums.FolderTypes.Template:
					this.aTemplateFolders.push(oFolder.fullName());
					break;
			}

			this.oNamedCollection[oFolder.fullName()] = oFolder;
			this.aLinedCollection.push(oFolder);
			aParsedCollection.push(oFolder);
			
			if (oSubFolders === null && oFolder.type() === Enums.FolderTypes.Inbox)
			{
				oFolder.subfolders([]);
				this.createStarredFolder(oFolder.fullName(), iLevel);
				if (this.oStarredFolder)
				{
					aParsedCollection.push(this.oStarredFolder);
				}
			}
			else if (oSubFolders !== null)
			{
				if(oFolder.bNamespace && oFolder.type() === Enums.FolderTypes.Inbox)
				{
					aSubfolders = this.parseRecursively(oSubFolders['@Collection'], oNamedFolderListOld,
									iLevel - 1, oFolder.fullName(), oFolder.displayFullName());
				}
				else
				{
					aSubfolders = this.parseRecursively(oSubFolders['@Collection'], oNamedFolderListOld,
									iLevel, oFolder.fullName(), oFolder.displayFullName());
				}
				if(oFolder.type() === Enums.FolderTypes.Inbox)
				{
					this.createStarredFolder(oFolder.fullName(), iLevel);
					if (oFolder.bNamespace)
					{
						if (this.oStarredFolder)
						{
							aSubfolders.unshift(this.oStarredFolder);
						}
					}
					else
					{
						if (this.oStarredFolder)
						{
							aParsedCollection.push(this.oStarredFolder);
						}
					}
				}
				oFolder.subfolders(aSubfolders);
			}
			else
			{
				oFolder.subfolders([]);
			}
		}

		if (this.bExpandFolders)
		{
			Storage.setData('folderAccordion', this.expandNames());
		}
	}

	return aParsedCollection;
};

/**
 * @param {string} sFullName
 * @param {number} iLevel
 */
CFolderListModel.prototype.createStarredFolder = function (sFullName, iLevel)
{
	this.oStarredFolder = new CFolderModel(this.iAccountId);
	this.oStarredFolder.initStarredFolder(iLevel, sFullName);
};

CFolderListModel.prototype.repopulateLinedCollection = function ()
{
	var self = this;
	
	function fPopuplateLinedCollection(aFolders)
	{
		_.each(aFolders, function (oFolder) {
			self.aLinedCollection.push(oFolder);
			if (oFolder.subfolders().length > 0)
			{
				fPopuplateLinedCollection(oFolder.subfolders());
			}
		});
	}
	
	this.aLinedCollection = [];
	
	fPopuplateLinedCollection(this.collection());
	
	return this.aLinedCollection;
};

/**
 * @param {string} sFirstItem
 * @param {boolean=} bEnableSystem = false
 * @param {boolean=} bHideInbox = false
 * @param {boolean=} bIgnoreCanBeSelected = false
 * @param {boolean=} bIgnoreUnsubscribed = false
 * @param {array=} aIgnoreFoldersFullNames = []
 * @returns {Array}
 */
CFolderListModel.prototype.getOptions = function (sFirstItem, bEnableSystem, bHideInbox,
												bIgnoreCanBeSelected, bIgnoreUnsubscribed,
												aIgnoreFoldersFullNames)
{
	bEnableSystem = !!bEnableSystem;
	bHideInbox = !!bHideInbox;
	bIgnoreCanBeSelected = !!bIgnoreCanBeSelected;
	bIgnoreUnsubscribed = !!bIgnoreUnsubscribed;
	aIgnoreFoldersFullNames = Types.pArray(aIgnoreFoldersFullNames);

	var
		sDeepPrefix = '\u00A0\u00A0\u00A0\u00A0',
		aCollection = []
	;
	
	_.each(this.aLinedCollection, function (oFolder) {
		if (oFolder && !oFolder.bVirtual && (!bHideInbox || Enums.FolderTypes.Inbox !== oFolder.type()) && (!bIgnoreUnsubscribed || oFolder.subscribed()))
		{
			var sPrefix = (new Array(oFolder.getDisplayedLevel() + 1)).join(sDeepPrefix);
			var bDisable = false;
			if (!bEnableSystem && oFolder.isSystem()) {
				bDisable = true;
			}
			if (!bIgnoreCanBeSelected && !oFolder.canBeSelected()) {
				bDisable = true;
			}
			if (_.indexOf(aIgnoreFoldersFullNames, oFolder.fullName()) !== -1) {
				bDisable = true;
			}
			aCollection.push({
				'name': oFolder.name(),
				'fullName': oFolder.fullName(),
				'displayName': sPrefix + oFolder.name(),
				'translatedDisplayName': sPrefix + oFolder.displayName(),
				'disable': bDisable
			});
		}
	});
	
	if (sFirstItem !== '')
	{
		aCollection.unshift({
			'name': sFirstItem,
			'fullName': '',
			'displayName': sFirstItem,
			'translatedDisplayName': sFirstItem,
			'disable': false
		});
	}

	return aCollection;
};

module.exports = CFolderListModel;
