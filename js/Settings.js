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
	
	// from Mail module
	AllowAddAccounts: false,
	AllowAutoresponder: false,
	AllowAutosaveInDrafts: true,
	AllowChangeEmailSettings: true,
	AllowFetchers: true,
	AllowFilters: false,
	AllowForward: false,
	AllowIdentities: false,
	AllowInsertImage: true,
	AllowMultiAccounts: false,
	AutoSaveIntervalSeconds: 60,
	ImageUploadSizeLimit: 0,
	
	// from MailWebclient module
	AllowAppRegisterMailto: false,
	AllowChangeInputDirection: true,
	AllowExpandFolders: false,
	AllowSpamFolder: true,
	AllowAddNewFolderOnMainScreen: false,
	ComposeToolbarOrder: ['back', 'send', 'save', 'importance', 'MailSensitivity', 'confirmation', 'OpenPgp'],
	DefaultFontName: 'Tahoma',
	DefaultFontSize: 3,
	JoinReplyPrefixes: true,
	MailsPerPage: 20,
	MaxMessagesBodiesSizeToPrefetch: 50000,
	SaveRepliesToCurrFolder: false,
	ShowEmailAsTabName: true,
	
	userMailAccountsCount: ko.observable(0),
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var
			oAppDataMailSection = oAppData[this.ServerModuleName],
			oAppDataMailWebclientSection = oAppData['%ModuleName%']
		;
		
		if (!_.isEmpty(oAppDataMailSection))
		{
			this.AllowAddAccounts = Types.pBool(oAppDataMailSection.AllowAddAccounts, this.AllowAddAccounts);
			this.AllowAutoresponder = Types.pBool(oAppDataMailSection.AllowAutoresponder, this.AllowAutoresponder);
			this.AllowAutosaveInDrafts = Types.pBool(oAppDataMailSection.AllowAutosaveInDrafts, this.AllowAutosaveInDrafts);
			this.AllowChangeEmailSettings = Types.pBool(oAppDataMailSection.AllowChangeEmailSettings, this.AllowChangeEmailSettings);
			this.AllowFetchers = Types.pBool(oAppDataMailSection.AllowFetchers, this.AllowFetchers);
			this.AllowFilters = Types.pBool(oAppDataMailSection.AllowFilters, this.AllowFilters);
			this.AllowForward = Types.pBool(oAppDataMailSection.AllowForward, this.AllowForward);
			this.AllowIdentities = Types.pBool(oAppDataMailSection.AllowIdentities, this.AllowIdentities);
			this.AllowInsertImage = Types.pBool(oAppDataMailSection.AllowInsertImage, this.AllowInsertImage);
			this.AllowMultiAccounts = Types.pBool(oAppDataMailSection.AllowMultiAccounts, this.AllowMultiAccounts);
			this.AutoSaveIntervalSeconds = Types.pNonNegativeInt(oAppDataMailSection.AutoSaveIntervalSeconds, this.AutoSaveIntervalSeconds);
			this.ImageUploadSizeLimit = Types.pNonNegativeInt(oAppDataMailSection.ImageUploadSizeLimit, this.ImageUploadSizeLimit);
			window.Enums.SmtpAuthType = Types.pObject(oAppDataMailSection.SmtpAuthType);
		}
			
		if (!_.isEmpty(oAppDataMailWebclientSection))
		{
			this.AllowAppRegisterMailto = Types.pBool(oAppDataMailWebclientSection.AllowAppRegisterMailto, this.AllowAppRegisterMailto);
			this.AllowChangeInputDirection = Types.pBool(oAppDataMailWebclientSection.AllowChangeInputDirection, this.AllowChangeInputDirection);
			this.AllowExpandFolders = Types.pBool(oAppDataMailWebclientSection.AllowExpandFolders, this.AllowExpandFolders);
			this.AllowSpamFolder = Types.pBool(oAppDataMailWebclientSection.AllowSpamFolder, this.AllowSpamFolder);
			this.AllowAddNewFolderOnMainScreen = Types.pBool(oAppDataMailWebclientSection.AllowAddNewFolderOnMainScreen, this.AllowAddNewFolderOnMainScreen);
			this.ComposeToolbarOrder = Types.pArray(oAppDataMailWebclientSection.ComposeToolbarOrder, this.ComposeToolbarOrder);
			this.DefaultFontName = Types.pString(oAppDataMailWebclientSection.DefaultFontName, this.DefaultFontName);
			this.DefaultFontSize = Types.pPositiveInt(oAppDataMailWebclientSection.DefaultFontSize, this.DefaultFontSize);
			this.JoinReplyPrefixes = Types.pBool(oAppDataMailWebclientSection.JoinReplyPrefixes, this.JoinReplyPrefixes);
			this.MailsPerPage = Types.pPositiveInt(oAppDataMailWebclientSection.MailsPerPage, this.MailsPerPage);
			this.MaxMessagesBodiesSizeToPrefetch = Types.pNonNegativeInt(oAppDataMailWebclientSection.MaxMessagesBodiesSizeToPrefetch, this.MaxMessagesBodiesSizeToPrefetch);
			this.SaveRepliesToCurrFolder = Types.pBool(oAppDataMailWebclientSection.SaveRepliesToCurrFolder, this.SaveRepliesToCurrFolder);
			this.ShowEmailAsTabName = Types.pBool(oAppDataMailWebclientSection.ShowEmailAsTabName, this.ShowEmailAsTabName);
		}
		
		App.registerUserAccountsCount(this.userMailAccountsCount);
	},
	
	/**
	 * Updates new settings values after saving on server.
	 * 
	 * @param {number} iMailsPerPage
	 * @param {boolean} bAllowAutosaveInDrafts
	 * @param {boolean} bSaveRepliesToCurrFolder
	 * @param {boolean} bAllowChangeInputDirection
	 */
	update: function (iMailsPerPage, bAllowAutosaveInDrafts, bSaveRepliesToCurrFolder, bAllowChangeInputDirection)
	{
		this.AllowAutosaveInDrafts = Types.pBool(bAllowAutosaveInDrafts, this.AllowAutosaveInDrafts);
		
		this.AllowChangeInputDirection = Types.pBool(bAllowChangeInputDirection, this.AllowChangeInputDirection);
		this.MailsPerPage = Types.pPositiveInt(iMailsPerPage, this.MailsPerPage);
		this.SaveRepliesToCurrFolder = Types.pBool(bSaveRepliesToCurrFolder, this.SaveRepliesToCurrFolder);
	}
};
