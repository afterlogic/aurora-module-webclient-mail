'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	moment = require('moment'),
	
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	CoreDateUtils = require('%PathToCoreWebclientModule%/js/utils/Date.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Browser = require('%PathToCoreWebclientModule%/js/Browser.js'),
	CJua = require('%PathToCoreWebclientModule%/js/CJua.js'),
	CSelector = require('%PathToCoreWebclientModule%/js/CSelector.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	CDateModel = require('%PathToCoreWebclientModule%/js/models/CDateModel.js'),
	
	CPageSwitcherView = require('%PathToCoreWebclientModule%/js/views/CPageSwitcherView.js'),
	
	ComposeUtils = require('modules/%ModuleName%/js/utils/Compose.js'),
	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),
	MailUtils = require('modules/%ModuleName%/js/utils/Mail.js'),
	DateUtils = require('modules/%ModuleName%/js/utils/Date.js'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	MailCache  = require('modules/%ModuleName%/js/Cache.js'),
	Settings  = require('modules/%ModuleName%/js/Settings.js'),

	CalendarUtils = require('%PathToCoreWebclientModule%/js/utils/Calendar.js')
;

require("jquery-ui/ui/widgets/datepicker");

/**
 * @constructor
 * 
 * @param {Function} fOpenMessageInNewWindowBound
 */
function CMessageListView(fOpenMessageInNewWindowBound)
{
	this.disableMoveMessages = ko.computed(function () {
		var oFolder = MailCache.getCurrentFolder();
		return oFolder ? oFolder.disableMoveFrom() : true;
	}, this);
	this.bVisibleSortByTool = Settings.MessagesSortBy.Allow && Settings.MessagesSortBy.List.length > 0;
	this.sSortBy = Settings.MessagesSortBy.DefaultSortBy;
	this.iSortOrder = Settings.MessagesSortBy.DefaultSortOrder;
	this.sortBy = ko.observable(Settings.MessagesSortBy.DefaultSortBy);
	this.sortOrder = ko.observable(Settings.MessagesSortBy.DefaultSortOrder);
	this.aSortList = [];
	_.each(Settings.MessagesSortBy.List, function (oItem) {
		this.aSortList.push({
			sText: TextUtils.i18n('%MODULENAME%/' + oItem.LangConst),
			sSortBy: oItem.SortBy
		});
	}.bind(this));

	this.uploaderArea = ko.observable(null);
	this.bDragActive = ko.observable(false);
	this.bDragActiveComp = ko.computed(function () {
		return this.bDragActive();
	}, this);

	this.openMessageInNewWindowBound = fOpenMessageInNewWindowBound;
	
	this.isFocused = ko.observable(false);

	this.messagesContainer = ko.observable(null);

	this.currentMessage = MailCache.currentMessage;
	this.currentMessage.subscribe(function () {
		this.isFocused(false);
		this.selector.itemSelected(this.currentMessage());
	}, this);

	this.folderList = MailCache.folderList;
	this.folderList.subscribe(function () {
		setTimeout(this.onFolderListSubscribe.bind(this));
	}, this);
	this.folderFullName = ko.observable('');
	this.folderType = ko.observable(Enums.FolderTypes.User);
	this.filters = ko.observable('');
	this.isStarredFolder = ko.computed(() => {
		return this.filters() === Enums.FolderFilter.Flagged;
	});
	this.isStarredInAllFolders = ko.computed(() => {
		return this.isStarredFolder()
			&& Settings.AllowChangeStarredMessagesSource
			&& Settings.StarredMessagesSource === Enums.StarredMessagesSource.AllFolders;
	});
	this.isStarredFolder.subscribe(() => {
		if (this.isStarredFolder()) {
			this.selectedSearchFoldersMode(this.isStarredInAllFolders() ? 'all' : '');
		}
	});

	this.allowAdvancedSearch = ko.computed(function () {
		return !ModulesManager.isModuleIncluded('MailNotesPlugin') || this.folderFullName() !== 'Notes';
	}, this);
	this.searchHighlightedInputFormatted = ko.observable('');
	this.searchHighlightedInput = ko.observable('');
	this.searchHighlightedInput.subscribe(() => {
		this.searchHighlightedInputFormatted(DateUtils.formattedDateSearchHighlightedInput(this.searchHighlightedInput()))
	})
	this.searchInput = ko.computed({
		read: () => {
			if (this.isStarredInAllFolders()) {
				return `${this.searchHighlightedInputFormatted()} folders:all`;
			}
			return this.searchHighlightedInputFormatted();
		},
		write: (value) => {
			if (this.isStarredInAllFolders()) {
				this.searchHighlightedInput(value.replace('folders:all', ''));
			} else {
				this.searchHighlightedInput(value);
			}
		}
	});
	this.searchInputFrom = ko.observable('');
	this.searchInputTo = ko.observable('');
	this.searchInputSubject = ko.observable('');
	this.searchInputText = ko.observable('');
	this.searchSpan = ko.observable('');
	this.highlightTrigger = ko.observable('');
	this.selectedSearchFoldersMode = ko.observable('');
	this.selectedSearchFoldersModeText = ko.computed(function () {
		if (this.selectedSearchFoldersMode() === Enums.SearchFoldersMode.Sub) {
			return TextUtils.i18n('%MODULENAME%/LABEL_SEARCH_CURRENT_FOLDER_AND_SUBFOLDERS');
		}
		if (this.selectedSearchFoldersMode() === Enums.SearchFoldersMode.All) {
			return TextUtils.i18n('%MODULENAME%/LABEL_SEARCH_ALL_FOLDERS');
		}
		return TextUtils.i18n('%MODULENAME%/LABEL_SEARCH_CURRENT_FOLDER');
	}, this);

	this.uidList = MailCache.uidList;
	this.uidList.subscribe(function () {
		if (this.uidList().searchCountSubscription)
		{
			this.uidList().searchCountSubscription.dispose();
			this.uidList().searchCountSubscription = undefined;
		}
		this.uidList().searchCountSubscription = this.uidList().resultCount.subscribe(function () {
			if (this.uidList().resultCount() >= 0)
			{
				this.oPageSwitcher.setCount(this.uidList().resultCount());
			}
		}, this);
		
		if (this.uidList().resultCount() >= 0)
		{
			this.oPageSwitcher.setCount(this.uidList().resultCount());
		}
	}, this);

	this.useThreading = ko.computed(function () {
		var
			oAccount = AccountList.getCurrent(),
			oFolder = MailCache.getCurrentFolder(),
			bFolderWithoutThreads = oFolder && oFolder.withoutThreads(),
			bNotSearchOrFilters = this.uidList().search() === '' && this.uidList().filters() === ''
		;
		
		return oAccount && oAccount.threadingIsAvailable() && !bFolderWithoutThreads && bNotSearchOrFilters;
	}, this);

	this.collection = MailCache.messages;
	
	this._search = ko.observable('');
	this.search = ko.computed({
		'read': function () {
			return $.trim(this._search());
		},
		'write': this._search,
		'owner': this
	});
	this.searchFoldersMode = ko.observable('');
	
	this.messageListParamsChanged = ko.observable(false).extend({'autoResetToFalse': 100});

	this.isEmptyList = ko.computed(function () {
		return this.collection().length === 0;
	}, this);

	this.isNotEmptyList = ko.computed(function () {
		return this.collection().length !== 0;
	}, this);

	this.isSearch = ko.computed(function () {
		return this.search().length > 0;
	}, this);

	this.isUnseenFilter = ko.computed(function () {
		return this.filters() === Enums.FolderFilter.Unseen;
	}, this);

	this.isLoading = MailCache.messagesLoading;

	this.isError = MailCache.messagesLoadingError;

	this.visibleInfoLoading = ko.computed(function () {
		return !this.isSearch() && this.isLoading();
	}, this);
	this.visibleInfoSearchLoading = ko.computed(function () {
		return this.isSearch() && this.isLoading();
	}, this);
	this.visibleInfoSearchList = ko.computed(function () {
		return this.isSearch() && !this.isUnseenFilter() && !this.isLoading() && !this.isEmptyList();
	}, this);
	this.visibleInfoMessageListEmpty = ko.computed(function () {
		return !this.isLoading() && !this.isSearch() && (this.filters() === '') && this.isEmptyList() && !this.isError();
	}, this);
	this.visibleInfoStarredFolderEmpty = ko.computed(function () {
		return !this.isLoading() && !this.isSearch() && this.isStarredFolder() && this.isEmptyList() && !this.isError();
	}, this);
	this.visibleInfoSearchEmpty = ko.computed(function () {
		return this.isSearch() && !this.isUnseenFilter() && this.isEmptyList() && !this.isError() && !this.isLoading();
	}, this);
	this.visibleInfoMessageListError = ko.computed(function () {
		return !this.isSearch() && this.isError();
	}, this);
	this.visibleInfoSearchError = ko.computed(function () {
		return this.isSearch() && this.isError();
	}, this);
	this.visibleInfoUnseenFilterList = ko.computed(function () {
		return this.isUnseenFilter() && (this.isLoading() || !this.isEmptyList());
	}, this);
	this.visibleInfoUnseenFilterEmpty = ko.computed(function () {
		return this.isUnseenFilter() && this.isEmptyList() && !this.isError() && !this.isLoading();
	}, this);

	this.allowClearSearch = ko.observable(true);
	this.searchText = ko.computed(function () {
		const
			textOptions = {
				'SEARCH': this.calculateSearchStringForDescription(),
				'FOLDER': MailCache.getCurrentFolder() ? TextUtils.encodeHtml(MailCache.getCurrentFolder().displayName()) : ''
			}
		;
		this.allowClearSearch(true);
		if (this.searchFoldersMode() === Enums.SearchFoldersMode.Sub) {
			if (MailCache.oUnifiedInbox.selected()) {
				return TextUtils.i18n('%MODULENAME%/INFO_SEARCH_UNIFIED_SUBFOLDERS_RESULT', textOptions);
			}
			if ($.trim(this.search()) === 'folders:sub') {
				return TextUtils.i18n('%MODULENAME%/INFO_MESSAGES_FROM_SUBFOLDERS', textOptions);
			}
			return TextUtils.i18n('%MODULENAME%/INFO_SEARCH_SUBFOLDERS_RESULT', textOptions);
		}
		if (this.searchFoldersMode() === Enums.SearchFoldersMode.All) {
			if (MailCache.oUnifiedInbox.selected()) {
				return TextUtils.i18n('%MODULENAME%/INFO_SEARCH_UNIFIED_ALL_FOLDERS_RESULT', textOptions);
			}
			if ($.trim(this.search()) === 'folders:all') {
				if (this.isStarredFolder()) {
					this.allowClearSearch(false);
				}
				return TextUtils.i18n('%MODULENAME%/INFO_MESSAGES_FROM_ALL_FOLDERS', textOptions);
			}
			return TextUtils.i18n('%MODULENAME%/INFO_SEARCH_ALL_FOLDERS_RESULT', textOptions);
		}
		return TextUtils.i18n('%MODULENAME%/INFO_SEARCH_RESULT', textOptions);
	}, this);

	this.unseenFilterText = ko.computed(function () {
		if (this.search() === '')
		{
			return TextUtils.i18n('%MODULENAME%/INFO_UNREAD_MESSAGES', {
				'FOLDER': MailCache.getCurrentFolder() ? TextUtils.encodeHtml(MailCache.getCurrentFolder().displayName()) : ''
			});
		}
		else
		{
			return TextUtils.i18n('%MODULENAME%/INFO_UNREAD_MESSAGES_SEARCH_RESULT', {
				'SEARCH': this.calculateSearchStringForDescription(),
				'FOLDER': MailCache.getCurrentFolder() ? TextUtils.encodeHtml(MailCache.getCurrentFolder().displayName()) : ''
			});
		}
	}, this);

	this.unseenFilterEmptyText = ko.computed(function () {

		if (this.search() === '')
		{
			return TextUtils.i18n('%MODULENAME%/INFO_NO_UNREAD_MESSAGES');
		}
		else
		{
			return TextUtils.i18n('%MODULENAME%/INFO_NO_UNREAD_MESSAGES_FOUND');
		}
		
	}, this);

	this.isEnableGroupOperations = ko.observable(false).extend({'throttle': 250});

	this.selector = new CSelector(
		this.collection,
		_.bind(this.routeForMessage, this),
		_.bind(this.onDeletePress, this),
		_.bind(this.onMessageDblClick, this),
		_.bind(this.onEnterPress, this),
		null,
		false,
		false,
		false,
		false,
		false // don't select new item before routing executed
	);

	this.checkedUids = ko.computed(function () {
		var
			aChecked = this.selector.listChecked(),
			aCheckedUids = _.map(aChecked, function (oMessage) {
				return oMessage.longUid();
			}),
			oFolder = MailCache.getCurrentFolder(),
			aThreadCheckedUids = oFolder ? oFolder.getThreadCheckedUidsFromList(aChecked) : [],
			aUids = _.union(aCheckedUids, aThreadCheckedUids)
		;

		return aUids;
	}, this);
	
	this.checkedOrSelectedUids = ko.computed(function () {
		var aChecked = this.checkedUids();
		if (aChecked.length === 0 && MailCache.currentMessage() && _.isFunction(MailCache.currentMessage().deleted) && !MailCache.currentMessage().deleted())
		{
			aChecked = [MailCache.currentMessage().longUid()];
		}
		return aChecked;
	}, this);

	ko.computed(function () {
		this.isEnableGroupOperations(0 < this.selector.listCheckedOrSelected().length);
	}, this);

	this.checkAll = this.selector.koCheckAll();
	this.checkAllIncomplite = this.selector.koCheckAllIncomplete();

	this.pageSwitcherLocked = ko.observable(false);
	this.oPageSwitcher = new CPageSwitcherView(0, Settings.MailsPerPage);
	this.oPageSwitcher.currentPage.subscribe(function (iPage) {
		var
			sFolder = MailCache.getCurrentFolderFullname(),
			sUid = !App.isMobile() && this.currentMessage() ? this.currentMessage().longUid() : '',
			sSearch = this.search()
		;
		
		if (!this.pageSwitcherLocked())
		{
			this.changeRoutingForMessageList(sFolder, iPage, sUid, sSearch, this.filters(), this.sortBy(), this.sortOrder());
		}
	}, this);
	this.currentPage = ko.observable(0);
	
	// to the message list does not twitch
	if (Browser.firefox || Browser.ie)
	{
		this.listChangedThrottle = ko.observable(false).extend({'throttle': 10});
	}
	else
	{
		this.listChangedThrottle = ko.observable(false);
	}
	
	this.firstCompleteCollection = ko.observable(true);
	this.collection.subscribe(function () {
		if (this.collection().length > 0)
		{
			if (Types.isNonEmptyArray(this.aRouteParams))
			{
				this.onRoute(this.aRouteParams);
				this.aRouteParams = [];
			}
			else
			{
				this.firstCompleteCollection(false);
			}
		}
	}, this);
	this.listChanged = ko.computed(function () {
		return [
			this.firstCompleteCollection(),
			MailCache.currentAccountId(),
			this.folderFullName(),
			this.filters(),
			this.search(),
			this.oPageSwitcher.currentPage()
		];
	}, this);
	
	this.listChanged.subscribe(function() {
		this.listChangedThrottle(!this.listChangedThrottle());
	}, this);

	this.bAdvancedSearch = ko.observable(false);
	this.searchAttachmentsCheckbox = ko.observable(false);
	this.searchAttachments = ko.observable('');
	this.searchAttachments.subscribe(function(sText) {
		this.searchAttachmentsCheckbox(!!sText);
	}, this);
	
	this.searchAttachmentsFocus = ko.observable(false);
	this.searchFromFocus = ko.observable(false);
	this.searchSubjectFocus = ko.observable(false);
	this.searchToFocus = ko.observable(false);
	this.searchTextFocus = ko.observable(false);
	this.searchTrigger = ko.observable(null);
	this.searchDateStartFocus = ko.observable(false);
	this.searchDateEndFocus = ko.observable(false);
	this.searchDateStartDom = ko.observable(null);
	this.searchDateStartTimestamp = ko.observable('');
	this.searchDateStart = ko.observable('');
	this.searchDateStart.subscribe((v) => {
		if (v) {
			this.searchDateStartTimestamp(moment(v, Utils.getDateFormatForMoment(UserSettings.dateFormat())).toDate().getTime() / 1000)
		}
	})
	this.searchDateEndDom = ko.observable(null);
	this.searchDateEndTimestamp = ko.observable('');
	this.searchDateEnd = ko.observable('');
	this.searchDateEnd.subscribe((v) => {
		if (v) {
			this.searchDateEndTimestamp(moment(v, Utils.getDateFormatForMoment(UserSettings.dateFormat())).toDate().getTime() / 1000)
		}
	})
	this.dateFormatDatePicker = ko.computed(() => CalendarUtils.getDateFormatForDatePicker(UserSettings.dateFormat()));
	UserSettings.dateFormat.subscribe(() => {
		const dateModelStart = new CDateModel()
		const dateModelEnd = new CDateModel()

		if (this.searchDateStartTimestamp()) {
			dateModelStart.parse(this.searchDateStartTimestamp())
			this.searchDateStart(dateModelStart.getShortDate())
		}
		if (this.searchDateEndTimestamp()) {
			dateModelEnd.parse(this.searchDateEndTimestamp())
			this.searchDateEnd(dateModelEnd.getShortDate())
		}

		this.createDatePickerObject(this.searchDateStartDom(), this.searchDateStart);
		this.createDatePickerObject(this.searchDateEndDom(), this.searchDateEnd);

		this.searchHighlightedInputFormatted(DateUtils.formattedDateSearchHighlightedInput(this.searchHighlightedInput()))
	});

	this.attachmentsPlaceholder = ko.computed(function () {
		return TextUtils.i18n('%MODULENAME%/LABEL_HAS_ATTACHMENTS');
	}, this);
	
	this.customMessageItemViewTemplate = ko.observable('');;
	
	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this, 'MailCache': MailCache});
}

CMessageListView.prototype.ViewTemplate = '%ModuleName%_MessagesView';
CMessageListView.prototype.ViewConstructorName = 'CMessageListView';

CMessageListView.prototype.addNewAccount = function ()
{
	App.Api.createMailAccount(AccountList.getEmail());
};

CMessageListView.prototype.createDatePickerObject = function (oElement, value)
{
	$(oElement).datepicker("destroy");
	$(oElement).datepicker({
		showOtherMonths: true,
		selectOtherMonths: true,
		monthNames: CoreDateUtils.getMonthNamesArray(),
		dayNamesMin: TextUtils.i18n('COREWEBCLIENT/LIST_DAY_NAMES_MIN').split(' '),
		nextText: '',
		prevText: '',
		firstDay: Types.pInt(ModulesManager.run('CalendarWebclient', 'getWeekStartsOn')),
		showOn: 'focus',
		dateFormat: this.dateFormatDatePicker(),
		onClose: function (sValue) {
			if (ko.isObservable(value)) {
				value(sValue);
			}
		}
	});

	$(oElement).mousedown(function() {
		$('#ui-datepicker-div').toggle();
	});
};

/**
 * @param {string} sFolder
 * @param {number} iPage
 * @param {string} sUid
 * @param {string} sSearch
 * @param {string} sFilters
 * @param {string} sSortBy
 * @param {number} iSortOrder
 */
CMessageListView.prototype.changeRoutingForMessageList = function (sFolder, iPage, sUid, sSearch, sFilters, sSortBy, iSortOrder)
{
	var bSame = Routing.setHash(LinksUtils.getMailbox(sFolder, iPage, sUid, sSearch, sFilters, sSortBy, iSortOrder));
	
	if (bSame && sSearch.length > 0 && this.search() === sSearch)
	{
		this.listChangedThrottle(!this.listChangedThrottle());
	}
};

/**
 * @param {CMessageModel} oMessage
 */
CMessageListView.prototype.onEnterPress = function (oMessage)
{
	if (oMessage.threadNextLoadingVisible())
	{
		oMessage.loadNextMessages();
	}
	else
	{
		oMessage.openThread();
	}
};

/**
 * @param {CMessageModel} oMessage
 */
CMessageListView.prototype.onMessageDblClick = function (oMessage)
{
	if (!this.isSavingDraft(oMessage))
	{
		var
			oFolder = this.folderList().getFolderByFullName(oMessage.folder()),
			oParams = { Message: oMessage, Cancel: false }
		;
		
		App.broadcastEvent('%ModuleName%::MessageDblClick::before', oParams);

		if (!oParams.Cancel)
		{
			if (oFolder.type() === Enums.FolderTypes.Drafts || MailCache.isTemplateFolder(oMessage.folder()))
			{
				ComposeUtils.composeMessageFromDrafts(oMessage.accountId(), oMessage.folder(), oMessage.longUid());
			}
			else
			{
				this.openMessageInNewWindowBound(oMessage);
			}
		}
	}
};

CMessageListView.prototype.onFolderListSubscribe = function ()
{
	this.setCurrentFolder();
	this.requestMessageList();
};

/**
 * @param {Array} aParams
 */
CMessageListView.prototype.onShow = function (aParams)
{
	this.selector.useKeyboardKeys(true);
	this.oPageSwitcher.show();

	if (this.oJua)
	{
		this.oJua.setDragAndDropEnabledStatus(true);
	}
};

/**
 * @param {Array} aParams
 */
CMessageListView.prototype.onHide = function (aParams)
{
	this.selector.useKeyboardKeys(false);
	this.oPageSwitcher.hide();

	if (this.oJua)
	{
		this.oJua.setDragAndDropEnabledStatus(false);
	}
};

function correctSearchFromParams(filtersFromParams, searchFromParams) {
	if (filtersFromParams === Enums.FolderFilter.Flagged && Settings.AllowChangeStarredMessagesSource) {
		if ((/(^|\s)folders:all(\s|$)/).test(searchFromParams)) {
			if (Settings.StarredMessagesSource === Enums.StarredMessagesSource.InboxOnly) {
				return searchFromParams.replace('folders:all', '');
			}
		} else {
			if (Settings.StarredMessagesSource === Enums.StarredMessagesSource.AllFolders) {
				return `${searchFromParams} folders:all`;
			}
		}
	}
	return searchFromParams;
};

/**
 * @param {Array} aParams
 */
CMessageListView.prototype.onRoute = function (aParams)
{
	var
		oParams = LinksUtils.parseMailbox(aParams),
		sCurrentFolder = this.folderFullName() || this.folderList().inboxFolderFullName(),
		searchFromParams = correctSearchFromParams(oParams.Filters, oParams.Search),
		bRouteChanged = this.currentPage() !== oParams.Page ||
			sCurrentFolder !== oParams.Folder ||
			this.filters() !== oParams.Filters || (oParams.Filters === Enums.FolderFilter.Unseen && MailCache.waitForUnseenMessages()) ||
			this.search() !== searchFromParams || this.sSortBy !== oParams.SortBy || this.iSortOrder !== oParams.SortOrder,
		bMailsPerPageChanged = Settings.MailsPerPage !== this.oPageSwitcher.perPage()
	;
	
	this.pageSwitcherLocked(true);
	if (sCurrentFolder !== oParams.Folder || this.search() !== searchFromParams || this.filters() !== oParams.Filters)
	{
		this.oPageSwitcher.clear();
	}
	else
	{
		this.oPageSwitcher.setPage(oParams.Page, Settings.MailsPerPage);
	}
	this.pageSwitcherLocked(false);

	if (searchFromParams !== oParams.Search) {
		Routing.replaceHash(LinksUtils.getMailbox(oParams.Folder, this.oPageSwitcher.currentPage(), oParams.Uid, searchFromParams, oParams.Filters));
	} else if (oParams.Page !== this.oPageSwitcher.currentPage()) {
		if (this.folderList().iAccountId === 0)
		{
			this.aRouteParams = aParams;
		}
		else
		{
			Routing.replaceHash(LinksUtils.getMailbox(oParams.Folder, this.oPageSwitcher.currentPage(), oParams.Uid, searchFromParams, oParams.Filters));
		}
	}

	this.currentPage(this.oPageSwitcher.currentPage());
	this.folderFullName(oParams.Folder);
	this.filters(oParams.Filters);
	this.search(searchFromParams);
	this.searchInput(this.search());
	this.setSearchFolderMode();
	this.searchSpan.notifySubscribers();
	this.sSortBy = oParams.SortBy;
	this.iSortOrder = oParams.SortOrder;
	this.sortBy(oParams.SortBy);
	this.sortOrder(oParams.SortOrder);

	this.setCurrentFolder();
	
	if (bRouteChanged || bMailsPerPageChanged || this.collection().length === 0)
	{
		if (oParams.Filters === Enums.FolderFilter.Unseen)
		{
			MailCache.waitForUnseenMessages(true);
		}
		this.requestMessageList();
		this.messageListParamsChanged(true);
	}

	this.highlightTrigger.notifySubscribers(true);
};

CMessageListView.prototype.setSearchFolderMode = function () {
	if ((/(^|\s)folders:all(\s|$)/).test(this.search()))
	{
		this.searchFoldersMode(Enums.SearchFoldersMode.All);
	}
	else if ((/(^|\s)folders:sub(\s|$)/).test(this.search()))
	{
		this.searchFoldersMode(Enums.SearchFoldersMode.Sub);
	}
	else
	{
		this.searchFoldersMode(Enums.SearchFoldersMode.Current);
	}
};

CMessageListView.prototype.setCurrentFolder = function ()
{
	MailCache.setCurrentFolder(this.folderFullName(), this.filters());
	this.folderType(MailCache.getCurrentFolderType());
};

CMessageListView.prototype.requestMessageList = function ()
{
	var
		sFullName = MailCache.getCurrentFolderFullname(),
		iPage = this.oPageSwitcher.currentPage()
	;
	
	if (sFullName.length > 0)
	{
		MailCache.changeCurrentMessageList(sFullName, iPage, this.search(), this.filters(), this.sortBy(), this.sortOrder());
	}
	else
	{
		MailCache.checkCurrentFolderList();
	}
};

CMessageListView.prototype.calculateSearchStringFromAdvancedForm  = function ()
{
	var
		sFrom = this.searchInputFrom(),
		sTo = this.searchInputTo(),
		sSubject = this.searchInputSubject(),
		sText = this.searchInputText(),
		bAttachmentsCheckbox = this.searchAttachmentsCheckbox(),
		[dateStartServerFormat, dateEndServerFormat] = DateUtils.changeDateStartAndDateEndformatForSend(this.searchDateStart(), this.searchDateEnd()),
		aOutput = [],
		fEsc = function (sText) {

			sText = $.trim(sText).replace(/"/g, '\\"');
			
			if (-1 < sText.indexOf(' ') || -1 < sText.indexOf('"'))
			{
				sText = '"' + sText + '"';
			}
			
			return sText;
		}
	;

	if (sFrom !== '')
	{
		aOutput.push('from:' + fEsc(sFrom));
	}

	if (sTo !== '')
	{
		aOutput.push('to:' + fEsc(sTo));
	}

	if (sSubject !== '')
	{
		aOutput.push('subject:' + fEsc(sSubject));
	}
	
	if (sText !== '')
	{
		aOutput.push('text:' + fEsc(sText));
	}

	if (bAttachmentsCheckbox)
	{
		aOutput.push('has:attachments');
	}

	if (dateStartServerFormat !== '' || dateEndServerFormat !== '')
	{	
		aOutput.push('date:' + fEsc(dateStartServerFormat) + '/' + fEsc(dateEndServerFormat));
	}

	if (this.selectedSearchFoldersMode() === Enums.SearchFoldersMode.Sub || this.selectedSearchFoldersMode() === Enums.SearchFoldersMode.All)
	{
		aOutput.push('folders:' + this.selectedSearchFoldersMode());
	}

	return aOutput.join(' ');
};

CMessageListView.prototype.manualChangeSearchString = function (searchInput) {
	const searchKeywords = ['date:', 'subject:', 'text:', 'from:', 'to:', 'has:', 'folders:'];
	const regex = new RegExp('\\s(' + searchKeywords.join('|') + ')', 'g');
	const searchInputArr = (' ' + searchInput).split(regex);
	let newSearchInput = '';

	if (searchInputArr.length > 1) { //there are keywords in the search string
		for (let i = 1; i < searchInputArr.length; i = i + 2) {
			const keyword = searchInputArr[i];
			const value = searchInputArr[i + 1];

			if (keyword === searchKeywords[0]) {
				const [dateStartClientFormat, dateEndClientFormat] = value.split(' - ');
				const [dateStartServerFormat, dateEndServerFormat] = DateUtils.changeDateStartAndDateEndformatForSend(dateStartClientFormat, dateEndClientFormat);
	
				if (dateStartServerFormat || dateEndServerFormat) {
					newSearchInput += keyword + dateStartServerFormat + '/' + dateEndServerFormat + ' ';
				}
			} else {
				newSearchInput += keyword + value + ' ';
			}
		}
	} else {
		newSearchInput = searchInput; //search string is just a text an has no any keywords
	}

	return newSearchInput;
};

CMessageListView.prototype.onSearchClick = function ()
{
	var
		sFolder = MailCache.getCurrentFolderFullname(),
		iPage = 1,
		searchInput = this.searchInput()
	;
	
	if (this.allowAdvancedSearch() && this.bAdvancedSearch()) {
		searchInput = this.calculateSearchStringFromAdvancedForm();
		this.bAdvancedSearch(false);
	} else {
		searchInput = this.manualChangeSearchString(searchInput)
	}

	this.changeRoutingForMessageList(sFolder, iPage, '', searchInput, this.filters());
};

CMessageListView.prototype.onRetryClick = function ()
{
	this.requestMessageList();
};

CMessageListView.prototype.onClearSearchClick = function ()
{
	var
		sFolder = MailCache.getCurrentFolderFullname(),
		sUid = this.currentMessage() ? this.currentMessage().longUid() : '',
		sSearch = '',
		iPage = 1
	;

	this.clearAdvancedSearch();
	this.changeRoutingForMessageList(sFolder, iPage, sUid, sSearch, this.filters(), this.sortBy(), this.sortOrder());
};

CMessageListView.prototype.onClearFilterClick = function ()
{
	var
		sFolder = MailCache.getCurrentFolderFullname(),
		sUid = this.currentMessage() ? this.currentMessage().longUid() : '',
		sSearch = '',
		iPage = 1,
		sFilters = ''
	;

	this.clearAdvancedSearch();
	this.changeRoutingForMessageList(sFolder, iPage, sUid, sSearch, sFilters, this.sortBy(), this.sortOrder());
};

CMessageListView.prototype.onStopSearchClick = function ()
{
	this.onClearSearchClick();
};

/**
 * @param {Object} oMessage
 */
CMessageListView.prototype.isSavingDraft = function (oMessage)
{
	var oFolder = MailCache.getCurrentFolder();
	
	return (oFolder.type() === Enums.FolderTypes.Drafts) && (oMessage.longUid() === MailCache.savingDraftUid());
};

/**
 * @param {Object} oMessage
 */
CMessageListView.prototype.routeForMessage = function (oMessage)
{
	if (oMessage && oMessage.longUid && !this.isSavingDraft(oMessage))
	{
		var
			oFolder = MailCache.getCurrentFolder(),
			sFolder = MailCache.getCurrentFolderFullname(),
			iPage = this.oPageSwitcher.currentPage(),
			sUid = oMessage.longUid(),
			sCurrentUid = this.currentMessage() ? this.currentMessage().longUid() : '',
			sSearch = this.search()
		;

		if (sUid !== '' && sUid !== sCurrentUid)
		{
			if (App.isMobile() && oFolder.type() === Enums.FolderTypes.Drafts)
			{
				Routing.setHash(LinksUtils.getComposeFromMessage('drafts', oMessage.accountId(), oMessage.folder(), oMessage.longUid()));
			}
			else
			{
				this.changeRoutingForMessageList(sFolder, iPage, sUid, sSearch, this.filters(), this.sortBy(), this.sortOrder());
				if (App.isMobile() && MailCache.currentMessage() && sUid === MailCache.currentMessage().longUid())
				{
					MailCache.currentMessage.valueHasMutated();
				}
			}
		}
	}
};

CMessageListView.prototype.unbind = function ()
{
	this.selector.unbind();
};

/**
 * @param {Object} $viewDom
 */
CMessageListView.prototype.onBind = function ($viewDom)
{
	var
		self = this,
		fStopPopagation = _.bind(function (oEvent) {
			if (oEvent && oEvent.stopPropagation)
			{
				oEvent.stopPropagation();
			}
		}, this)
	;

	$('.message_list', $viewDom)
		.on('click', function ()
		{
			self.isFocused(false);
		})
		.on('click', '.message_sub_list .item .flag', function (oEvent)
		{
			self.onFlagClick(ko.dataFor(this));
			if (oEvent && oEvent.stopPropagation)
			{
				oEvent.stopPropagation();
			}
		})
		.on('dblclick', '.message_sub_list .item .flag', fStopPopagation)
		.on('click', '.message_sub_list .item .thread-pin', fStopPopagation)
		.on('dblclick', '.message_sub_list .item .thread-pin', fStopPopagation)
	;

	this.selector.initOnApplyBindings(
		'.message_sub_list .item',
		'.message_sub_list .item.selected',
		'.message_sub_list .item .custom_checkbox',
		$('.message_list', $viewDom),
		$('.message_list_scroll.scroll-inner', $viewDom)
	);

	_.delay(_.bind(function(){
		this.createDatePickerObject(this.searchDateStartDom(), this.searchDateStart);
		this.createDatePickerObject(this.searchDateEndDom(), this.searchDateEnd);
	}, this), 1000);

	this.initUploader();
};

/**
 * Puts / removes the message flag by clicking on it.
 *
 * @param {Object} oMessage
 */
CMessageListView.prototype.onFlagClick = function (oMessage)
{
	if (!this.isSavingDraft(oMessage))
	{
		MailCache.executeGroupOperation('SetMessageFlagged', [oMessage.longUid()], 'flagged', !oMessage.flagged());
	}
};

/**
 * Marks the selected messages read.
 */
CMessageListView.prototype.executeMarkAsRead = function ()
{
	MailCache.executeGroupOperation('SetMessagesSeen', this.checkedOrSelectedUids(), 'seen', true);
};

/**
 * Marks the selected messages unread.
 */
CMessageListView.prototype.executeMarkAsUnread = function ()
{
	MailCache.executeGroupOperation('SetMessagesSeen', this.checkedOrSelectedUids(), 'seen', false);
};

/**
 * Marks Read all messages in a folder.
 */
CMessageListView.prototype.executeMarkAllRead = function ()
{
	MailCache.executeGroupOperation('SetAllMessagesSeen', [], 'seen', true);
};

/**
 * Moves the selected messages in the current folder in the specified.
 * 
 * @param {string} sToFolder
 */
CMessageListView.prototype.executeMoveToFolder = function (sToFolder)
{
	var
		oToFolder = MailCache.getFolderByFullName(MailCache.currentAccountId(), sToFolder),
		aLongUids = this.checkedOrSelectedUids(),
		oUidsByFolders = MailCache.getUidsSeparatedByFolders(aLongUids)
	;

	if (oToFolder)
	{
		_.each(oUidsByFolders, function (oData) {
			if (MailCache.currentAccountId() === oData.iAccountId)
			{
				var oFromFolder = MailCache.getFolderByFullName(MailCache.currentAccountId(), oData.sFolder);
				if (oFromFolder)
				{
					MailCache.moveMessagesToFolder(oFromFolder, oToFolder, oData.aUids);
				}
			}
		});
	}
};

CMessageListView.prototype.executeCopyToFolder = function (toFolderName)
{
	var
		toFolder = MailCache.getFolderByFullName(MailCache.currentAccountId(), toFolderName),
		longUids = this.checkedOrSelectedUids(),
		uidsByFolders = MailCache.getUidsSeparatedByFolders(longUids)
	;

	if (toFolder) {
		_.each(uidsByFolders, function (data) {
			if (MailCache.currentAccountId() === data.iAccountId) {
				var fromFolder = MailCache.getFolderByFullName(MailCache.currentAccountId(), data.sFolder);
				if (fromFolder) {
					MailCache.copyMessagesToFolder(fromFolder, toFolder, data.aUids);
				}
			}
		});
	}
};

/**
 * Calls for the selected messages delete operation. Called from the keyboard.
 * 
 * @param {Array} aMessages
 */
CMessageListView.prototype.onDeletePress = function (aMessages)
{
	var aUids = _.map(aMessages, function (oMessage) { return oMessage.longUid(); });

	if (aUids.length > 0)
	{
		this.deleteMessages(aUids);
	}
};

/**
 * Calls for the selected messages delete operation. Called by the mouse click on the delete button.
 */
CMessageListView.prototype.executeDelete = function ()
{
	this.deleteMessages(this.checkedOrSelectedUids());
};

/**
 * @param {Array} aUids
 */
CMessageListView.prototype.deleteMessages = function (aUids)
{
	var
		sUidToOpenAfter = '',
		oMessageToOpenAfter = null
	;

	if (MailCache.uidList().filters() !== Enums.FolderFilter.Unseen
			&& aUids.length === 1 && MailCache.currentMessage()
			&& aUids[0] === MailCache.currentMessage().longUid())
	{
		sUidToOpenAfter = MailCache.prevMessageUid();
		if (sUidToOpenAfter === '')
		{
			sUidToOpenAfter = MailCache.nextMessageUid();
		}
	}
	
	if (aUids.length > 0)
	{
		MailUtils.deleteMessages(aUids, function () {
			if (sUidToOpenAfter !== '')
			{
				oMessageToOpenAfter = _.find(this.collection(), function (oMessage) {
					return oMessage && _.isFunction(oMessage.longUid) && (oMessage.longUid() === sUidToOpenAfter || oMessage.uid() === sUidToOpenAfter);
				});
				if (oMessageToOpenAfter)
				{
					this.routeForMessage(oMessageToOpenAfter);
				}
			}
		}.bind(this));
	}
};

/**
 * Moves the selected messages from the current folder to the folder Spam.
 */
CMessageListView.prototype.executeSpam = function ()
{
	var
		aLongUids = this.checkedOrSelectedUids(),
		oUidsByFolders = MailCache.getUidsSeparatedByFolders(aLongUids)
	;

	_.each(oUidsByFolders, function (oData) {
		var
			oFolderList = MailCache.oFolderListItems[oData.iAccountId],
			oAccSpam = oFolderList ? oFolderList.spamFolder() : null,
			oAccFolder = oFolderList ? oFolderList.getFolderByFullName(oData.sFolder) : null;
		;
		if (oAccFolder && oAccSpam && oAccFolder.fullName() !== oAccSpam.fullName())
		{
			MailCache.moveMessagesToFolder(oAccFolder, oAccSpam, oData.aUids);
		}
	});
};

/**
 * Moves the selected messages from the Spam folder to folder Inbox.
 */
CMessageListView.prototype.executeNotSpam = function ()
{
	var
		oCurrentFolder = MailCache.getCurrentFolder(),
		oInbox = this.folderList().inboxFolder(),
		aLongUids = this.checkedOrSelectedUids(),
		oUidsByFolders = MailCache.getUidsSeparatedByFolders(aLongUids)
	;

	if (oInbox && oCurrentFolder && oCurrentFolder.fullName() !== oInbox.fullName())
	{
		_.each(oUidsByFolders, function (oData) {
			if (oCurrentFolder.iAccountId === oData.iAccountId && oCurrentFolder.fullName() === oData.sFolder)
			{
				MailCache.moveMessagesToFolder(oCurrentFolder, oInbox, oData.aUids);
			}
		});
	}
};

CMessageListView.prototype.executeSort = function (sSortBy)
{
	const sCurrentSort = this.sortBy();
	this.sortBy(sSortBy);

	if (sCurrentSort === sSortBy) {
		this.sortOrder(this.sortOrder() === Enums.SortOrder.Asc ? Enums.SortOrder.Desc : Enums.SortOrder.Asc); // Asc: 0, Desc: 1
	} else {
		this.sortOrder(Settings.MessagesSortBy.DefaultSortOrder);
	}

	const
		sFolder = MailCache.getCurrentFolderFullname(),
		iPage = this.oPageSwitcher.currentPage(),
		sUid = ''
	;

	this.changeRoutingForMessageList(sFolder, iPage, sUid, this.search(), this.filters(), this.sortBy(), this.sortOrder());
};

CMessageListView.prototype.clearAdvancedSearch = function ()
{
	this.searchInputFrom('');
	this.searchInputTo('');
	this.searchInputSubject('');
	this.searchInputText('');
	this.bAdvancedSearch(false);
	this.searchAttachmentsCheckbox(false);
	this.searchAttachments('');
	this.searchDateStart('');
	this.searchDateEnd('');
	this.selectedSearchFoldersMode(this.isStarredInAllFolders() ? 'all' : '');
};

CMessageListView.prototype.onAdvancedSearchClick = function ()
{
	this.bAdvancedSearch(!this.bAdvancedSearch());
};

CMessageListView.prototype.calculateSearchStringForDescription = function ()
{
	return TextUtils.encodeHtml(this.searchHighlightedInputFormatted().replace(/(^|\s)folders:(all|sub)(\s|$)/, ''));
};

CMessageListView.prototype.initUploader = function ()
{
	var self = this;

	if (this.uploaderArea())
	{
		this.oJua = new CJua({
			'action': '?/Api/',
			'name': 'jua-uploader',
			'queueSize': 2,
			'dragAndDropElement': this.uploaderArea(),
			'disableAjaxUpload': false,
			'disableFolderDragAndDrop': false,
			'disableDragAndDrop': false,
			'hidden': _.extendOwn({
				'Module': Settings.ServerModuleName,
				'Method': 'UploadMessage',
				'Parameters':  function () {
					return JSON.stringify({
						'AccountID': MailCache.currentAccountId(),
						'Folder': self.folderFullName()
					});
				}
			}, App.getCommonRequestParameters())
		});

		this.oJua
			.on('onDrop', _.bind(this.onFileDrop, this))
			.on('onComplete', _.bind(this.onFileUploadComplete, this))
			.on('onBodyDragEnter', _.bind(this.bDragActive, this, true))
			.on('onBodyDragLeave', _.bind(this.bDragActive, this, false))
		;
	}
};

CMessageListView.prototype.onFileDrop = function (oData)
{
	if (!(oData && oData.File && oData.File.type && oData.File.type.indexOf('message/') === 0))
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_FILE_NOT_EML'));
	}
};

CMessageListView.prototype.onFileUploadComplete = function (sFileUid, bResponseReceived, oResponse)
{
	var bSuccess = bResponseReceived && oResponse && !oResponse.ErrorCode;

	if (bSuccess)
	{
		MailCache.executeCheckMail(true);
	}
	else
	{
		Api.showErrorByCode(oResponse || {}, TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_FILE'));
	}
};

CMessageListView.prototype.selectFolderSearch = function (sSearchFoldersMode)
{
	this.selectedSearchFoldersMode(sSearchFoldersMode);
};

module.exports = CMessageListView;
