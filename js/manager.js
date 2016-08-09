'use strict';

module.exports = function (oAppData, iUserRole, bPublic) {
	var
		bAdminUser = iUserRole === Enums.UserRole.SuperAdmin,
		bPowerUser = iUserRole === Enums.UserRole.PowerUser
	;
	
	if (bAdminUser || bPowerUser)
	{
		require('modules/%ModuleName%/js/enums.js');

		var
			_ = require('underscore'),

			App = require('%PathToCoreWebclientModule%/js/App.js'),

			Settings = require('modules/%ModuleName%/js/Settings.js'),
			oSettings = _.extend({}, oAppData[Settings.ServerModuleName] || {}, oAppData['%ModuleName%'] || {}),

			Cache = null,

			oScreens = {}
		;

		Settings.init(oSettings);

		if (bAdminUser)
		{
			return {
				start: function (ModulesManager) {
					var TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js');
					ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
						function () { return require('modules/%ModuleName%/js/views/settings/MailSettingsPaneView.js'); },
						Settings.HashModuleName,
						TextUtils.i18n('%MODULENAME%/LABEL_SETTINGS_TAB')]);
				},
				getAccountList: function () {
					return require('modules/MailWebclient/js/AccountList.js');
				}
			};
		}
		else if (bPowerUser)
		{
			Cache = require('modules/%ModuleName%/js/Cache.js');
			Cache.init();

			oScreens[Settings.HashModuleName] = function () {
				return require('modules/%ModuleName%/js/views/MailView.js');
			};
			if (App.isMobile())
			{
				oScreens[Settings.HashModuleName + '-compose'] = function () {
					var CComposeView = require('modules/%ModuleName%/js/views/CComposeView.js');
					return new CComposeView();
				};
			}

			return {
				enableModule: Settings.enableModule,
				start: function (ModulesManager) {
					var
						TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
						Browser = require('%PathToCoreWebclientModule%/js/Browser.js'),
						MailUtils = require('modules/%ModuleName%/js/utils/Mail.js')
					;

					require('modules/%ModuleName%/js/koBindings.js');
					if (!App.isMobile())
					{
						require('modules/%ModuleName%/js/koBindingSearchHighlighter.js');
					}

					if (Settings.AllowAppRegisterMailto)
					{
						MailUtils.registerMailto(Browser.firefox);
					}

					if (Settings.enableModule())
					{
						ModulesManager.run('SettingsWebclient', 'registerSettingsTab', [function () { return require('modules/%ModuleName%/js/views/settings/MailSettingsPaneView.js'); }, Settings.HashModuleName, TextUtils.i18n('%MODULENAME%/LABEL_SETTINGS_TAB')]);
						ModulesManager.run('SettingsWebclient', 'registerSettingsTab', [function () { return require('modules/%ModuleName%/js/views/settings/AccountsSettingsPaneView.js'); }, Settings.HashModuleName + '-accounts', TextUtils.i18n('%MODULENAME%/LABEL_ACCOUNTS_SETTINGS_TAB')]);
					}
				},
				getScreens: function () {
					return oScreens;
				},
				getHeaderItem: function () {
					return {
						item: require('modules/%ModuleName%/js/views/HeaderItemView.js'),
						name: Settings.HashModuleName
					};
				},
				getPrefetcher: function () {
					return require('modules/%ModuleName%/js/Prefetcher.js');
				},
				registerMessagePaneController: function (oController, sPlace) {
					var MessagePaneView = require('modules/%ModuleName%/js/views/MessagePaneView.js');
					MessagePaneView.registerController(oController, sPlace);
				},
				registerComposeToolbarController: function (oController) {
					var ComposePopup = require('modules/%ModuleName%/js/popups/ComposePopup.js');
					ComposePopup.registerToolbarController(oController);
				},
				getComposeMessageToAddresses: function () {
					var
						bAllowSendMail = true,
						ComposeUtils = (App.isMobile() || App.isNewTab()) ? require('modules/%ModuleName%/js/utils/ScreenCompose.js') : require('modules/%ModuleName%/js/utils/PopupCompose.js')
					;

					return bAllowSendMail ? ComposeUtils.composeMessageToAddresses : false;
				},
				getSearchMessagesInInbox: function () {
					return _.bind(Cache.searchMessagesInInbox, Cache);
				},
				getSearchMessagesInCurrentFolder: function () {
					return _.bind(Cache.searchMessagesInCurrentFolder, Cache);
				},
				getAllAccountsFullEmails: function () {
					var AccountList = require('modules/%ModuleName%/js/AccountList.js');
					return AccountList.getAllFullEmails();
				},
				getCreateAccountPopup: function () {
					return require('modules/%ModuleName%/js/popups/CreateAccountPopup.js');
				},
				getAccountList: function () {
					return require('modules/MailWebclient/js/AccountList.js');
				}
			};
		}
	}
	
	return null;
};
