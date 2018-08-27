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
	
	CServerPairPropertiesView = require('modules/%ModuleName%/js/views/settings/CServerPairPropertiesView.js')
;

/**
 * @constructor
 */
function CServersAdminSettingsPaneView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);

	this.visible = ko.observable(true);
	
	this.oServerPairPropertiesView = new CServerPairPropertiesView('server_edit', true);
	
	this.servers = this.oServerPairPropertiesView.servers;
	this.servers.subscribe(function () {
		var oEditedServer = _.find(this.servers(), _.bind(function (oServer) {
			return oServer.iId === this.editedServerId();
		}, this));
		if (!oEditedServer)
		{
			this.routeServerList();
		}
		if (!this.serversRetrieved())
		{
			this.revert();
		}
	}, this);
	this.serversRetrieved = this.oServerPairPropertiesView.serversRetrieved;
	this.createMode = ko.observable(false);
	this.editedServerId = ko.observable(0);
	
	this.updateSavedState();
	this.oServerPairPropertiesView.currentValues.subscribe(function () {
		this.updateSavedState();
	}, this);
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
	
	this.oServerPairPropertiesView.serverInit(bCreate);
	
	this.revert();
};

CServersAdminSettingsPaneView.prototype.onShow = function ()
{
	this.oServerPairPropertiesView.requestServers();
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
					this.oServerPairPropertiesView.requestServers();
				}, this);
			}
		}, this),
		oServerToDelete = _.find(this.servers(), _.bind(function (oServer) {
			return oServer.iId === iId;
		}, this))
	;
	if (oServerToDelete && oServerToDelete.bAllowToDelete)
	{
		Popups.showPopup(ConfirmPopup, [TextUtils.i18n('%MODULENAME%/CONFIRM_REMOVE_SERVER'), fCallBack, oServerToDelete.sName]);
	}
};

/**
 * Sends request to server for server creating or updating.
 */
CServersAdminSettingsPaneView.prototype.save = function ()
{
	if (this.oServerPairPropertiesView.validateBeforeSave())
	{
		var
			sMethod = this.createMode() ? 'CreateServer' : 'UpdateServer'
		;
		this.isSaving(true);
		Ajax.send(sMethod, this.getParametersForSave(), function (oResponse) {
			this.isSaving(false);
			this.oServerPairPropertiesView.requestServers();
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
	return this.oServerPairPropertiesView.getCurrentValues();
};

/**
 * Reverts fields values to empty or edited server.
 */
CServersAdminSettingsPaneView.prototype.revertGlobalValues = function ()
{
	this.oServerPairPropertiesView.setServerId(this.editedServerId());
};

/**
 * Returns parameters for creating or updating on server.
 * @returns {Object}
 */
CServersAdminSettingsPaneView.prototype.getParametersForSave = function ()
{
	return this.oServerPairPropertiesView.getParametersForSave();
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
