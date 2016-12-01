'use strict';

module.exports = function (oAppData) {
	require('modules/%ModuleName%/js/enums.js');

	var
		_ = require('underscore'),

		App = require('%PathToCoreWebclientModule%/js/App.js'),

		Settings = require('modules/%ModuleName%/js/Settings.js'),
		oSettings = _.extend({}, oAppData[Settings.ServerModuleName] || {}, oAppData['%ModuleName%'] || {}),

		bAdminUser = App.getUserRole() === Enums.UserRole.SuperAdmin,
		bNormalUser = App.getUserRole() === Enums.UserRole.NormalUser,

		Cache = null,
		ComposeView = null,

		oScreens = {}
	;

	Settings.init(oSettings);

	if (App.isNewTab() && bNormalUser)
	{
		var GetComposeView = function() {
			if (ComposeView === null)
			{
				var CComposeView = require('modules/%ModuleName%/js/views/CComposeView.js');
				ComposeView = new CComposeView();
			}
			return ComposeView;
		};
		
		Cache = require('modules/%ModuleName%/js/Cache.js');
		Cache.init();
		
		return {
			start: function () {
				require('modules/%ModuleName%/js/koBindings.js');
			},
			getScreens: function () {
				var oScreens = {};
				oScreens[Settings.HashModuleName + '-view'] = function () {
					return require('modules/%ModuleName%/js/views/MessagePaneView.js');
				};
				oScreens[Settings.HashModuleName + '-compose'] = function () {
					return GetComposeView();
				};
				return oScreens;
			},
			registerMessagePaneController: function (oController, sPlace) {
				var MessagePaneView = require('modules/%ModuleName%/js/views/MessagePaneView.js');
				MessagePaneView.registerController(oController, sPlace);
			},
			registerComposeToolbarController: function (oController) {
				var ComposeView = GetComposeView();
				ComposeView.registerToolbarController(oController);
			},
			getComposeMessageToAddresses: function () {
				var
					bAllowSendMail = true,
					ComposeUtils = require('modules/%ModuleName%/js/utils/ScreenCompose.js')
				;

				return bAllowSendMail ? ComposeUtils.composeMessageToAddresses : false;
			},
			getSearchMessagesInCurrentFolder: function () {
				var MainTab = window.opener && window.opener.MainTabMailMethods;
				return MainTab ? _.bind(MainTab.searchMessagesInCurrentFolder, MainTab) : false;
			}
		};
	}
	else if (bAdminUser)
	{
		return {
			start: function (ModulesManager) {
				var TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js');
				ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
					function(resolve) {
						require.ensure(
							['modules/%ModuleName%/js/views/settings/MailSettingsPaneView.js'],
							function() {
								resolve(require('modules/%ModuleName%/js/views/settings/MailSettingsPaneView.js'));
							},
							"admin-bundle"
						);
					},
					Settings.HashModuleName,
					TextUtils.i18n('%MODULENAME%/LABEL_SETTINGS_TAB')]);
			},
			getAccountList: function () {
				return require('modules/MailWebclient/js/AccountList.js');
			}
		};
	}
	else if (bNormalUser)
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
	
	return null;
};
