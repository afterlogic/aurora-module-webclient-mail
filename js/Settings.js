'use strict';

var
	ko = require('knockout'),
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js')
;

module.exports = {
	ServerModuleName: 'Mail',
	HashModuleName: 'mail',
	FetchersServerModuleName: 'MtaConnector',
	AliasesServerModuleName: 'CpanelIntegrator',
	
	// from Core module
	EnableMultiTenant: false,
	
	// from Mail module
	AllowAddAccounts: false,
	AllowAutosaveInDrafts: true,
	AllowChangeMailQuotaOnMailServer: false,
	AllowDefaultAccountForUser: true,
	AllowEditDomainsInServer: true,
	AllowFetchers: false,
	AllowIdentities: false,
	AllowAliases: false,
	OnlyUserEmailsInIdentities: false,
	AllowInsertImage: true,
	AllowMultiAccounts: false,
	AutoSaveIntervalSeconds: 60,
	AllowTemplateFolders: false,
	AllowInsertTemplateOnCompose: false,
	MaxTemplatesCountOnCompose: 100,
	AllowAlwaysRefreshFolders: false,
	AutocreateMailAccountOnNewUserFirstLogin: false,
	IgnoreImapSubscription: false,
	ImageUploadSizeLimit: 0,
	AllowUnifiedInbox: true,

	// from MailWebclient module
	AllowAppRegisterMailto: false,
	AllowChangeInputDirection: true,
	FoldersExpandedByDefault: false,
	AllowSpamFolder: true,
	AllowAddNewFolderOnMainScreen: false,
	ComposeToolbarOrder: ['back', 'send', 'save', 'importance', 'MailSensitivity', 'confirmation', 'OpenPgp'],
	FontNames: [],
	DefaultFontName: '',
	FontSizes: [],
	DefaultFontSize: 12,
	AlwaysTryUseImageWhilePasting: true,
	AllowHorizontalLineButton: false,
	AllowSourceCodeButton: false,
	JoinReplyPrefixes: true,
	MailsPerPage: 50,
	MaxMessagesBodiesSizeToPrefetch: 50000,
	MessageBodyTruncationThreshold: 650000, // in bytes
	MessagesSortBy: {},
	ShowEmailAsTabName: true,
	AllowShowMessagesCountInFolderList: false,
	showMessagesCountInFolderList: ko.observable(false),
	AllowSearchMessagesBySubject: false,
	PrefixesToRemoveBeforeSearchMessagesBySubject: [],
	DisableRtlRendering: false,
	AllowQuickReply: false,
	AllowQuickSendOnCompose: false,
	MarkMessageSeenWhenViewing: true,
	MarkMessageSeenWhenAnswerForward: false,
	UserLoginPartInAccountDropdown: false,
	UseMeRecipientForMessages: true,
	messageListItemSize: ko.observable('big'),
	previewPanePosition: ko.observable('right'),
	openMessagesInPopup: ko.observable(false),
	DisableStarredInFolders: [],
	AllMailsFolder: '',
	accountsAboveFolders: ko.observable(true),

	userMailAccountsCount: ko.observable(0),
	mailAccountsEmails: ko.observableArray([]),

	// from MailWebclient module
	PdfImagesLoadTimeLimitSeconds: 2,

	AllowPrivateMessages: false,
	PrivateMessagesEmail: '',
	AllowStickyFolders: false,

	OfficeEditorExtensionsToView: [],

	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var
			oCoreDataSection = oAppData['Core'],
			oAppDataMailSection = oAppData[this.ServerModuleName],
			oAppDataMailWebclientSection = oAppData['%ModuleName%'],
			oAppDataFetchersSection = oAppData[this.FetchersServerModuleName],
			oAppDataAliasesSection = oAppData[this.AliasesServerModuleName],
			informatikAppDataSection = oAppData['InformatikProjects'],
			officeEditorAppDataSection = oAppData['OfficeDocumentEditor']
		;

		if (!_.isEmpty(oCoreDataSection))
		{
			this.EnableMultiTenant = Types.pBool(oCoreDataSection.EnableMultiTenant, this.EnableMultiTenant);
		}
		
		if (!_.isEmpty(oAppDataMailSection))
		{
			this.AllowAddAccounts = Types.pBool(oAppDataMailSection.AllowAddAccounts, this.AllowAddAccounts);
			this.AllowAutosaveInDrafts = Types.pBool(oAppDataMailSection.AllowAutosaveInDrafts, this.AllowAutosaveInDrafts);
			this.AllowChangeMailQuotaOnMailServer = Types.pBool(oAppDataMailSection.AllowChangeMailQuotaOnMailServer, this.AllowChangeMailQuotaOnMailServer);
			this.AllowDefaultAccountForUser = Types.pBool(oAppDataMailSection.AllowDefaultAccountForUser, this.AllowDefaultAccountForUser);
			this.AllowEditDomainsInServer = Types.pBool(oAppDataMailSection.AllowEditDomainsInServer, this.AllowEditDomainsInServer);
			this.AllowIdentities = Types.pBool(oAppDataMailSection.AllowIdentities, this.AllowIdentities);
			this.OnlyUserEmailsInIdentities = Types.pBool(oAppDataMailSection.OnlyUserEmailsInIdentities, this.OnlyUserEmailsInIdentities);
			this.AllowInsertImage = Types.pBool(oAppDataMailSection.AllowInsertImage, this.AllowInsertImage);
			this.AllowMultiAccounts = Types.pBool(oAppDataMailSection.AllowMultiAccounts, this.AllowMultiAccounts);
			this.AutoSaveIntervalSeconds = Types.pNonNegativeInt(oAppDataMailSection.AutoSaveIntervalSeconds, this.AutoSaveIntervalSeconds);
			this.AllowTemplateFolders = Types.pBool(oAppDataMailSection.AllowTemplateFolders, this.AllowTemplateFolders);
			this.AllowInsertTemplateOnCompose = Types.pBool(oAppDataMailSection.AllowInsertTemplateOnCompose, this.AllowInsertTemplateOnCompose);
			this.MaxTemplatesCountOnCompose = Types.pPositiveInt(oAppDataMailSection.MaxTemplatesCountOnCompose, this.MaxTemplatesCountOnCompose);
			this.AllowAlwaysRefreshFolders = Types.pBool(oAppDataMailSection.AllowAlwaysRefreshFolders, this.AllowAlwaysRefreshFolders);
			this.AutocreateMailAccountOnNewUserFirstLogin = Types.pBool(oAppDataMailSection.AutocreateMailAccountOnNewUserFirstLogin, this.AutocreateMailAccountOnNewUserFirstLogin);
			this.IgnoreImapSubscription = Types.pBool(oAppDataMailSection.IgnoreImapSubscription, this.IgnoreImapSubscription);
			this.ImageUploadSizeLimit = Types.pNonNegativeInt(oAppDataMailSection.ImageUploadSizeLimit, this.ImageUploadSizeLimit);
			this.AllowUnifiedInbox = Types.pBool(oAppDataMailSection.AllowUnifiedInbox, this.AllowUnifiedInbox);
			window.Enums.SmtpAuthType = Types.pObject(oAppDataMailSection.SmtpAuthType);

			this.MessagesSortBy = _.clone(Types.pObject(oAppDataMailSection.MessagesSortBy, this.MessagesSortBy));
			this.MessagesSortBy.Allow = Types.pBool(this.MessagesSortBy.Allow, false);
			this.MessagesSortBy.List = Types.pArray(this.MessagesSortBy.List, []);
			this.MessagesSortBy.DefaultSortBy = Types.pString(this.MessagesSortBy.DefaultSortBy, 'arrival');
			var sOrder = Types.pString(this.MessagesSortBy.DefaultSortOrder, 'desc');
			this.MessagesSortBy.DefaultSortOrder = sOrder === 'desc' ? Enums.SortOrder.Desc : Enums.SortOrder.Asc;
		}
			
		if (!_.isEmpty(oAppDataMailWebclientSection))
		{
			this.AllowAppRegisterMailto = Types.pBool(oAppDataMailWebclientSection.AllowAppRegisterMailto, this.AllowAppRegisterMailto);
			this.AllowChangeInputDirection = Types.pBool(oAppDataMailWebclientSection.AllowChangeInputDirection, this.AllowChangeInputDirection);
			this.FoldersExpandedByDefault = Types.pBool(oAppDataMailWebclientSection.FoldersExpandedByDefault, this.FoldersExpandedByDefault);
			this.AllowSpamFolder = Types.pBool(oAppDataMailWebclientSection.AllowSpamFolder, this.AllowSpamFolder);
			this.AllowAddNewFolderOnMainScreen = Types.pBool(oAppDataMailWebclientSection.AllowAddNewFolderOnMainScreen, this.AllowAddNewFolderOnMainScreen);
			this.ComposeToolbarOrder = Types.pArray(oAppDataMailWebclientSection.ComposeToolbarOrder, this.ComposeToolbarOrder);
			this.FontNames = Types.pArray(oAppDataMailWebclientSection.FontNames, this.FontNames);
			this.DefaultFontName = Types.pString(oAppDataMailWebclientSection.DefaultFontName, this.DefaultFontName);
			this.FontSizes = Types.pArray(oAppDataMailWebclientSection.FontSizes, this.FontSizes);
			this.DefaultFontSize = Types.pPositiveInt(oAppDataMailWebclientSection.DefaultFontSize, this.DefaultFontSize);
			this.AlwaysTryUseImageWhilePasting = Types.pBool(oAppDataMailWebclientSection.AlwaysTryUseImageWhilePasting, this.AlwaysTryUseImageWhilePasting);
			this.AllowHorizontalLineButton = Types.pBool(oAppDataMailWebclientSection.AllowHorizontalLineButton, this.AllowHorizontalLineButton);
			this.AllowSourceCodeButton = Types.pBool(oAppDataMailWebclientSection.AllowSourceCodeButton, this.AllowSourceCodeButton);
			this.JoinReplyPrefixes = Types.pBool(oAppDataMailWebclientSection.JoinReplyPrefixes, this.JoinReplyPrefixes);
//			this.MailsPerPage = Types.pPositiveInt(oAppDataMailWebclientSection.MailsPerPage, this.MailsPerPage);
			this.MaxMessagesBodiesSizeToPrefetch = Types.pNonNegativeInt(oAppDataMailWebclientSection.MaxMessagesBodiesSizeToPrefetch, this.MaxMessagesBodiesSizeToPrefetch);
			this.MessageBodyTruncationThreshold = Types.pNonNegativeInt(oAppDataMailWebclientSection.MessageBodyTruncationThreshold, this.MessageBodyTruncationThreshold);
			
			this.ShowEmailAsTabName = Types.pBool(oAppDataMailWebclientSection.ShowEmailAsTabName, this.ShowEmailAsTabName);
			this.AllowShowMessagesCountInFolderList = Types.pBool(oAppDataMailWebclientSection.AllowShowMessagesCountInFolderList, this.AllowShowMessagesCountInFolderList);
			this.showMessagesCountInFolderList(Types.pBool(oAppDataMailWebclientSection.ShowMessagesCountInFolderList, this.showMessagesCountInFolderList()));
			this.AllowSearchMessagesBySubject = Types.pBool(oAppDataMailWebclientSection.AllowSearchMessagesBySubject, this.AllowSearchMessagesBySubject);
			this.PrefixesToRemoveBeforeSearchMessagesBySubject = Types.pArray(oAppDataMailWebclientSection.PrefixesToRemoveBeforeSearchMessagesBySubject, this.PrefixesToRemoveBeforeSearchMessagesBySubject);
			this.DisableRtlRendering = Types.pBool(oAppDataMailWebclientSection.DisableRtlRendering, this.DisableRtlRendering);
			this.AllowQuickReply = Types.pBool(oAppDataMailWebclientSection.AllowQuickReply, this.AllowQuickReply);
			this.AllowQuickSendOnCompose = Types.pBool(oAppDataMailWebclientSection.AllowQuickSendOnCompose, this.AllowQuickSendOnCompose);
			this.MarkMessageSeenWhenViewing = Types.pBool(oAppDataMailWebclientSection.MarkMessageSeenWhenViewing, this.MarkMessageSeenWhenViewing);
			this.MarkMessageSeenWhenAnswerForward = Types.pBool(oAppDataMailWebclientSection.MarkMessageSeenWhenAnswerForward, this.MarkMessageSeenWhenAnswerForward);
			this.UserLoginPartInAccountDropdown = Types.pBool(oAppDataMailWebclientSection.UserLoginPartInAccountDropdown, this.UserLoginPartInAccountDropdown);
			this.UseMeRecipientForMessages = Types.pBool(oAppDataMailWebclientSection.UseMeRecipientForMessages, this.UseMeRecipientForMessages);
			this.messageListItemSize(Types.pString(oAppDataMailWebclientSection.MessageListItemSize, this.messageListItemSize()));
			this.previewPanePosition(Types.pString(oAppDataMailWebclientSection.PreviewPanePosition, this.previewPanePosition()));
			this.openMessagesInPopup(Types.pBool(oAppDataMailWebclientSection.OpenMessagesInPopup, this.openMessagesInPopup()));
			this.DisableStarredInFolders = Types.pArray(oAppDataMailWebclientSection.DisableStarredInFolders, this.DisableStarredInFolders);
			this.AllMailsFolder = Types.pString(oAppDataMailWebclientSection.AllMailsFolder, this.AllMailsFolder);
			this.accountsAboveFolders(Types.pBool(oAppDataMailWebclientSection.AccountsAboveFolders, this.accountsAboveFolders()));
		}
		
		if (!_.isEmpty(oAppDataFetchersSection))
		{
			this.AllowFetchers = Types.pBool(oAppDataFetchersSection.AllowFetchers, this.AllowFetchers);
		}
		if (!_.isEmpty(oAppDataAliasesSection))
		{
			this.AllowAliases = Types.pBool(oAppDataAliasesSection.AllowAliases, this.AllowAliases);
		}

		const appDataInformatikSection = oAppData.InformatikProjects;
		if (!_.isEmpty(appDataInformatikSection)) {
			this.PdfImagesLoadTimeLimitSeconds = Types.pInt(appDataInformatikSection.PdfImagesLoadTimeLimitSeconds, this.PdfImagesLoadTimeLimitSeconds);
		}

		this.AllowPrivateMessages = Types.pBool(informatikAppDataSection && informatikAppDataSection.AllowPrivateMessages, this.AllowPrivateMessages);
		this.PrivateMessagesEmail = Types.pString(informatikAppDataSection && informatikAppDataSection.PrivateMessagesEmail, this.PrivateMessagesEmail);
		this.AllowStickyFolders = Types.pBool(informatikAppDataSection && informatikAppDataSection.AllowStickyFolders, this.AllowStickyFolders);

		if (officeEditorAppDataSection && Array.isArray(officeEditorAppDataSection['ExtensionsToView'])) {
			this.OfficeEditorExtensionsToView = officeEditorAppDataSection['ExtensionsToView'];
		}

		App.registerUserAccountsCount(this.userMailAccountsCount);
		App.registerAccountsWithPass(this.mailAccountsEmails);
	},
	
	/**
	 * Updates new settings values after saving on server.
	 * 
	 * @param {number} iMailsPerPage
	 * @param {boolean} bAllowAutosaveInDrafts
	 * @param {boolean} bAllowChangeInputDirection
	 * @param {boolean} bShowMessagesCountInFolderList
	 */
	update: function (iMailsPerPage, bAllowAutosaveInDrafts, bAllowChangeInputDirection, bShowMessagesCountInFolderList)
	{
		this.AllowAutosaveInDrafts = Types.pBool(bAllowAutosaveInDrafts, this.AllowAutosaveInDrafts);
		
		this.AllowChangeInputDirection = Types.pBool(bAllowChangeInputDirection, this.AllowChangeInputDirection);
		this.MailsPerPage = Types.pPositiveInt(iMailsPerPage, this.MailsPerPage);
		this.showMessagesCountInFolderList(Types.pBool(bShowMessagesCountInFolderList, this.showMessagesCountInFolderList()));
	},
	
	updateAccountsPlace: function (bAccountsAboveFolders)
	{
		this.accountsAboveFolders(bAccountsAboveFolders);
	},

	/**
	 * Updates new admin settings values after saving on server.
	 * 
	 * @param {boolean} bAutocreateMailAccountOnNewUserFirstLogin
	 * @param {boolean} bAllowAddAccounts
	 */
	updateAdmin: function (bAutocreateMailAccountOnNewUserFirstLogin, bAllowAddAccounts)
	{
		this.AutocreateMailAccountOnNewUserFirstLogin = Types.pBool(bAutocreateMailAccountOnNewUserFirstLogin, this.AutocreateMailAccountOnNewUserFirstLogin);
		this.AllowAddAccounts = Types.pBool(bAllowAddAccounts, this.AllowAddAccounts);
	},
	
	disableEditDomainsInServer: function ()
	{
		this.AllowEditDomainsInServer = false;
	}
};
