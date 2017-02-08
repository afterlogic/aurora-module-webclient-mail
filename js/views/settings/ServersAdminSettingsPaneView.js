'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
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

/**
 * Sets routing to create server mode.
 */
CServersAdminSettingsPaneView.prototype.routeCreateServer = function ()
{
	ModulesManager.run('AdminPanelWebclient', 'setAddHash', [['create']]);
};

/**
 * Sets routing to edit server mode.
 * @param {number} iId Server identifier.
 */
CServersAdminSettingsPaneView.prototype.routeEditServer = function (iId)
{
	ModulesManager.run('AdminPanelWebclient', 'setAddHash', [[iId]]);
};

/**
 * Sets routing to only server list mode.
 */
CServersAdminSettingsPaneView.prototype.routeServerList = function ()
{
	ModulesManager.run('AdminPanelWebclient', 'setAddHash', [[]]);
};

/**
 * Executes when routing was changed.
 * @param {array} aParams Routing parameters.
 */
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

/**
 * Requests server list from server.
 */
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
				this.routeServerList();
			}
			if (!this.received())
			{
				this.revertGlobalValues();
			}
			this.received(true);
		}
	}, this);
};

/**
 * Shows popup to confirm server deletion and sends request to delete on server.
 * @param {number} iId
 */
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

/**
 * Validates if required fields are empty or not.
 * @returns {Boolean}
 */
CServersAdminSettingsPaneView.prototype.validateBeforeSave = function ()
{
	var
		aRequiredFields = [this.name, this.oIncoming.server, this.oIncoming.port, this.oOutgoing.server, this.oOutgoing.port],
		koFirstEmptyField = _.find(aRequiredFields, function (koField) {
			return koField() === '';
		})
	;
	
	if (koFirstEmptyField)
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_REQUIRED_FIELDS_EMPTY'));
		koFirstEmptyField.focused(true);
		return false;
	}
	
	return true;
};

/**
 * Sends request to server for server creating or updating.
 */
CServersAdminSettingsPaneView.prototype.save = function ()
{
	if (this.validateBeforeSave())
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
				this.routeServerList();
			}
		}, this);
	}
};

/**
 * Returns list of current values to further comparing of states.
 * @returns {Array}
 */
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

/**
 * Reverts fields values to empty or edited server.
 */
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

/**
 * Returns parameters for creating or updating on server.
 * @returns {Object}
 */
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

/**
 * Detemines if pane could be visible for specified entity type.
 * @param {string} sEntityType
 * @param {number} iEntityId
 */
CServersAdminSettingsPaneView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === '');
};

module.exports = new CServersAdminSettingsPaneView();
