'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	
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
	
	this.received = ko.observable(false);
	this.servers = ko.observableArray([]);
	this.createMode = ko.observable(false);
	this.editedServerId = ko.observable(0);
	this.name = ko.observable('');
	this.name.focused = ko.observable(false);
	this.oIncoming = new CServerPropertiesView(143, 993, 'server_edit_incoming', TextUtils.i18n('%MODULENAME%/LABEL_IMAP_SERVER'), this.name);
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

CServersAdminSettingsPaneView.prototype.cancel = function ()
{
	ModulesManager.run('AdminPanelWebclient', 'setAddHash', [[]]);
};

CServersAdminSettingsPaneView.prototype.onRouteChild = function (aParams)
{
	var
		bCreate = Types.isNonEmptyArray(aParams) && aParams[0] === 'create',
		iEditServerId = !bCreate && Types.isNonEmptyArray(aParams) ? Types.pInt(aParams[0]) : 0
	;
	
	this.createMode(bCreate);
	this.editedServerId(iEditServerId);
	
	if (!this.received())
	{
		this.requestServers();
	}
	
	this.revertGlobalValues();
};

CServersAdminSettingsPaneView.prototype.requestServers = function ()
{
	Ajax.send('GetServers', {}, function (oResponse) {
		if (_.isArray(oResponse.Result))
		{
			this.servers(oResponse.Result);
			var oEditedServer = _.find(this.servers(), _.bind(function (oServer) {
				return oServer.iObjectId === this.editedServerId();
			}, this));
			if (!oEditedServer)
			{
				this.cancel();
			}
			if (!this.received())
			{
				this.revertGlobalValues();
			}
			this.received(true);
		}
	}, this);
};

CServersAdminSettingsPaneView.prototype.deleteServer = function (iId)
{
	var
		fCallBack = _.bind(function (bDelete) {
			if (bDelete)
			{
				Ajax.send('DeleteServer', { 'ServerId': iId }, function (oResponse) {
					this.requestServers();
				}, this);
			}
		}, this),
		oServerToDelete = _.find(this.servers(), _.bind(function (oServer) {
			return oServer.iObjectId === iId;
		}, this))
	;
	if (oServerToDelete)
	{
		Popups.showPopup(ConfirmPopup, [TextUtils.i18n('%MODULENAME%/CONFIRM_REMOVE_SERVER'), fCallBack, oServerToDelete.Name]);
	}
};

CServersAdminSettingsPaneView.prototype.save = function ()
{
	var
		sMethod = this.createMode() ? 'CreateServer' : 'UpdateServer'
	;
	this.isSaving(true);
	Ajax.send(sMethod, this.getParametersForSave(), function (oResponse) {
		this.isSaving(false);
		this.requestServers();
		if (this.createMode())
		{
			this.cancel();
		}
	}, this);
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
	var oEditedServer = _.find(this.servers(), _.bind(function (oServer) {
		return oServer.iObjectId === this.editedServerId();
	}, this));
	
	if (oEditedServer)
	{
		this.name(oEditedServer.Name);
		this.oIncoming.port(oEditedServer.IncomingMailPort);
		this.oIncoming.server(oEditedServer.IncomingMailServer);
		this.oIncoming.ssl(!!oEditedServer.IncomingMailUseSSL);
		this.oOutgoing.port(oEditedServer.OutgoingMailPort);
		this.oOutgoing.server(oEditedServer.OutgoingMailServer);
		this.oOutgoing.ssl(!!oEditedServer.OutgoingMailUseSSL);
		this.useSmtpAuthentication(!!oEditedServer.OutgoingMailAuth);
	}
	else
	{
		this.name('');
		this.oIncoming.port(143);
		this.oIncoming.server('');
		this.oIncoming.ssl(false);
		this.oOutgoing.port(25);
		this.oOutgoing.server('');
		this.oOutgoing.ssl(false);
		this.useSmtpAuthentication(false);
	}
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

CServersAdminSettingsPaneView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === '');
};

module.exports = new CServersAdminSettingsPaneView();
