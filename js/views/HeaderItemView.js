'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	
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
	
	this.accounts = AccountList.collection;
	
	this.linkText = ko.computed(function () {
		var sEmail = AccountList.getEmail();
		return sEmail.length > 0 ? sEmail : TextUtils.i18n('%MODULENAME%/HEADING_BROWSER_TAB');
	});
	
	this.mainHref = ko.computed(function () {
		if (this.isCurrent())
		{
			return 'javascript: void(0);';
		}
		return this.hash();
	}, this);
}

_.extendOwn(CHeaderItemView.prototype, CAbstractHeaderItemView.prototype);

CHeaderItemView.prototype.ViewTemplate = App.isMobile() ? '%ModuleName%_HeaderItemMobileView' : '%ModuleName%_HeaderItemView';

var HeaderItemView = new CHeaderItemView();

HeaderItemView.allowChangeTitle(true);

module.exports = HeaderItemView;
