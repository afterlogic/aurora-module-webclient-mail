'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CServerPropertiesView = require('modules/%ModuleName%/js/views/CServerPropertiesView.js')
;

/**
 * @constructor
 */
function CServersAdminSettingsPaneView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);

	this.visible = ko.observable(true);
	
	this.servers = ko.observableArray([]);
	this.createMode = ko.observable(false);
	this.editedServerId = ko.observable(0);
	this.name = ko.observable();
	this.oIncoming = new CServerPropertiesView(143, 993, 'server_edit_incoming', TextUtils.i18n('%MODULENAME%/LABEL_IMAP_SERVER'));
	this.oOutgoing = new CServerPropertiesView(25, 465, 'server_edit_outgoing', TextUtils.i18n('%MODULENAME%/LABEL_SMTP_SERVER'), this.oIncoming.server);
	this.useSmtpAuthentication = ko.observable(false);
}

_.extendOwn(CServersAdminSettingsPaneView.prototype, CAbstractSettingsFormView.prototype);

CServersAdminSettingsPaneView.prototype.ViewTemplate = '%ModuleName%_Settings_ServersAdminSettingsPaneView';

CServersAdminSettingsPaneView.prototype.addServer = function ()
{
	ModulesManager.run('AdminPanelWebclient', 'setAddHash', [['create']]);
};

CServersAdminSettingsPaneView.prototype.editServer = function (iId)
{
	ModulesManager.run('AdminPanelWebclient', 'setAddHash', [[iId]]);
};

CServersAdminSettingsPaneView.prototype.onRouteChild = function (aParams)
{
	var
		bCreate = Types.isNonEmptyArray(aParams) && aParams[0] === 'create',
		iEditServerId = !bCreate && Types.isNonEmptyArray(aParams) ? Types.pInt(aParams[0]) : 0
	;
	
	this.createMode(bCreate);
	this.editedServerId(iEditServerId);
	console.log('this.createMode', this.createMode());
};

CServersAdminSettingsPaneView.prototype.create = function ()
{
};

CServersAdminSettingsPaneView.prototype.getCurrentValues = function ()
{
	return [
		this.editedServerId(),
		this.name(),
		this.oIncoming.port(),
		this.oIncoming.server(),
		this.oIncoming.ssl(),
		this.oOutgoing.port(),
		this.oOutgoing.server(),
		this.oOutgoing.ssl(),
		this.useSmtpAuthentication()
	];
};

CServersAdminSettingsPaneView.prototype.revertGlobalValues = function ()
{
};

CServersAdminSettingsPaneView.prototype.getParametersForSave = function ()
{
	return {
		'ServerId': this.editedServerId(),
		'Name': this.name(),
		'IncomingMailServer': this.oIncoming.server(),
		'IncomingMailPort': this.oIncoming.port(),
		'IncomingMailUseSSL': this.oIncoming.ssl(),
		'OutgoingMailServer': this.oOutgoing.server(),
		'OutgoingMailPort': this.oOutgoing.port(),
		'OutgoingMailUseSSL': this.oOutgoing.ssl(),
		'OutgoingMailAuth': this.useSmtpAuthentication()
	};
};

CServersAdminSettingsPaneView.prototype.applySavedValues = function (oParameters)
{
};

CServersAdminSettingsPaneView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === '');
};

module.exports = new CServersAdminSettingsPaneView();
