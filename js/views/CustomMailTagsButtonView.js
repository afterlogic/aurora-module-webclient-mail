'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	Api = require('%PathToCoreWebclientModule%/js/Api.js'),

	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	MailCache = require('modules/%ModuleName%/js/Cache.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

function CCustomMailTagsButtonView()
{
	this.customMailTags = ko.computed(function () {
		return _.map(Settings.customMailTags(), function (tagData) {
			var
				currentMessage = MailCache.currentMessage(),
				hasTag = currentMessage ? _.indexOf(currentMessage.allFlags(), tagData.label) !== -1 : false
			;
			return {
				label: tagData.label,
				color: tagData.color,
				checked: ko.observable(hasTag)
			};
		});
	}, this);
}

CCustomMailTagsButtonView.prototype.ViewTemplate = '%ModuleName%_Message_CustomMailTagsButtonView';

CCustomMailTagsButtonView.prototype.setCustomMailFlag = function (label)
{
	var
		tagData = _.find(this.customMailTags(), function (tagData) {
			return tagData.label === label;
		}),
		currentMessage = MailCache.currentMessage()
	;
	if (tagData && currentMessage) {
		var parameters = {
			'AccountID': currentMessage.accountId(),
			'Folder': currentMessage.folder(),
			'Uids': currentMessage.uid(),
			'Tag': label,
			'SetAction': tagData.checked() ? false : true
		};
		Ajax.send('SetCustomMailTagToMessage', parameters, function (response) {
			if (response.Result === false) {
				Api.showErrorByCode(response, TextUtils.i18n('%MODULENAME%/ERROR_SET_CUSTOM_MAIL_FLAG'));
			} else {
				currentMessage.updateFlag(label, !tagData.checked());
			}
		});
	}
};

module.exports = new CCustomMailTagsButtonView();
