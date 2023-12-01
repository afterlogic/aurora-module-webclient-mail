'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),

	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	WindowOpener = require('%PathToCoreWebclientModule%/js/WindowOpener.js'),

	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),

	ComposeUtils = require('modules/%ModuleName%/js/utils/Compose.js'),
	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),

	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	MailCache = require('modules/%ModuleName%/js/Cache.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),

	CFolderListView = require('modules/%ModuleName%/js/views/CFolderListView.js'),
	CMessageListView = require('modules/%ModuleName%/js/views/CMessageListView.js'),
	MessagePaneView = require('modules/%ModuleName%/js/views/MessagePaneView.js')
;

/**
 * @constructor
 */
function CMailView()
{
	CAbstractScreenView.call(this, '%ModuleName%');

	App.broadcastEvent('%ModuleName%::ConstructView::before', {'Name': this.ViewConstructorName, 'View': this, 'MailCache': MailCache});

	this.browserTitle = ko.computed(function () {
		return AccountList.getEmail() + ' - ' + TextUtils.i18n('%MODULENAME%/HEADING_BROWSER_TAB');
	});

	this.folderList = MailCache.folderList;
	this.domFoldersMoveTo = ko.observable(null);

	this.openMessageInNewWindowBound = _.bind(this.openMessageInNewWindow, this);

	this.oFolderList = new CFolderListView();
	this.isUnifiedFolderCurrent = MailCache.oUnifiedInbox.selected;
	this.oBaseMessageList = new CMessageListView(this.openMessageInNewWindowBound);
	this.messageList = ko.observable(this.oBaseMessageList);
	this.isSearchMultiFolders = ko.computed(function () {
		return this.messageList().searchFoldersMode() === Enums.SearchFoldersMode.Sub || this.messageList().searchFoldersMode() === Enums.SearchFoldersMode.All;
	}, this);

	this.oBaseMessagePaneView = MessagePaneView;
	this.messagePane = ko.observable(this.oBaseMessagePaneView);
	this.messagePane().openMessageInNewWindowBound = this.openMessageInNewWindowBound;
	this.messagePane.subscribe(function () {
		this.bindMessagePane();
		this.messagePane().expandMessagePaneWidth = this.expandMessagePaneWidth;
	}, this);
	
	this.expandListPaneWidth = ko.observable(false);
	this.expandMessagePaneWidth = ko.observable(false);
	this.messagePane().expandMessagePaneWidth = this.expandMessagePaneWidth;
	MailCache.currentMessage.subscribe(function () {
		if (!MailCache.currentMessage()) {
			this.expandMessagePaneWidth(false);
		}
	}, this);

	this.isEnableGroupOperations = ko.computed(() => {
		return this.messageList().isEnableGroupOperations();
	});

	this.sCustomBigButtonModule = '';
	this.fCustomBigButtonHandler = null;
	this.customBigButtonText = ko.observable('');
	this.bigButtonCommand = Utils.createCommand(this, function () {
		if (_.isFunction(this.fCustomBigButtonHandler))
		{
			this.fCustomBigButtonHandler();
		}
		else
		{
			this.executeCompose();
		}
	});
	this.bigButtonText = ko.computed(function () {
		if (this.customBigButtonText() !== '')
		{
			return this.customBigButtonText();
		}
		return TextUtils.i18n('%MODULENAME%/ACTION_NEW_MESSAGE');
	}, this);

	this.isTemplateFolder = ko.computed(function () {
		return MailCache.isTemplateFolder(MailCache.getCurrentFolderFullname());
	}, this);

	this.checkMailCommand = Utils.createCommand(this, this.executeCheckMail);
	this.checkMailIndicator = ko.observable(true).extend({ throttle: 50 });
	ko.computed(function () {
		this.checkMailIndicator(MailCache.checkMailStarted() || MailCache.messagesLoading());
	}, this);
	this.customModulesDisabledMark = ko.observableArray([]);
	this.visibleMarkTool = ko.computed(function () {
		return !this.isTemplateFolder() && !Types.isNonEmptyArray(this.customModulesDisabledMark());
	}, this);
	this.markAsReadCommand = Utils.createCommand(this.messageList(), () => {
		this.messageList().executeMarkAsRead();
	}, this.isEnableGroupOperations);
	this.markAsUnreadCommand = Utils.createCommand(this.messageList(), () => {
		this.messageList().executeMarkAsUnread();
	}, this.isEnableGroupOperations);
	this.markAllReadCommand = Utils.createCommand(this.messageList(), () => {
		this.messageList().executeMarkAllRead();
	});
	this.customModulesDisabledMove = ko.observableArray([]);
	this.visibleMoveTool = ko.computed(function () {
		return !MailCache.oUnifiedInbox.selected() && !Types.isNonEmptyArray(this.customModulesDisabledMove());
	}, this);

	this.needToCopyDraggedItems = ko.observable(false);

	this.moveToFolderTemplate = '%ModuleName%_Messages_MoveButtonView'; // can be override by other modules
	this.moveToFolderCommand = Utils.createCommand(this, function () {}, this.isEnableGroupOperations);

	this.deleteCommand = Utils.createCommand(this.messageList(), () => {
		this.messageList().executeDelete();
	}, this.isEnableGroupOperations);
	this.selectedCount = ko.computed(function () {
		return this.messageList().checkedUids().length;
	}, this);
	this.emptyTrashCommand = Utils.createCommand(MailCache, MailCache.executeEmptyTrash, () => this.messageList().isNotEmptyList());
	this.emptySpamCommand = Utils.createCommand(MailCache, MailCache.executeEmptySpam, () => this.messageList().isNotEmptyList());
	this.spamCommand = Utils.createCommand(this.messageList(), () => {
		this.messageList().executeSpam();
	}, this.isEnableGroupOperations);
	this.notSpamCommand = Utils.createCommand(this.messageList(), () => {
		this.messageList().executeNotSpam();
	}, this.isEnableGroupOperations);

	this.isSpamFolder = ko.computed(function () {
		return MailCache.getCurrentFolderType() === Enums.FolderTypes.Spam;
	}, this);

	this.customModulesDisabledSpam = ko.observableArray([]);
	this.allowedSpamAction = ko.computed(function () {
		return Settings.AllowSpamFolder && this.folderList().spamFolder() &&
				!this.isSpamFolder() && !this.isTemplateFolder() &&
				!Types.isNonEmptyArray(this.customModulesDisabledSpam());
	}, this);

	this.allowedNotSpamAction = ko.computed(function () {
		return Settings.AllowSpamFolder && this.isSpamFolder() && !this.isTemplateFolder();
	}, this);

	this.isTrashFolder = ko.computed(function () {
		return MailCache.getCurrentFolderType() === Enums.FolderTypes.Trash;
	}, this);

	if (Settings.HorizontalLayout)
	{
		$('html').addClass('layout-horiz-split');
	}

	App.subscribeEvent('CoreWebclient::GetDebugInfo', _.bind(function (oParams) {
		oParams.Info.push('checkMailStarted: ' + MailCache.checkMailStarted() + ', messagesLoading: ' + MailCache.messagesLoading());
	}, this));

	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
}

_.extendOwn(CMailView.prototype, CAbstractScreenView.prototype);

CMailView.prototype.ViewTemplate = Settings.HorizontalLayout ? '%ModuleName%_MailHorizontalLayoutView' : '%ModuleName%_MailView';
CMailView.prototype.ViewConstructorName = 'CMailView';

/**
 * Checks if there are changes in Mail screen.
 * @returns {Boolean}
 */
CMailView.prototype.hasUnsavedChanges = function ()
{
	return this.messagePane() && _.isFunction(this.messagePane().hasUnsavedChanges) && this.messagePane().hasUnsavedChanges();
};

/**
 * Discards changes in Mail screen.
 */
CMailView.prototype.discardChanges = function ()
{
	if (this.messagePane() && _.isFunction(this.messagePane().discardChanges))
	{
		this.messagePane().discardChanges();
	}
};

CMailView.prototype.setCustomPreviewPane = function (sModuleName, oPreviewPane)
{
	if (this.messagePane().__customModuleName !== sModuleName)
	{
		if (_.isFunction(this.messagePane().onHide))
		{
			this.messagePane().onHide();
		}

		oPreviewPane.__customModuleName = sModuleName;
		this.messagePane(oPreviewPane);

		if (_.isFunction(this.messagePane().onShow))
		{
			this.messagePane().onShow();
		}
	}
};

CMailView.prototype.removeCustomPreviewPane = function (sModuleName)
{
	if (this.messagePane().__customModuleName === sModuleName)
	{
		if (_.isFunction(this.messagePane().onHide))
		{
			this.messagePane().onHide();
		}

		this.messagePane(this.oBaseMessagePaneView);

		if (_.isFunction(this.messagePane().onShow))
		{
			this.messagePane().onShow();
		}
	}
};

CMailView.prototype.setCustomMessageList = function (customModuleName, customMessageList)
{
	if (this.messageList().__customModuleName !== customModuleName) {
		customMessageList.__customModuleName = customModuleName;
		this.changeMessageList(customMessageList);
	}
};

CMailView.prototype.removeCustomMessageList = function (customModuleName)
{
	if (this.messageList().__customModuleName === customModuleName) {
		this.changeMessageList(this.oBaseMessageList);
	}
};

CMailView.prototype.changeMessageList = function (newMessageList)
{
	if (_.isFunction(this.messageList().onHide)) {
		this.messageList().onHide();
	}
	if (_.isFunction(this.messageList().unbind)) {
		this.messageList().unbind();
	}

	this.messageList(newMessageList);

	if (_.isFunction(this.messageList().onBind)) {
		this.messageList().onBind(this.$viewDom);
	}

	if (_.isFunction(this.messageList().onShow)) {
		this.messageList().onShow();
	}
};

CMailView.prototype.setCustomBigButton = function (sModuleName, fHandler, sText)
{
	this.sCustomBigButtonModule = sModuleName;
	this.fCustomBigButtonHandler = fHandler;
	this.customBigButtonText(sText);
};

CMailView.prototype.removeCustomBigButton = function (sModuleName)
{
	if (this.sCustomBigButtonModule === sModuleName)
	{
		this.sCustomBigButtonModule = '';
		this.fCustomBigButtonHandler = null;
		this.customBigButtonText('');
	}
};

CMailView.prototype.resetDisabledTools = function (sModuleName, aDisabledTools)
{
	if ($.inArray('spam', aDisabledTools) !== -1)
	{
		this.customModulesDisabledSpam(_.union(this.customModulesDisabledSpam(), [sModuleName]));
	}
	else
	{
		this.customModulesDisabledSpam(_.without(this.customModulesDisabledSpam(), sModuleName));
	}
	if ($.inArray('move', aDisabledTools) !== -1)
	{
		this.customModulesDisabledMove(_.union(this.customModulesDisabledMove(), [sModuleName]));
	}
	else
	{
		this.customModulesDisabledMove(_.without(this.customModulesDisabledMove(), sModuleName));
	}
	if ($.inArray('mark', aDisabledTools) !== -1)
	{
		this.customModulesDisabledMark(_.union(this.customModulesDisabledMark(), [sModuleName]));
	}
	else
	{
		this.customModulesDisabledMark(_.without(this.customModulesDisabledMark(), sModuleName));
	}
};

CMailView.prototype.executeCompose = function ()
{
	ComposeUtils.composeMessage();
};

CMailView.prototype.executeCheckMail = function ()
{
	MailCache.checkMessageFlags();
	MailCache.executeCheckMail(true);
};

/**
 * @param {object} oMessage
 */
CMailView.prototype.openMessageInNewWindow = function (oMessage)
{
	if (oMessage && oMessage.longUid)
	{
		var
			iAccountId = oMessage.accountId(),
			sFolder = oMessage.folder(),
			sUid = oMessage.longUid(),
			oFolder = this.folderList().getFolderByFullName(sFolder),
			bDraftFolder = (oFolder?.type() === Enums.FolderTypes.Drafts),
			sHash = ''
		;

		if (this.isUnifiedFolderCurrent()) {
			sFolder = MailCache.oUnifiedInbox.fullName()
			bDraftFolder = false
		}
		if (bDraftFolder)
		{
			sHash = Routing.buildHashFromArray(LinksUtils.getComposeFromMessage('drafts', iAccountId, sFolder, sUid));
		}
		else
		{
			sHash = Routing.buildHashFromArray(LinksUtils.getViewMessage(iAccountId, sFolder, sUid));
			if (_.isFunction(this.messagePane().passReplyDataToNewTab))
			{
				this.messagePane().passReplyDataToNewTab(oMessage.longUid());
			}
		}

		WindowOpener.openTab('?message-newtab' + sHash);
	}
};

/**
 * @param {Object} oData
 * @param {Object} oEvent
 */
CMailView.prototype.resizeDblClick = function (oData, oEvent)
{
	Utils.calmEvent(oEvent);
	Utils.removeSelection();
	this.expandListPaneWidth(!this.expandListPaneWidth());
};

/**
 * @param {Array} aParams
 */
CMailView.prototype.onRoute = function (aParams)
{
	if (!AccountList.hasAccount())
	{
		Routing.replaceHash(['settings', 'mail-accounts', 'account', 'create']);
		return;
	}

	var oParams = LinksUtils.parseMailbox(aParams);

	AccountList.changeCurrentAccountByHash(oParams.AccountHash);

	if (_.isFunction(this.oFolderList.onRoute)) {
		this.oFolderList.onRoute(aParams);
	}
	this.messageList().onRoute(aParams);
	if (_.isFunction(this.messagePane().onRoute))
	{
		this.messagePane().onRoute(aParams, oParams);
	}

	if (oParams.MailtoCompose)
	{
		if (App.isMobile())
		{
			var aParams = LinksUtils.getComposeWithToField(aParams[2]);
			Routing.replaceHash(aParams);
			setTimeout(function () {
				Routing.clearPreviousHash();
			}, 0);
		}
		else
		{
			ComposeUtils.composeMessageToAddresses(aParams[2]);
			Routing.replaceHash(LinksUtils.getMailbox());
		}
	}
};

CMailView.prototype.onShow = function ()
{
	if (_.isFunction(this.oFolderList.onShow)) {
		this.oFolderList.onShow();
	}
	this.messageList().onShow();
	if (_.isFunction(this.messagePane().onShow))
	{
		this.messagePane().onShow();
	}
};

CMailView.prototype.onHide = function ()
{
	this.messageList().onHide();
	if (_.isFunction(this.messagePane().onHide))
	{
		this.messagePane().onHide();
	}
};

CMailView.prototype.bindMessagePane = function ()
{
	if (_.isFunction(this.messagePane().onBind))
	{
		this.messagePane().onBind(this.$viewDom);
		this.messagePane().__bound = true;
	}
};

CMailView.prototype.onBind = function ()
{
	var oMessageList = this.messageList();

	oMessageList.onBind(this.$viewDom);
	this.bindMessagePane();

	$(this.domFoldersMoveTo()).on('click', 'span.folder', function (oEvent) {
		var sClickedFolder = $(this).data('folder');
		if (MailCache.getCurrentFolderFullname() !== sClickedFolder)
		{
			if (oEvent.ctrlKey)
			{
				oMessageList.executeCopyToFolder(sClickedFolder);
			}
			else
			{
				oMessageList.executeMoveToFolder(sClickedFolder);
			}
		}
	});

	if (!App.isMobile())
	{
		this.hotKeysBind();
	}
};

CMailView.prototype.hotKeysBind = function ()
{
	$(document).on('keydown', $.proxy(function(ev) {
		var
			sKey = ev.keyCode,
			bComputed = ev && !ev.ctrlKey && !ev.altKey && !ev.shiftKey && !Utils.isTextFieldFocused() && this.shown(),
			oList = this.messageList(),
			oFirstMessage = oList.collection()[0],
			bGotoSearch = oFirstMessage && MailCache.currentMessage() && oFirstMessage.longUid() === MailCache.currentMessage().longUid()
		;

		if (bComputed && sKey === Enums.Key.s || bComputed && bGotoSearch && sKey === Enums.Key.Up)
		{
			ev.preventDefault();
			this.searchFocus();
		}
		else if (oList.isFocused() && ev && sKey === Enums.Key.Down && oFirstMessage)
		{
			ev.preventDefault();
			oList.isFocused(false);
			oList.routeForMessage(oFirstMessage);
		}
		else if (bComputed && sKey === Enums.Key.n)
		{
			this.executeCompose();
			ev.preventDefault();
		}
	},this));
};

/**
 * Method is used from Notes module
 * @param {string} sFolderName
 * @param {number} iUid
 */
CMailView.prototype.routeMessageView = function (sFolderName, iUid)
{
	Routing.setHash(LinksUtils.getMailbox(sFolderName, this.messageList().oPageSwitcher.currentPage(), iUid));
};

/**
 * @param {Object} oMessage
 * @param {boolean} ctrlOrCmdUsed
 */
CMailView.prototype.dragAndDropHelper = function (oMessage, ctrlOrCmdUsed)
{
	if (oMessage)
	{
		oMessage.checked(true);
	}

	var
		oHelper = Utils.draggableItems(),
		aUids = this.messageList().checkedOrSelectedUids(),
		iCount = aUids.length
	;

	oHelper.data('p7-message-list-folder', MailCache.getCurrentFolderFullname());
	oHelper.data('p7-message-list-uids', aUids);

	this.needToCopyDraggedItems(ctrlOrCmdUsed);
	$('.count-text', oHelper).text(TextUtils.i18n('%MODULENAME%/LABEL_DRAG_MESSAGES_PLURAL', {
		'COUNT': ctrlOrCmdUsed ? '+ ' + iCount : iCount
	}, null, iCount));

	return oHelper;
};

/**
 * @param {Object} oToFolder
 * @param {Object} oEvent
 * @param {Object} oUi
 */
CMailView.prototype.messagesDrop = function (oToFolder, oEvent, oUi)
{
	if (oToFolder)
	{
		var
			oHelper = oUi && oUi.helper ? oUi.helper : null,
			sFolder = oHelper ? oHelper.data('p7-message-list-folder') : '',
			aUids = oHelper ? oHelper.data('p7-message-list-uids') : null
		;

		if (sFolder && aUids)
		{
			Utils.uiDropHelperAnim(oEvent, oUi);
			if(this.needToCopyDraggedItems())
			{
				this.messageList().executeCopyToFolder(oToFolder.fullName());
			}
			else
			{
				this.messageList().executeMoveToFolder(oToFolder.fullName());
			}

			this.uncheckMessages();
		}
	}
};

CMailView.prototype.searchFocus = function ()
{
	if (this.messageList().selector.useKeyboardKeys() && !Utils.isTextFieldFocused())
	{
		this.messageList().isFocused(true);
	}
};

CMailView.prototype.onVolumerClick = function (oVm, oEv)
{
	oEv.stopPropagation();
};

CMailView.prototype.uncheckMessages = function ()
{
	_.each(MailCache.messages(), function(oMessage) {
		oMessage.checked(false);
	});
};

module.exports = CMailView;
