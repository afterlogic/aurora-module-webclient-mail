'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),

	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * Inherits from CAbstractSettingsFormView that has methods for showing and hiding settings tab,
 * updating settings values on the server, checking if there was changes on the settings page.
 *
 * @constructor
 */
function CMailCustomTagsSettingsFormView()
{
	CAbstractSettingsFormView.call(this, '%ModuleName%');
	
	this.currentTags = ko.observableArray(Settings.customMailTags());
	this.currentTagsDom = ko.observable(null);
	this.currentTagsDom.subscribe(this.bindEvents, this);

	this.editTagLabel = null;
	this.tagLabel = ko.observable('');
	this.tagLabelFocused = ko.observable(false);
	this.tagColor = ko.observable('');

	this.createMode = ko.observable(true);
	this.tagPlaceholderText = ko.computed(function () {
		return this.createMode() ? TextUtils.i18n('%MODULENAME%/PLACEHOLDER_NEW_TAG') : TextUtils.i18n('%MODULENAME%/PLACEHOLDER_TAG');
	}, this);
	this.saveButtonText = ko.computed(function () {
		return this.createMode() ? TextUtils.i18n('%MODULENAME%/ACTION_ADD') : TextUtils.i18n('COREWEBCLIENT/ACTION_SAVE');
	}, this);
	this.aColors = [
		'#f09650',
		'#f68987',
		'#6fd0ce',
		'#8fbce2',
		'#b9a4f5',
		'#f68dcf',
		'#d88adc',
		'#4afdb4',
		'#9da1ff',
		'#5cc9c9',
		'#77ca71',
		'#aec9c9'
	];
}

_.extendOwn(CMailCustomTagsSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

/**
 * Name of template that will be bound to this JS-object.
 * 'MailCustomTagsSettingsFormView' - name of template file in 'templates' folder.
 */
CMailCustomTagsSettingsFormView.prototype.ViewTemplate = '%ModuleName%_Settings_MailCustomTagsSettingsFormView';

/**
 * Returns array with all settings values wich is used for indicating if there were changes on the page.
 *
 * @returns {Array} Array with all settings values;
 */
CMailCustomTagsSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.tagLabel(),
		this.tagColor()
	];
};

CMailCustomTagsSettingsFormView.prototype.setColor = function (color)
{
	this.tagColor(color);
};

CMailCustomTagsSettingsFormView.prototype.bindEvents = function ()
{
	if (this.currentTagsDom()) {
		var self = this;
		this.currentTagsDom().on('dblclick', '.custom_mail_tag span:first-child', function (event) {
			var tagToEditLabel = $(this).data('tag');
			self.editTag(tagToEditLabel);
		});
	}
};

CMailCustomTagsSettingsFormView.prototype.editTag = function (tagToEditLabel)
{
	var
		editTagData = _.find(this.currentTags(), function (tagData) {
			return tagData.label === tagToEditLabel;
		})
	;
	if (editTagData) {
		this.editTagLabel = editTagData.label;
		this.createMode(false);
		this.tagLabel(editTagData.label);
		this.tagColor(editTagData.color);
		this.updateSavedState();
		this.currentTags(_.filter(this.currentTags(), function (tagData) {
			return tagData.label !== tagToEditLabel;
		}));
	}
};

CMailCustomTagsSettingsFormView.prototype.onShow = function ()
{
	this.clear();
};

CMailCustomTagsSettingsFormView.prototype.clear = function ()
{
	var randomColorIndex = Math.floor(Math.random() * this.aColors.length);
	this.editTagLabel = null;
	this.createMode(true);
	this.tagLabel('');
	this.tagColor(this.aColors[randomColorIndex]);
	this.currentTags(Settings.customMailTags());
	this.updateSavedState();
};

CMailCustomTagsSettingsFormView.prototype.save = function ()
{
	if (this.isSaving()) {
		return;
	}

	if (this.tagLabel() === '') {
		this.tagLabelFocused(true);
		return;
	}

	if (this.createMode()) {
		this.addTag();
	} else {
		this.updateTag();
	}
};

CMailCustomTagsSettingsFormView.prototype.addTag = function ()
{
	var
		newTagData = {
			label: this.tagLabel(),
			color: this.tagColor()
		},
		parameters = {
			'Label': this.tagLabel(),
			'Color': this.tagColor()
		}
	;
	
	this.isSaving(true);
	Ajax.send('AddCustomMailTag', parameters, function (response, request) {
		this.isSaving(false);
		if (response.Result === false)
		{
			Api.showErrorByCode(response, TextUtils.i18n('COREWEBCLIENT/ERROR_SAVING_SETTINGS_FAILED'));
			this.requestCustomMailTags();
		}
		else
		{
			Settings.addCustomMailTag(newTagData);
			this.clear();
		}
	}, this);
};

CMailCustomTagsSettingsFormView.prototype.updateTag = function ()
{
	var
		newTagData = {
			label: this.tagLabel(),
			color: this.tagColor()
		},
		parameters = {
			'Label': this.editTagLabel,
			'NewLabel': this.tagLabel(),
			'NewColor': this.tagColor()
		}
	;
	
	this.isSaving(true);
	Ajax.send('UpdateCustomMailTag', parameters, function (response, request) {
		this.isSaving(false);
		if (response.Result === false)
		{
			Api.showErrorByCode(response, TextUtils.i18n('COREWEBCLIENT/ERROR_SAVING_SETTINGS_FAILED'));
			this.requestCustomMailTags();
		}
		else
		{
			Settings.updateCustomMailTag(this.editTagLabel, newTagData);
			this.clear();
		}
	}, this);
};

CMailCustomTagsSettingsFormView.prototype.askDeleteTag = function (tagToDeleteLabel)
{
	var
		confirmText = TextUtils.i18n('%MODULENAME%/CONFIRM_DELETE_CUSTOM_TAG', { 'LABEL': tagToDeleteLabel }),
		confirmCallback = function (deleteConfirmed) {
			if (deleteConfirmed) {
				this.deleteTag(tagToDeleteLabel);
			}
		}.bind(this)
	;
	
	Popups.showPopup(ConfirmPopup, [confirmText, confirmCallback]);
};

CMailCustomTagsSettingsFormView.prototype.deleteTag = function (tagToDeleteLabel)
{
	var parameters = {
		'Label': tagToDeleteLabel
	};
	
	Ajax.send('DeleteCustomMailTag', parameters, function (response, request) {
		if (response.Result === false)
		{
			Api.showErrorByCode(response, TextUtils.i18n('COREWEBCLIENT/ERROR_SAVING_SETTINGS_FAILED'));
			this.requestCustomMailTags();
		}
		else
		{
			Settings.deleteCustomMailTag(tagToDeleteLabel);
			this.clear();
		}
	}, this);
};

CMailCustomTagsSettingsFormView.prototype.requestCustomMailTags = function ()
{
	var parameters = {};
	
	Ajax.send('GetCustomMailTags', parameters, function (response, request) {
		if (_.isArray(response.Result))
		{
			Settings.updateCustomMailTags(response.Result);
			this.clear();
		}
	}, this);
};

module.exports = new CMailCustomTagsSettingsFormView();
