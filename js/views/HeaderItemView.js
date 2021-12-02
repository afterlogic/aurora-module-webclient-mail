'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CAbstractHeaderItemView = require('%PathToCoreWebclientModule%/js/views/CHeaderItemView.js'),
			
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Cache = require('modules/%ModuleName%/js/Cache.js')
;

function CHeaderItemView()
{
	CAbstractHeaderItemView.call(this, TextUtils.i18n('%MODULENAME%/ACTION_SHOW_MAIL'));
	
	this.unseenCount = Cache.newMessagesCount;
	
	this.inactiveTitle = ko.computed(function () {
		return TextUtils.i18n('%MODULENAME%/HEADING_UNREAD_MESSAGES_BROWSER_TAB_PLURAL', {'COUNT': this.unseenCount()}, null, this.unseenCount()) + ' - ' + AccountList.getEmail();
	}, this);
	
	this.accounts = ko.computed(function () {
		if (Settings.accountsAboveFolders()) {
			// Do not show dropdown
			return [];
		}
		return _.map(AccountList.collection(), function (oAccount) {
			return {
				bCurrent: oAccount.isCurrent(),
				sText: oAccount.mailboxName() || oAccount.email().split('@')[0],
				changeAccount: oAccount.changeAccount.bind(oAccount)
			};
		});
	}, this);
	
	this.linkText = ko.computed(function () {
		if (!Settings.accountsAboveFolders() && Settings.ShowEmailAsTabName)
		{
			var oCurrent = _.find(this.accounts(), function (oAccountData) {
				return oAccountData.bCurrent;
			});
			return oCurrent ? oCurrent.sText : TextUtils.i18n('%MODULENAME%/HEADING_BROWSER_TAB');
		}
		return TextUtils.i18n('%MODULENAME%/ACTION_SHOW_MAIL');
	}, this);
	
	this.mainHref = ko.computed(function () {
		if (this.isCurrent())
		{
			return 'javascript: void(0);';
		}
		return this.hash();
	}, this);
}

_.extendOwn(CHeaderItemView.prototype, CAbstractHeaderItemView.prototype);

CHeaderItemView.prototype.ViewTemplate = '%ModuleName%_HeaderItemView';

var HeaderItemView = new CHeaderItemView();

HeaderItemView.allowChangeTitle(true);

module.exports = HeaderItemView;
