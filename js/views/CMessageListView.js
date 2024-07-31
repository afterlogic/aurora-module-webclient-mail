'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	DateUtils = require('%PathToCoreWebclientModule%/js/utils/Date.js'),
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
	Storage = require('%PathToCoreWebclientModule%/js/Storage.js'),
	
	CPageSwitcherView = require('%PathToCoreWebclientModule%/js/views/CPageSwitcherView.js'),
	
	ComposeUtils = require('modules/%ModuleName%/js/utils/Compose.js'),
	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),
	MailUtils = require('modules/%ModuleName%/js/utils/Mail.js'),
	PrivateMessagingUtils = require('modules/%ModuleName%/js/utils/PrivateMessaging.js'),
	SearchUtils = require('modules/%ModuleName%/js/utils/Search.js'),

	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	MailCache  = require('modules/%ModuleName%/js/Cache.js'),
	Settings  = require('modules/%ModuleName%/js/Settings.js')
;

require("jquery-ui/ui/widgets/datepicker");

/**
 * @constructor
 * 
 * @param {Function} fOpenMessaheInPopupOrTabBound
 */
function CMessageListView(fOpenMessaheInPopupOrTabBound)
{
	this.disableMoveMessages = ko.computed(function () {
		var oFolder = MailCache.getCurrentFolder();
		return oFolder ? oFolder.disableMoveFrom() : true;
	}, this);
	this.bVisibleSortByTool = Settings.MessagesSortBy.Allow && Settings.MessagesSortBy.List.length > 0;
	this.sSortBy = Settings.MessagesSortBy.DefaultSortBy;
	this.iSortOrder = Settings.MessagesSortBy.DefaultSortOrder;
	this.aSortList = [];
	_.each(Settings.MessagesSortBy.List, function (oItem) {
		this.aSortList.push({
			sText: TextUtils.i18n('%MODULENAME%/' + oItem.LangConst),
			sSortBy: oItem.SortBy,
			sortOrder: ko.observable(Settings.MessagesSortBy.DefaultSortBy),
			selected: ko.observable(oItem.SortBy === Settings.MessagesSortBy.DefaultSortOrder)
		});
	}.bind(this));

	this.uploaderArea = ko.observable(null);
	this.bDragActive = ko.observable(false);
	this.bDragActiveComp = ko.computed(function () {
		return this.bDragActive();
	}, this);

	this.openMessaheInPopupOrTabBound = fOpenMessaheInPopupOrTabBound;
	
	this.isFocused = ko.observable(false);

	this.messagesContainer = ko.observable(null);

	this.searchInput = ko.observable('');
	// this.searchInputRaw = ko.observable('');	
	this.searchInputFrom = ko.observable('');
	this.searchInputTo = ko.observable('');
	this.searchInputSubject = ko.observable('');
	this.searchInputText = ko.observable('');

	this.searchInput.subscribe(function(v) {
		if (v === '') {
			this.onClearSearchClick();
		}
	}, this);

	this.currentMessage = MailCache.currentMessage;
	this.currentMessage.subscribe(function () {
		this.isFocused(false);
		this.selector.itemSelected(this.currentMessage());
		var last = this.collection().length > 0 ? this.collection()[this.collection().length - 1] : null;
		if (last && this.currentMessage() && last.uid() === this.currentMessage().uid()) {
			var messageListScrollDom = $('.message_list_scroll', this.$viewDom);
			var messageListDom = $('.message_list', this.$viewDom);
			messageListScrollDom.scrollTop(messageListDom.height());
		}
	}, this);

	this.folderList = MailCache.folderList;
	this.folderList.subscribe(this.onFolderListSubscribe, this);
	this.folderFullName = ko.observable('');
	this.folderType = ko.observable(Enums.FolderTypes.User);
	this.filters = ko.observable('');

	this.totalCount = ko.observable(0);
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
				this.totalCount(this.uidList().resultCount());
				this.oPageSwitcher.setCount(this.uidList().resultCount());
			}
		}, this);
		
		if (this.uidList().resultCount() >= 0)
		{
			this.totalCount(this.uidList().resultCount());
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

	this.disableStarredControls = ko.computed(function () {
		const folder = MailCache.getCurrentFolder();
		return folder && Settings.DisableStarredInFolders.includes(folder.fullName());
	}, this);

	this.lockTopScroll = ko.observable(false);
	this.lockBottomScroll = ko.observable(false);
	this.collection = MailCache.messages;
	this.collection.subscribeExtended(function (aNewMessage, aOldMessages) {
//		var messageListScrollDom = $('.message_list_scroll', this.$viewDom);
//
//		setTimeout(function () {
//			var messageListDom = $('.message_list', this.$viewDom);
//			this.showLoadingOnTop(messageListDom.height() > messageListScrollDom.height());
//		}.bind(this));
//		
//		var
//			aNewUids = _.map(aNewMessage, function (oMessage) {
//				return oMessage.uid();
//			}),
//			iNewIndex = null,
//			iOldIndex = null
//		;
//		_.each(aOldMessages, function (oMessage, iOldKey) {
//			var iNewKey = null;
//			if (iNewIndex === null) {
//				iNewKey = _.indexOf(aNewUids, oMessage.uid());
//				if (iNewKey !== -1) {
//					iNewIndex = iNewKey;
//					iOldIndex = iOldKey;
//				}
//			}
//			if (oMessage.checked()) {
//				if (iNewKey === null) {
//					iNewKey = _.indexOf(aNewUids, oMessage.uid());
//				}
//				if (iNewKey === -1) {
//					oMessage.checked(false);
//				}
//			}
//		});
//		if (iNewIndex !== iOldIndex) {
//			var
//				oItem = $('.item', messageListScrollDom).first(),
//				iHeight = oItem.outerHeight(),
//				iScrollTop = messageListScrollDom.scrollTop()
//			;
//			if (iHeight) {
//				messageListScrollDom.scrollTop(iScrollTop + (iNewIndex - iOldIndex) * iHeight);
//			}
//		}
//
//		var bNewListHasCurrentMessage = !!this.currentMessage() && (_.indexOf(aNewUids, this.currentMessage().uid()) !== -1);
//		if (bNewListHasCurrentMessage && !this.currentMessage().selected()) {
//			this.selector.itemSelected(this.currentMessage());
//		}

		if ((this.lockTopScroll() || this.lockBottomScroll()) && !this.isLoading()) {
			this.lockTopScroll(false);
			this.lockBottomScroll(false);
		}
	}.bind(this));
	
	this._search = ko.observable('');
	this.search = ko.computed({
		'read': function () {
			return $.trim(this._search());
		},
		'write': this._search,
		'owner': this
	});
	
	this.isEmptyList = ko.computed(function () {
		return this.collection().length === 0;
	}, this);

	this.isNotEmptyList = ko.computed(function () {
		return this.collection().length !== 0;
	}, this);

	this.isSearch = ko.computed(function () {
		return this.search().length > 0;
	}, this);

	this.isEverywhereSearch = ko.computed(function () {
		return this.isSearch() && this.folderFullName() === Settings.AllMailsFolder;
	}, this);

	this.isSubfoldersSearch = ko.computed(function () {
		return this.isSearch() && this.filters() === Enums.FolderFilter.Subfolders;
	}, this);
	this.isSubfoldersSearch.subscribe(() => {
		if (!this.isSubfoldersSearch()) {
			const folder = MailCache.getCurrentFolder();
			folder.removeFilteredMessageListsFromCache(Enums.FolderFilter.Subfolders);
			this.useSubfoldersSearch(false);
		}
	})

	this.isUnseenFilter = ko.computed(function () {
		return this.filters() === Enums.FolderFilter.Unseen;
	}, this);

	this.isLoading = MailCache.messagesLoading;
	this.showLoadingOnTop = ko.observable(false);

	this.isError = MailCache.messagesLoadingError;

	this.visibleInfoLoading = ko.computed(function () {
		return !this.isSearch() && this.isLoading();
	}, this);
	this.visibleInfoSearchLoading = ko.computed(function () {
		return this.isSearch() && !this.isUnseenFilter() && this.isLoading();
	}, this);
	this.loadingText = ko.computed(function () {
		if (this.visibleInfoLoading()) {
			return TextUtils.i18n('%MODULENAME%/INFO_LOADING_MESSAGE_LIST');
		}
		if (this.visibleInfoSearchLoading()) {
			return TextUtils.i18n('%MODULENAME%/INFO_SEARCHING_FOR_MESSAGES');
		}
		return '';
	}, this);
	this.visibleInfoSearchList = ko.computed(function () {
		return this.isSearch() && !this.isUnseenFilter() && !this.isLoading() && !this.isEmptyList();
	}, this);
	this.visibleInfoMessageListEmpty = ko.computed(function () {
		return !this.isLoading() && !this.isSearch() && (this.filters() === '') && this.isEmptyList() && !this.isError();
	}, this);
	this.visibleInfoStarredFolderEmpty = ko.computed(function () {
		return !this.isLoading() && !this.isSearch() && (this.filters() === Enums.FolderFilter.Flagged) && this.isEmptyList() && !this.isError();
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
	this.visibleSubfoldersSearchButton = ko.computed(function () {
		return !this.isSubfoldersSearch() && !this.isEverywhereSearch() && MailCache.getCurrentFolder()?.subfolders().length;
	}, this);
	this.visibleInfoUnseenFilterEmpty = ko.computed(function () {
		return this.isUnseenFilter() && this.isEmptyList() && !this.isError() && !this.isLoading();
	}, this);

	this.useEverywhereSearch = ko.observable(Storage.getData('useEverywhereSearch') || false);
	this.useEverywhereSearch.subscribe(function () {
		Storage.setData('useEverywhereSearch', this.useEverywhereSearch());
	}, this);
	this.globalSearchButtonText = ko.computed(() => {
		return this.useEverywhereSearch()
				? TextUtils.i18n('%MODULENAME%/LABEL_IN_ALL_MAIL_FOLDERS')
				: TextUtils.i18n('%MODULENAME%/LABEL_IN_THIS_FOLDER');
	});
	this.useSubfoldersSearch = ko.observable(false);

	this.allowSearchEverywhere = ko.computed(function () {
		return !!this.folderList().allMailsFolder();
	}, this);
	this.folderBeforeSearchEverywhere = ko.observable('');
	this.filtersBeforeSearchEverywhere = ko.observable('');
	this.searchPhraseIsCorrected = ko.observable(false);
	this.isAdvancedSearch = ko.observable(false);
	this.searchText = ko.computed(function () {
		const searchPhraseOriginal = this.search()
		const searchPhraseCorrected = this.getCorrectedSearchPhrase(searchPhraseOriginal);
		this.searchPhraseIsCorrected(searchPhraseOriginal !== searchPhraseCorrected);

		let sText = ''
		const sSearchText = TextUtils.encodeHtml(searchPhraseCorrected)
		const sFolderName = MailCache.getCurrentFolder() ? TextUtils.encodeHtml(MailCache.getCurrentFolder().displayName()) : ''

		if (this.isEverywhereSearch()) {
			sText = TextUtils.i18n('%MODULENAME%/INFO_SEARCH_EVERYWHERE_RESULT', {
				'SEARCH': sSearchText
			})
		} else if (this.isSubfoldersSearch()) {
			sText = TextUtils.i18n('%MODULENAME%/INFO_SEARCH_SUBFOLDERS_RESULT', {
				'SEARCH': sSearchText,
				'FOLDER': sFolderName
			})
	 	} else {
			sText = TextUtils.i18n('%MODULENAME%/INFO_SEARCH_RESULT', {
				'SEARCH': sSearchText,
				'FOLDER': sFolderName
			})
		}

		return sText
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
				'SEARCH': TextUtils.encodeHtml(this.search()),
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
			aCheckedUids = _.map(aChecked, function (oItem) {
				return MailCache.getMessageUid(oItem);
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
			aChecked = [MailCache.getMessageUid(MailCache.currentMessage())];
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
			sUid = !App.isMobile() && this.currentMessage() ? this.currentMessage().uid() : '',
			sSearch = this.search()
		;
		
		if (!this.pageSwitcherLocked())
		{
			this.changeRoutingForMessageList(sFolder, iPage, sUid, sSearch, this.filters(), this.sSortBy, this.iSortOrder);
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

	this.searchAttachmentsCheckbox = ko.observable(false);
	this.advancedSearchButtonText = ko.computed(() => {
		return this.isAdvancedSearch()
				? TextUtils.i18n('%MODULENAME%/LABEL_IN_SELECTED_FIELDS')
				: TextUtils.i18n('%MODULENAME%/LABEL_IN_ALL_FIELDS');
	});

	this.searchFromFocus = ko.observable(false);
	this.searchSubjectFocus = ko.observable(false);
	this.searchToFocus = ko.observable(false);
	this.searchTextFocus = ko.observable(false);
	this.searchTrigger = ko.observable(null);
	this.searchDateStartFocus = ko.observable(false);
	this.searchDateEndFocus = ko.observable(false);
	this.searchDateStartDom = ko.observable(null);
	this.searchDateStart = ko.observable('');
	this.searchDateEndDom = ko.observable(null);
	this.searchDateEnd = ko.observable('');
	this.dateFormatDatePicker = 'yy.mm.dd';
	this.attachmentsPlaceholder = ko.computed(function () {
		return TextUtils.i18n('%MODULENAME%/LABEL_HAS_ATTACHMENTS');
	}, this);

	_.delay(_.bind(function(){
		this.createDatePickerObject(this.searchDateStartDom(), this.searchDateStart);
		this.createDatePickerObject(this.searchDateEndDom(), this.searchDateEnd);
	}, this), 1000);
	
	this.customMessageItemViewTemplate = ko.observable('');
	
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
	$(oElement).datepicker({
		showOtherMonths: true,
		selectOtherMonths: true,
		monthNames: DateUtils.getMonthNamesArray(),
		dayNamesMin: TextUtils.i18n('COREWEBCLIENT/LIST_DAY_NAMES_MIN').split(' '),
		nextText: '',
		prevText: '',
		firstDay: Types.pInt(ModulesManager.run('CalendarWebclient', 'getWeekStartsOn')),
		showOn: 'focus',
		dateFormat: this.dateFormatDatePicker,
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
 * @param {string} iSortOrder
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
	this.openMessaheInPopupOrTabBound(oMessage);
//	if (oMessage.threadNextLoadingVisible())
//	{
//		oMessage.loadNextMessages();
//	}
//	else
//	{
//		oMessage.openThread();
//	}
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
				ComposeUtils.composeMessageFromDrafts(oMessage);
			}
			else
			{
				this.openMessaheInPopupOrTabBound(oMessage);
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

/**
 * @param {Array} aParams
 */
CMessageListView.prototype.onRoute = function (aParams)
{
	var
		oParams = LinksUtils.parseMailbox(aParams),
		sCurrentFolder = this.folderFullName() || this.folderList().inboxFolderFullName(),
		bRouteChanged = this.currentPage() !== oParams.Page ||
			sCurrentFolder !== oParams.Folder ||
			this.filters() !== oParams.Filters ||
			this.search() !== oParams.Search || this.sSortBy !== oParams.SortBy || this.iSortOrder !== oParams.SortOrder,
		bWaitForUnseenMessages = oParams.Filters === Enums.FolderFilter.Unseen && MailCache.waitForUnseenMessages(),
		bMailsPerPageChanged = Settings.MailsPerPage !== this.oPageSwitcher.perPage()
	;
	
	this.pageSwitcherLocked(true);
	if (sCurrentFolder !== oParams.Folder || this.search() !== oParams.Search || this.filters() !== oParams.Filters)
	{
		this.oPageSwitcher.clear();
	}
	else
	{
		this.oPageSwitcher.setPage(oParams.Page, Settings.MailsPerPage);
	}
	this.pageSwitcherLocked(false);
	
	if (oParams.Page !== this.oPageSwitcher.currentPage())
	{
		if (this.folderList().iAccountId === 0)
		{
			this.aRouteParams = aParams;
		}
		else
		{
			Routing.replaceHash(LinksUtils.getMailbox(oParams.Folder, this.oPageSwitcher.currentPage(), oParams.Uid, oParams.Search, oParams.Filters));
		}
	}

	this.currentPage(this.oPageSwitcher.currentPage());
	this.folderFullName(oParams.Folder);
	this.filters(oParams.Filters);
	this.search(oParams.Search);
	if (this.search().length > 0) {
		this.useEverywhereSearch(this.folderFullName() === Settings.AllMailsFolder);
	}
	SearchUtils.parseAdvancedSearch.call(this);
	this.sSortBy = oParams.SortBy;
	this.iSortOrder = oParams.SortOrder;
	_.each(this.aSortList, function (oSortData) {
		if (oSortData.sSortBy === this.sSortBy)
		{
			oSortData.selected(true);
			oSortData.sortOrder(this.iSortOrder);
		}
		else
		{
			oSortData.selected(false);
		}
	}.bind(this));

	this.setCurrentFolder();
	
	if (bRouteChanged || bMailsPerPageChanged || this.collection().length === 0)
	{
		MailCache.resetCurrentPage();
		this.requestMessageList(1);
	} else if (bWaitForUnseenMessages) {
		this.requestMessageList();
	}
};

CMessageListView.prototype.setCurrentFolder = function ()
{
	MailCache.setCurrentFolder(this.folderFullName(), this.filters());
	this.folderType(MailCache.getCurrentFolderType());
};

CMessageListView.prototype.requestMessageList = function (iPage)
{
	var sFullName = MailCache.getCurrentFolderFullname();
	var sFilters = this.filters();
	
	if (iPage === undefined)
	{
		iPage = MailCache.page();
	}
	
	if (sFullName.length > 0)
	{
		if (sFilters === Enums.FolderFilter.Unseen)
		{
			MailCache.waitForUnseenMessages(true);
		}
		MailCache.changeCurrentMessageList(sFullName, iPage, this.search(), sFilters, this.sSortBy, this.iSortOrder);
	}
	else
	{
		MailCache.checkCurrentFolderList();
	}
};

CMessageListView.prototype.onSearchClick = function ()
{
	var
		sFolder = MailCache.getCurrentFolderFullname(),
		iPage = 1,
		sSearch = this.searchInput(),
		sFilters = this.filters()
	;

	if (this.isAdvancedSearch()) {
		sSearch = SearchUtils.calculateSearchStringFromAdvancedForm.call(this);
	}

	if (this.useSubfoldersSearch()) {
		sFilters = Enums.FolderFilter.Subfolders;
	} else if (this.allowSearchEverywhere()) {
		const isAllMailsFolder = sFolder === Settings.AllMailsFolder;
		if (this.useEverywhereSearch() && !isAllMailsFolder) {
			this.folderBeforeSearchEverywhere(sFolder);
			this.filtersBeforeSearchEverywhere(sFilters);
			sFolder = Settings.AllMailsFolder;
			sFilters = '';
		} else if (!this.useEverywhereSearch() && isAllMailsFolder) {
			sFolder = this.folderBeforeSearchEverywhere() || this.folderList().inboxFolderFullName();
			sFilters = this.filtersBeforeSearchEverywhere() || '';
		}
	}

	this.changeRoutingForMessageList(sFolder, iPage, '', sSearch, sFilters);
};

CMessageListView.prototype.toggleGlobalSearch = function ()
{
	this.useEverywhereSearch(!this.useEverywhereSearch());
	if (this.search()) {
		this.useSubfoldersSearch(false);
		this.onSearchClick();
	}
};

CMessageListView.prototype.onExtendSearchClick = function ()
{
	if (this.search()) {
		this.useSubfoldersSearch(true);
		this.onSearchClick();
	}
};

CMessageListView.prototype.onExtendSearchClick = function ()
{
	if (this.search()) {
		this.useSubfoldersSearch(true);
		this.onSearchClick();
	}
};

CMessageListView.prototype.onRetryClick = function ()
{
	this.requestMessageList();
};

CMessageListView.prototype.onClearSearchClick = function ()
{
	var
		sFolder = MailCache.getCurrentFolderFullname(),
		sUid = this.currentMessage() ? this.currentMessage().uid() : '',
		sSearch = '',
		sFilters = this.filters(),
		iPage = 1
	;

	if (this.isEverywhereSearch())
	{
		sFolder = this.folderBeforeSearchEverywhere() || this.folderList().inboxFolderFullName();
		sFilters = this.filtersBeforeSearchEverywhere() || '';
		sUid = '';
	}
	this.clearAdvancedSearch();
	if (this.isSubfoldersSearch()) {
		this.useSubfoldersSearch(false);
		sFilters = '';
	}
	this.changeRoutingForMessageList(sFolder, iPage, sUid, sSearch, sFilters, this.sSortBy, this.iSortOrder);
};

CMessageListView.prototype.onClearFilterClick = function ()
{
	var
		sFolder = MailCache.getCurrentFolderFullname(),
		sUid = this.currentMessage() ? this.currentMessage().uid() : '',
		sSearch = '',
		iPage = 1,
		sFilters = ''
	;

	this.clearAdvancedSearch();
	this.changeRoutingForMessageList(sFolder, iPage, sUid, sSearch, sFilters, this.sSortBy, this.iSortOrder);
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
	
	return (oFolder.type() === Enums.FolderTypes.Drafts) && (oMessage.uid() === MailCache.savingDraftUid());
};

/**
 * @param {Object} oMessage
 */
CMessageListView.prototype.routeForMessage = function (oMessage)
{
	if (oMessage !== null && !this.isSavingDraft(oMessage))
	{
		var
			oFolder = MailCache.getCurrentFolder(),
			sFolder = MailCache.getCurrentFolderFullname(),
			iPage = this.oPageSwitcher.currentPage(),
			sUid = MailCache.getMessageUid(oMessage),
			sCurrentUid = this.currentMessage() ? this.currentMessage().uid() : '',
			sSearch = this.search()
		;

		if (sUid !== '' && sUid !== sCurrentUid)
		{
			if (App.isMobile() && oFolder.type() === Enums.FolderTypes.Drafts)
			{
				const isPrivate = PrivateMessagingUtils.isPrivateMessage(oMessage);
				Routing.setHash(LinksUtils.getComposeFromMessage('drafts', isPrivate, oMessage.accountId(), oMessage.folder(), oMessage.uid()));
			}
			else
			{
				this.changeRoutingForMessageList(sFolder, iPage, sUid, sSearch, this.filters(), this.sSortBy, this.iSortOrder);
				if (App.isMobile() && MailCache.currentMessage() && sUid === MailCache.currentMessage().uid())
				{
					MailCache.currentMessage.valueHasMutated();
				}
			}
		}
	}
};

/**
 * @param {Object} $viewDom
 */
CMessageListView.prototype.onBind = function ($viewDom)
{
	this.$viewDom = $viewDom;
	var
		self = this,
		fStopPopagation = _.bind(function (oEvent) {
			if (oEvent && oEvent.stopPropagation)
			{
				oEvent.stopPropagation();
			}
		}, this)
	;

	var messageListDom = $('.message_list', $viewDom);
	messageListDom
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

	var oMessageListScrollDom = $('.message_list_scroll', $viewDom);
	oMessageListScrollDom
		.on('scroll', function () {
			var
				iScrollTop = oMessageListScrollDom.scrollTop(),
				bScrollAtTop = iScrollTop < 200,
				bScrollAtBottom = (messageListDom.height() - (iScrollTop + oMessageListScrollDom.height())) < 200
			;

			if (bScrollAtTop && !bScrollAtBottom) {
				if (MailCache.page() > 1 && !this.lockTopScroll()) {
					// load prev page
					this.lockTopScroll(MailCache.page() < MailCache.prevPage());
					this.lockBottomScroll(false);
					this.requestMessageList(MailCache.page() - 1);
				}
			} else if (bScrollAtBottom && !bScrollAtTop) {
				if (MailCache.page() * Settings.MailsPerPage < this.totalCount() && !this.lockBottomScroll()) {
					// load next page
					this.lockBottomScroll(MailCache.page() > MailCache.prevPage());
					this.lockTopScroll(false);
					this.requestMessageList(MailCache.page() + 1);
				}
			}
		}.bind(this));

	this.selector.initOnApplyBindings(
		'.message_sub_list .item',
		'.message_sub_list .item.selected',
		'.message_sub_list .item .custom_checkbox',
		$('.message_list', $viewDom),
		$('.message_list_scroll.scroll-inner', $viewDom)
	);

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
		MailCache.executeGroupOperation('SetMessageFlagged', [MailCache.getMessageUid(oMessage)], 'flagged', !oMessage.flagged());
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
	const toFolder = MailCache.getFolderByFullName(MailCache.currentAccountId(), sToFolder);
	if (MailCache.isListWithComplexUids()) {
		MailUtils.moveMessagesWithComplexUids(this.checkedOrSelectedUids(), toFolder);
	} else {
		MailCache.moveMessagesToFolder(MailCache.getCurrentFolder(), toFolder, this.checkedOrSelectedUids());
	}
};

CMessageListView.prototype.executeCopyToFolder = function (sToFolder)
{
	MailCache.copyMessagesToFolder(sToFolder, this.checkedOrSelectedUids());
};

/**
 * Calls for the selected messages delete operation. Called from the keyboard.
 * 
 * @param {Array} aMessages
 */
CMessageListView.prototype.onDeletePress = function (aMessages)
{
	var aUids = MailCache.oUnifiedInbox.selected() ?
			_.map(aMessages, function (oMessage) { return oMessage.unifiedUid(); }) :
			_.map(aMessages, function (oMessage) { return oMessage.uid(); });
//	App.sendLogMessage(JSON.stringify({
//		Message: 'Pressing delete key on keyboard',
//		Uids: aUids
//	}));

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
	var aUids = this.checkedOrSelectedUids();
//	App.sendLogMessage(JSON.stringify({
//		Message: 'Mouse click on delete button in UI',
//		Uids: aUids
//	}));
	this.deleteMessages(aUids);
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
	
	if (aUids.length === 1 && MailCache.currentMessage()
		&& (aUids[0] === MailCache.currentMessage().uid() || aUids[0] === MailCache.currentMessage().unifiedUid()))
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
					return oMessage && _.isFunction(oMessage.uid) && (oMessage.uid() === sUidToOpenAfter || oMessage.unifiedUid() === sUidToOpenAfter);
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
	var aUids = this.checkedOrSelectedUids();
	if (MailCache.oUnifiedInbox.selected())
	{
		var oUidsByAccounts = MailCache.getUidsSeparatedByAccounts(aUids);

		_.each(oUidsByAccounts, function (oData) {
			var
				aUidsByAccount = oData.Uids,
				iAccountId = oData.AccountId,
				oFolderList = MailCache.oFolderListItems[iAccountId],
				oAccSpam = oFolderList ? oFolderList.spamFolder() : null,
				oAccInbox = oFolderList ? oFolderList.inboxFolder() : null
			;
			if (oAccInbox && oAccSpam && oAccInbox.fullName() !== oAccSpam.fullName())
			{
				MailCache.moveMessagesToFolder(oAccInbox, oAccSpam, aUidsByAccount);
			}
		});
	}
	else
	{
		var oSpamFolder = this.folderList().spamFolder();

		if (oSpamFolder && MailCache.getCurrentFolderFullname() !== oSpamFolder.fullName())
		{
			if (MailCache.isListWithComplexUids()) {
				MailUtils.moveMessagesWithComplexUids(aUids, oSpamFolder);
			} else {
				MailCache.moveMessagesToFolder(MailCache.getCurrentFolder(), oSpamFolder, aUids);
			}
	}
	}
};

/**
 * Moves the selected messages from the Spam folder to folder Inbox.
 */
CMessageListView.prototype.executeNotSpam = function ()
{
	var
		oCurrentFolder = MailCache.getCurrentFolder(),
		oInbox = this.folderList().inboxFolder()
	;

	if (oInbox && oCurrentFolder && oCurrentFolder.fullName() !== oInbox.fullName())
	{
		MailCache.moveMessagesToFolder(oCurrentFolder, oInbox, this.checkedOrSelectedUids());
	}
};

CMessageListView.prototype.executeSort = function (sSortBy)
{
	_.each(this.aSortList, function (oSortData) {
		if (oSortData.sSortBy === sSortBy)
		{
			if (oSortData.selected())
			{
				oSortData.sortOrder(oSortData.sortOrder() === Enums.SortOrder.Asc ? Enums.SortOrder.Desc : Enums.SortOrder.Asc);
			}
			oSortData.selected(true);
			var
				sFolder = MailCache.getCurrentFolderFullname(),
				iPage = this.oPageSwitcher.currentPage(),
				sUid = '',
				sSearch = this.search()
			;
			
			this.changeRoutingForMessageList(sFolder, iPage, sUid, sSearch, this.filters(), oSortData.sSortBy, oSortData.sortOrder());
		}
		else
		{
			oSortData.selected(false);
		}
	}.bind(this));
};

CMessageListView.prototype.clearAdvancedSearch = function ()
{
	this.searchInputFrom('');
	this.searchInputTo('');
	this.searchInputSubject('');
	this.searchInputText('');
	this.isAdvancedSearch(false);
	this.searchAttachmentsCheckbox(false);
	this.searchDateStart('');
	this.searchDateEnd('');
};

CMessageListView.prototype.toggleAdvancedSearch = function ()
{
	this.isAdvancedSearch(!this.isAdvancedSearch());
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

CMessageListView.prototype.getCorrectedSearchPhrase = function (sSearchPhrase)
{
	const regex = new RegExp(Settings.SearchWordFilterPattern, "gmi")
	const iMinWordLength = Settings.SearchWordMinLength
	const iMaxWordLength = Settings.SearchWordMaxLength
	let result = ''
	
	if (this.isAdvancedSearch()) {
		const sSearchParts = SearchUtils.getAdvancedSearchParts(sSearchPhrase);
		const aFilteredParts = []
		_.each(sSearchParts, (value, key) => {
			if (key === 'subject' || key === 'text') {
				let aWords = value.split(' ')
				aWords = aWords.map( word => word.replace(regex, '') )
				aWords = aWords.filter(word => word.length >= iMinWordLength && word.length <= iMaxWordLength )

				value = aWords.join(' ')
			}

			if (value) {
				aFilteredParts.push(`${key}:${value}`)
			}
		})

		result = aFilteredParts.join(' ') 
	} else {
		let aWords = sSearchPhrase.split(' ')
		aWords = aWords.map( word => word.replace(regex, '') )
		aWords = aWords.filter(word => word.length >= iMinWordLength && word.length <= iMaxWordLength )

		result = aWords.join(' ')
	}

	return result
};

module.exports = CMessageListView;
