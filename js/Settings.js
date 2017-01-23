'use strict';

var
	ko = require('knockout'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	ServerModuleName: 'Mail',
	HashModuleName: 'mail',
	enableModule: ko.observable(true),
	
	AllowAddNewAccounts: false,
	AllowAppRegisterMailto: false,
	AllowAutosaveInDrafts: true,
	AllowChangeEmailSettings: true,
	AllowChangeInputDirection: true,
	AllowExpandFolders: false,
	AllowFetchers: true,
	AllowIdentities: false,
	AllowInsertImage: true,
	AllowSaveMessageAsPdf: false,
	AllowThreads: true,
	AllowZipAttachments: false,
	AutoSave: true,
	AutoSaveIntervalSeconds: 60,
	AutosignOutgoingEmails: false,
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
	
	init: function (oAppDataSection) {
		if (oAppDataSection)
		{
			this.enableModule(Types.isNonEmptyArray(oAppDataSection.Accounts));
			this.AllowAddNewAccounts = !!oAppDataSection.AllowAddNewAccounts;
			this.AllowAppRegisterMailto = !!oAppDataSection.AllowAppRegisterMailto;
			this.AllowAutosaveInDrafts = !!oAppDataSection.AllowAutosaveInDrafts;
			this.AllowChangeEmailSettings = !!oAppDataSection.AllowChangeEmailSettings;
			this.AllowChangeInputDirection = !!oAppDataSection.AllowChangeInputDirection;
			this.AllowExpandFolders = !!oAppDataSection.AllowExpandFolders;
			this.AllowFetchers = !!oAppDataSection.AllowFetchers;
			this.AllowIdentities = !!oAppDataSection.AllowIdentities;
			this.AllowInsertImage = !!oAppDataSection.AllowInsertImage;
			this.AllowSaveMessageAsPdf = !!oAppDataSection.AllowSaveMessageAsPdf;
			this.AllowThreads = !!oAppDataSection.AllowThreads;
			this.AllowZipAttachments = !!oAppDataSection.AllowZipAttachments;
			this.AutoSave = !!oAppDataSection.AutoSave;
			this.AutoSaveIntervalSeconds = Types.pInt(oAppDataSection.AutoSaveIntervalSeconds);
			this.AutosignOutgoingEmails = !!oAppDataSection.AutosignOutgoingEmails;
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
	}
};
