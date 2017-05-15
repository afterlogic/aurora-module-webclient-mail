'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	CreateAccountPopup = require('modules/%ModuleName%/js/popups/CreateAccountPopup.js'),
	CreateIdentityPopup = require('modules/%ModuleName%/js/popups/CreateIdentityPopup.js'),
	CreateFetcherPopup = require('modules/%ModuleName%/js/popups/CreateFetcherPopup.js'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	AccountAutoresponderPaneView = require('modules/%ModuleName%/js/views/settings/AccountAutoresponderPaneView.js'),
	AccountFiltersPaneView = require('modules/%ModuleName%/js/views/settings/AccountFiltersPaneView.js'),
	AccountFoldersPaneView = require('modules/%ModuleName%/js/views/settings/AccountFoldersPaneView.js'),
	AccountForwardPaneView = require('modules/%ModuleName%/js/views/settings/AccountForwardPaneView.js'),
	AccountPropertiesPaneView = require('modules/%ModuleName%/js/views/settings/AccountPropertiesPaneView.js'),
	CIdentityPropertiesPaneView = require('modules/%ModuleName%/js/views/settings/CIdentityPropertiesPaneView.js'),
	FetcherIncomingPaneView = require('modules/%ModuleName%/js/views/settings/FetcherIncomingPaneView.js'),
	FetcherOutgoingPaneView = require('modules/%ModuleName%/js/views/settings/FetcherOutgoingPaneView.js'),
	SignaturePaneView = require('modules/%ModuleName%/js/views/settings/SignaturePaneView.js')
;

/**
 * @constructor
 */
function CAccountsSettingsPaneView()
{
	this.bAllowAddAccounts = Settings.AllowAddAccounts;
	this.bAllowMultiAccounts = Settings.AllowMultiAccounts;
	this.bAllowIdentities = !!Settings.AllowIdentities;
	this.bAllowFetchers = !!Settings.AllowFetchers;
	
	this.accounts = AccountList.collection;
	
	this.editedAccountId = AccountList.editedId;
	this.editedFetcher = ko.observable(null);
	this.editedFetcherId = ko.computed(function () {
		return this.editedFetcher() ? this.editedFetcher().id() : null;
	}, this);
	this.editedIdentity = ko.observable(null);
	this.editedIdentityId = ko.computed(function () {
		return this.editedIdentity() ? this.editedIdentity().id() : null;
	}, this);
	
	this.allowProperties = ko.observable(false);
	this.allowFolders = ko.observable(false);
	this.allowForward = ko.observable(false);
	this.allowAutoresponder = ko.observable(false);
	this.allowFilters = ko.observable(false);
	this.allowSignature = ko.observable(false);
	
	this.aAccountTabs = [
		{
			name: 'properties',
			title: TextUtils.i18n('%MODULENAME%/LABEL_PROPERTIES_TAB'),
			view: AccountPropertiesPaneView,
			visible: this.allowProperties
		},
		{
			name: 'folders',
			title: TextUtils.i18n('%MODULENAME%/LABEL_MANAGE_FOLDERS_TAB'),
			view: AccountFoldersPaneView,
			visible: this.allowFolders
		},
		{
			name: 'forward',
			title: TextUtils.i18n('%MODULENAME%/LABEL_FORWARD_TAB'),
			view: AccountForwardPaneView,
			visible: this.allowForward
		},
		{
			name: 'autoresponder',
			title: TextUtils.i18n('%MODULENAME%/LABEL_AUTORESPONDER_TAB'),
			view: AccountAutoresponderPaneView,
			visible: this.allowAutoresponder
		},
		{
			name: 'filters',
			title: TextUtils.i18n('%MODULENAME%/LABEL_FILTERS_TAB'),
			view: AccountFiltersPaneView,
			visible: this.allowFilters
		},
		{
			name: 'signature',
			title: TextUtils.i18n('%MODULENAME%/LABEL_SIGNATURE_TAB'),
			view: SignaturePaneView,
			visible: this.allowSignature
		}
	];
	
	this.aIdentityTabs = [
		{
			name: 'properties',
			title: TextUtils.i18n('%MODULENAME%/LABEL_PROPERTIES_TAB'),
			view: new CIdentityPropertiesPaneView(this),
			visible: ko.observable(true)
		},
		{
			name: 'signature',
			title: TextUtils.i18n('%MODULENAME%/LABEL_SIGNATURE_TAB'),
			view: SignaturePaneView,
			visible: ko.observable(true)
		}
	];
	
	this.aFetcherTabs = [
		{
			name: 'incoming',
			title: TextUtils.i18n('%MODULENAME%/LABEL_POP3_SETTINGS_TAB'),
			view: FetcherIncomingPaneView,
			visible: ko.observable(true)
		},
		{
			name: 'outgoing',
			title: TextUtils.i18n('%MODULENAME%/LABEL_SMTP_SETTINGS_TAB'),
			view: FetcherOutgoingPaneView,
			visible: ko.observable(true)
		},
		{
			name: 'signature',
			title: TextUtils.i18n('%MODULENAME%/LABEL_SIGNATURE_TAB'),
			view: SignaturePaneView,
			visible: ko.observable(true)
		}
	];
	
	this.currentTab = ko.observable(null);
	this.tabs = ko.computed(function () {
		if (this.editedIdentity())
		{
			return this.aIdentityTabs;
		}
		if (this.editedFetcher())
		{
			return this.aFetcherTabs;
		}
		return this.aAccountTabs;
	}, this);
	
	AccountList.editedId.subscribe(function () {
		this.populate();
	}, this);
}

CAccountsSettingsPaneView.prototype.ViewTemplate = '%ModuleName%_Settings_AccountsSettingsPaneView';

/**
 * @param {Function} fAfterHideHandler
 * @param {Function} fRevertRouting
 */
CAccountsSettingsPaneView.prototype.hide = function (fAfterHideHandler, fRevertRouting)
{
	if (this.currentTab() && $.isFunction(this.currentTab().view.hide))
	{
		this.currentTab().view.hide(fAfterHideHandler, fRevertRouting);
	}
	else
	{
		fAfterHideHandler();
	}
};

/**
 * @param {Array} aParams
 */
CAccountsSettingsPaneView.prototype.onRoute = function (aParams)
{
	var
		sType = aParams.length > 0 ? aParams[0] : 'account',
		oEditedAccount = AccountList.getEdited(),
		sHash = aParams.length > 1 ? aParams[1] : (oEditedAccount ? oEditedAccount.hash() : ''),
		sTab = aParams.length > 2 ? aParams[2] : ''
	;
	
	this.editedIdentity(sType === 'identity' ? (AccountList.getIdentityByHash(sHash) || null) : null);
	this.editedFetcher(sType === 'fetcher' ? (AccountList.getFetcherByHash(sHash) || null) : null);
	
	if (sType === 'account')
	{
		if (aParams[1] === 'create' && !AccountList.hasAccount())
		{
			this.addAccount();
			Screens.showError(TextUtils.i18n('%MODULENAME%/INFO_SPECIFY_CREDENTIALS'));
			Routing.replaceHashDirectly(['settings', 'mail-accounts']);
		}
		else if (sHash !== '')
		{
			if (oEditedAccount && oEditedAccount.hash() === sHash)
			{
				this.populate();
			}
			else
			{
				if (_.find(AccountList.collection(), function (oAccount) {
					return oAccount.hash() === sHash;
				}))
				{
					AccountList.changeEditedAccountByHash(sHash);
				}
				else
				{
					Routing.replaceHash(['settings', 'mail-accounts']);
				}
			}
		}
	}
	
	this.changeTab(sTab || this.getAutoselectedTab().name);
};

CAccountsSettingsPaneView.prototype.getAutoselectedTab = function ()
{
	var oCurrentTab = _.find(this.tabs(), function (oTab) {
		return oTab.visible();
	});
	
	if (!oCurrentTab)
	{
		oCurrentTab = this.tabs()[0];
	}
	
	return oCurrentTab;
};

CAccountsSettingsPaneView.prototype.addAccount = function ()
{
	Popups.showPopup(CreateAccountPopup, [_.bind(function (iAccountId) {
		var oAccount = AccountList.getAccount(iAccountId);
		if (oAccount)
		{
			this.editAccount(oAccount.hash());
		}
	}, this)]);
};

/**
 * @param {string} sHash
 */
CAccountsSettingsPaneView.prototype.editAccount = function (sHash)
{
	ModulesManager.run('SettingsWebclient', 'setAddHash', [['account', sHash]]);
};

/**
 * @param {number} iAccountId
 * @param {Object} oEv
 */
CAccountsSettingsPaneView.prototype.addIdentity = function (iAccountId, oEv)
{
	oEv.stopPropagation();
	Popups.showPopup(CreateIdentityPopup, [iAccountId]);
};

/**
 * @param {string} sHash
 */
CAccountsSettingsPaneView.prototype.editIdentity = function (sHash)
{
	ModulesManager.run('SettingsWebclient', 'setAddHash', [['identity', sHash]]);
};

/**
 * @param {number} iAccountId
 * @param {Object} oEv
 */
CAccountsSettingsPaneView.prototype.addFetcher = function (iAccountId, oEv)
{
	oEv.stopPropagation();
	Popups.showPopup(CreateFetcherPopup, [iAccountId]);
};

/**
 * @param {string} sHash
 */
CAccountsSettingsPaneView.prototype.editFetcher = function (sHash)
{
	ModulesManager.run('SettingsWebclient', 'setAddHash', [['fetcher', sHash]]);
};

/**
 * @param {string} sTabName
 */
CAccountsSettingsPaneView.prototype.changeRoute = function (sTabName)
{
	var
		oEditedAccount = AccountList.getEdited(),
		aAddHash = ['account', oEditedAccount ? oEditedAccount.hash() : '', sTabName]
	;
	if (this.editedIdentity())
	{
		aAddHash = ['identity', this.editedIdentity().hash(), sTabName];
	}
	else if (this.editedFetcher())
	{
		aAddHash = ['fetcher', this.editedFetcher().hash(), sTabName];
	}
	ModulesManager.run('SettingsWebclient', 'setAddHash', [aAddHash]);
};

/**
 * @param {string} sName
 */
CAccountsSettingsPaneView.prototype.changeTab = function (sName)
{
	var
		oCurrentTab = this.currentTab(),
		oNewTab = _.find(this.tabs(), function (oTab) {
			return oTab.visible() && oTab.name === sName;
		}),
		fShowNewTab = function () {
			if (oNewTab)
			{
				if ($.isFunction(oNewTab.view.show))
				{
					oNewTab.view.show(this.editedIdentity() || this.editedFetcher());
				}
				this.currentTab(oNewTab);
			}
		}.bind(this),
		bShow = true
	;
	
	if (oNewTab)
	{
		if (oCurrentTab && $.isFunction(oCurrentTab.view.hide))
		{
			oCurrentTab.view.hide(fShowNewTab);
			bShow = false;
		}
	}
	else if (!oCurrentTab)
	{
		oNewTab = this.getAutoselectedTab();
	}
	
	if (bShow)
	{
		fShowNewTab();
	}
};

CAccountsSettingsPaneView.prototype.populate = function ()
{
	var
		oAccount = AccountList.getEdited(),
		bCanBeRemoved = !!oAccount && oAccount.canBeRemoved()
	;
	
	if (oAccount)
	{
		this.allowProperties(Settings.AllowUsersChangeEmailSettings || !Settings.AllowIdentities || bCanBeRemoved);
		this.allowFolders(true);
		this.allowForward(!!Settings.AllowForward && oAccount.oServer.bEnableSieve);
		this.allowAutoresponder(!!Settings.AllowAutoresponder && oAccount.oServer.bEnableSieve);
		this.allowFilters(!!Settings.AllowFilters && oAccount.oServer.bEnableSieve);
		this.allowSignature(!Settings.AllowIdentities);
		
		if (!this.currentTab() || !this.currentTab().visible())
		{
			this.currentTab(this.getAutoselectedTab());
		}
	}
};

CAccountsSettingsPaneView.prototype.onRemoveIdentity = function ()
{
	this.editedIdentity(null);
	this.changeTab(this.currentTab() ? this.currentTab().name : '');
};

module.exports = new CAccountsSettingsPaneView();
