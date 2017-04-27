'use strict';

var
	ko = require('knockout'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js')
;

module.exports = {
	ServerModuleName: 'Mail',
	HashModuleName: 'mail',
	
	AllowAddAccounts: false,
	AllowMultiAccounts: false,
	AllowAppRegisterMailto: false,
	AllowAutosaveInDrafts: true,
	AllowChangeEmailSettings: true,
	AllowChangeInputDirection: true,
	AllowExpandFolders: false,
	AllowFetchers: true,
	AllowIdentities: false,
	AllowInsertImage: true,
	AllowSpamFolder: true,
	AllowThreads: true,
	AllowFilters: false,
	AllowForward: false,
	AllowAutoresponder: false,
	AutoSaveIntervalSeconds: 60,
	ComposeToolbarOrder: ['back', 'send', 'save', 'importance', 'MailSensitivity', 'confirmation', 'OpenPgp'],
	DefaultFontName: 'Tahoma',
	DefaultFontSize: 3,
	ImageUploadSizeLimit: 0,
	IsMailsuite: false,
	JoinReplyPrefixes: true,
	MailsPerPage: 20,
	MaxMessagesBodiesSizeToPrefetch: 50000,
	SaveRepliesToCurrFolder: false,
	useThreads: ko.observable(true),
	
	userAccountsCount: ko.observable(0),
	
	init: function (oAppDataSection) {
		if (oAppDataSection)
		{
			this.AllowAddAccounts = !!oAppDataSection.AllowAddAccounts;
			this.AllowMultiAccounts = !!oAppDataSection.AllowMultiAccounts;
			this.AllowAppRegisterMailto = !!oAppDataSection.AllowAppRegisterMailto;
			this.AllowAutosaveInDrafts = !!oAppDataSection.AllowAutosaveInDrafts;
			this.AllowChangeEmailSettings = !!oAppDataSection.AllowChangeEmailSettings;
			this.AllowChangeInputDirection = !!oAppDataSection.AllowChangeInputDirection;
			this.AllowExpandFolders = !!oAppDataSection.AllowExpandFolders;
			this.AllowFetchers = !!oAppDataSection.AllowFetchers;
			this.AllowIdentities = !!oAppDataSection.AllowIdentities;
			this.AllowInsertImage = !!oAppDataSection.AllowInsertImage;
			this.AllowSpamFolder = !!oAppDataSection.AllowSpamFolder;
			this.AllowThreads = !!oAppDataSection.AllowThreads;
			this.AllowFilters = !!oAppDataSection.AllowFilters;
			this.AllowForward = !!oAppDataSection.AllowForward;
			this.AllowAutoresponder = !!oAppDataSection.AllowAutoresponder;
			this.AutoSaveIntervalSeconds = Types.pInt(oAppDataSection.AutoSaveIntervalSeconds);
			this.ComposeToolbarOrder = Types.isNonEmptyArray(oAppDataSection.ComposeToolbarOrder) ? oAppDataSection.ComposeToolbarOrder : [];
			this.DefaultFontName = Types.pString(oAppDataSection.DefaultFontName) || this.DefaultFontName;
			this.DefaultFontSize = Types.pInt(oAppDataSection.DefaultFontSize) || this.DefaultFontSize;
			this.ImageUploadSizeLimit = Types.pInt(oAppDataSection.ImageUploadSizeLimit);
			this.JoinReplyPrefixes = !!oAppDataSection.JoinReplyPrefixes;
			this.MailsPerPage = Types.pInt(oAppDataSection.MailsPerPage);
			this.MaxMessagesBodiesSizeToPrefetch = Types.pInt(oAppDataSection.MaxMessagesBodiesSizeToPrefetch);
			this.SaveRepliesToCurrFolder = !!oAppDataSection.SaveRepliesToCurrFolder;
			this.useThreads(!!oAppDataSection.UseThreads);
		}
		
		App.registerUserAccountsCount(this.userAccountsCount);
	},
	
	update: function (iMailsPerPage, bUseThreads, bAllowAutosaveInDrafts, bSaveRepliesToCurrFolder, bAllowChangeInputDirection)
	{
		this.MailsPerPage = Types.pInt(iMailsPerPage);
		this.useThreads(!!bUseThreads);
		this.AllowAutosaveInDrafts = !!bAllowAutosaveInDrafts;
		this.SaveRepliesToCurrFolder = !!bSaveRepliesToCurrFolder;
		this.AllowChangeInputDirection = !!bAllowChangeInputDirection;
	}
};
