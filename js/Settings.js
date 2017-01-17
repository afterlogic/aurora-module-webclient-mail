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
	AllowAutosaveInDrafts: true, // ??? changes in OpenPgp
	AllowChangeEmailSettings: true,
	AllowChangeInputDirection: true,
	AllowExpandFolders: false,
	AllowFetchers: true,
	AllowIdentities: false,
	AllowInsertImage: true,
	AllowSaveMessageAsPdf: false,
	AllowThreads: true,
	AllowZipAttachments: false,
	AutoSave: true, // ??? uses in OpenPgp
	AutoSaveIntervalSeconds: 60,
	AutosignOutgoingEmails: false,
	ComposeToolbarOrder: ['back', 'send', 'save', 'importance', 'MailSensitivity', 'confirmation', 'OpenPgp'],
	DefaultFontName: 'Tahoma',
	DefaultFontSize: 3,
	ImageUploadSizeLimit: 0,
	JoinReplyPrefixes: true,
	MailsPerPage: 20,
	MaxMessagesBodiesSizeToPrefetch: 50000,
	SaveRepliesToCurrFolder: false,
	useThreads: ko.observable(true),
	
	init: function (oAppDataSection) {
		if (oAppDataSection)
		{
			this.enableModule(Types.isNonEmptyArray(oAppDataSection.Accounts));
			this.AllowAddNewAccounts = !!oAppDataSection.AllowUsersAddNewAccounts;
			this.AllowAppRegisterMailto = !!oAppDataSection.AllowAppRegisterMailto;
			this.AllowAutosaveInDrafts = !!oAppDataSection.AllowAutosaveInDrafts; // ??? changes in OpenPgp
			this.AllowChangeEmailSettings = !!oAppDataSection.AllowUsersChangeEmailSettings;
			this.AllowChangeInputDirection = !!oAppDataSection.AllowChangeInputDirection;
			this.AllowExpandFolders = !!oAppDataSection.MailExpandFolders;
			this.AllowFetchers = !!oAppDataSection.AllowFetcher;
			this.AllowIdentities = !!oAppDataSection.AllowIdentities;
			this.AllowInsertImage = !!oAppDataSection.AllowInsertImage;
			this.AllowSaveMessageAsPdf = !!oAppDataSection.AllowSaveAsPdf;
			this.AllowThreads = !!oAppDataSection.ThreadsEnabled;
			this.AllowZipAttachments = !!oAppDataSection.ZipAttachments;
			this.AutoSave = !!oAppDataSection.AutoSave; // ??? uses in OpenPgp
			this.AutoSaveIntervalSeconds = oAppDataSection.AutoSaveIntervalSeconds;
			this.AutosignOutgoingEmails = !!oAppDataSection.AutosignOutgoingEmails;
			this.ComposeToolbarOrder = Types.isNonEmptyArray(oAppDataSection.ComposeToolbarOrder) ? oAppDataSection.ComposeToolbarOrder : [];
			this.DefaultFontName = Types.pString(oAppDataSection.DefaultFontName) || this.DefaultFontName;
			this.DefaultFontSize = Types.pInt(oAppDataSection.DefaultFontSize) || this.DefaultFontSize;
			this.ImageUploadSizeLimit = Types.pInt(oAppDataSection.ImageUploadSizeLimit);
			this.JoinReplyPrefixes = !!oAppDataSection.JoinReplyPrefixes;
			this.MailsPerPage = Types.pInt(oAppDataSection.MailsPerPage);
			this.MaxMessagesBodiesSizeToPrefetch = oAppDataSection.AutoSaveIntervalSeconds;
			this.SaveRepliesToCurrFolder = !!oAppDataSection.SaveRepliesToCurrFolder;
			this.useThreads(!!oAppDataSection.UseThreads);
		}
	}
};