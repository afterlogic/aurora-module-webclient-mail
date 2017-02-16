'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CServerModel = require('modules/%ModuleName%/js/models/CServerModel.js'),
	CServerPropertiesView = require('modules/%ModuleName%/js/views/CServerPropertiesView.js')
;

/**
 * @constructor
 * @param {string} sPairId
 * @param {boolean} bEditMode
 */
function CServerPairPropertiesView(sPairId, bEditMode)
{
	this.servers = ko.observableArray([]);
	this.serversRetrieved = ko.observable(false);
	this.serverOptions = ko.observableArray([{ 'Name': TextUtils.i18n('%MODULENAME%/LABEL_CONFIGURE_SERVER_MANUALLY'), 'Id': 0 }]);
	this.selectedServerId = ko.observable(0);
	this.oLastEditableServer = new CServerModel();
	this.iEditedServerId = 0;
	this.selectedServerId.subscribe(function () {
		var
			iSelectedServerId = this.selectedServerId(),
			oSelectedServer = _.find(this.servers(), function (oServer) {
				return oServer.iId === iSelectedServerId;
			})
		;
		
		if (oSelectedServer)
		{
			if (this.oIncoming.isEnabled())
			{
				this.oLastEditableServer = new CServerModel(this.getParametersForSave());
			}
			this.name(oSelectedServer.sName);
			this.oIncoming.set(oSelectedServer.sIncomingServer, oSelectedServer.iIncomingPort, oSelectedServer.bIncomingUseSsl);
			this.oIncoming.isEnabled(this.bEditMode);
			this.oOutgoing.set(oSelectedServer.sOutgoingServer, oSelectedServer.iOutgoingPort, oSelectedServer.bOutgoingUseSsl);
			this.oOutgoing.isEnabled(this.bEditMode);
			this.outgoingUseAuth(oSelectedServer.bOutgoingUseAuth);
			this.outgoingUseAuth.enable(this.bEditMode);
		}
		else
		{
			this.name(this.oLastEditableServer.sName);
			this.oIncoming.set(this.oLastEditableServer.sIncomingServer, this.oLastEditableServer.iIncomingPort, this.oLastEditableServer.bIncomingUseSsl);
			this.oIncoming.isEnabled(true);
			this.oOutgoing.set(this.oLastEditableServer.sOutgoingServer, this.oLastEditableServer.iOutgoingPort, this.oLastEditableServer.bOutgoingUseSsl);
			this.oOutgoing.isEnabled(true);
			this.outgoingUseAuth(this.oLastEditableServer.bOutgoingUseAuth);
			this.outgoingUseAuth.enable(true);
		}
		
		this.setCurrentValues();
	}, this);

	this.name = ko.observable('');
	this.name.focused = ko.observable(false);
	this.bEditMode = bEditMode;
	this.oIncoming = new CServerPropertiesView(143, 993, sPairId + '_incoming', TextUtils.i18n('%MODULENAME%/LABEL_IMAP_SERVER'), bEditMode ? this.name : null);
	this.oOutgoing = new CServerPropertiesView(25, 465, sPairId + '_outgoing', TextUtils.i18n('%MODULENAME%/LABEL_SMTP_SERVER'), this.oIncoming.server);
	this.outgoingUseAuth = ko.observable(true);
	this.outgoingUseAuth.enable = ko.observable(true);
	
	this.currentValues = ko.observable([]);
}

CServerPairPropertiesView.prototype.ViewTemplate = '%ModuleName%_Settings_ServerPairPropertiesView';

CServerPairPropertiesView.prototype.init = function (bEmptyServerToEdit)
{
	if (!this.serversRetrieved())
	{
		this.requestServers();
	}
	this.setServer(bEmptyServerToEdit ? new CServerModel() : this.oLastEditableServer);
};

CServerPairPropertiesView.prototype.setServer = function (oServer)
{
	this.oLastEditableServer = oServer;
	this.setServerId(oServer.iId);
};

CServerPairPropertiesView.prototype.setServerId = function (iServerId)
{
	if (this.serversRetrieved())
	{
		var bEmptyServerNow = this.selectedServerId() === 0;
		this.selectedServerId(iServerId);
		if (bEmptyServerNow && iServerId === 0)
		{
			this.selectedServerId.valueHasMutated();
		}
	}
	else
	{
		this.iEditedServerId = iServerId;
	}
};

CServerPairPropertiesView.prototype.requestServers = function ()
{
	this.serversRetrieved(false);
	Ajax.send('GetServers', {}, function (oResponse) {
		if (_.isArray(oResponse.Result))
		{
			var aServerOptions = [{ 'Name': TextUtils.i18n('%MODULENAME%/LABEL_CONFIGURE_SERVER_MANUALLY'), 'Id': 0 }];

			_.each(oResponse.Result, function (oServer) {
				aServerOptions.push({ 'Name': oServer.Name, 'Id': oServer.EntityId });
			});

			this.servers(_.map(oResponse.Result, function (oServerData) {
				return new CServerModel(oServerData);
			}));
			this.serverOptions(aServerOptions);
			this.serversRetrieved(true);
			if (this.iEditedServerId)
			{
				this.setServerId(this.iEditedServerId);
				this.iEditedServerId = 0;
			}
		}
	}, this);
};

CServerPairPropertiesView.prototype.clear = function ()
{
	this.oIncoming.clear();
	this.oOutgoing.clear();
	this.outgoingUseAuth(true);
};

CServerPairPropertiesView.prototype.setCurrentValues = function ()
{
	var
		aNamePart = this.bEditMode ? [ this.selectedServerId(), this.name() ] : [],
		aServerPart = [
			this.selectedServerId(),
			this.name(),
			this.oIncoming.port(),
			this.oIncoming.server(),
			this.oIncoming.ssl(),
			this.oOutgoing.port(),
			this.oOutgoing.server(),
			this.oOutgoing.ssl(),
			this.outgoingUseAuth()
		]
	;
	
	this.currentValues(aNamePart.concat(aServerPart));
};

CServerPairPropertiesView.prototype.getCurrentValues = function ()
{
	this.setCurrentValues();
	return this.currentValues();
};

CServerPairPropertiesView.prototype.getParametersForSave = function ()
{
	return {
		'ServerId': this.selectedServerId() === 0 ? this.oLastEditableServer.iId : this.selectedServerId(),
		'Name': this.bEditMode ? this.name() : this.oIncoming.server(),
		'IncomingServer': this.oIncoming.server(),
		'IncomingPort': this.oIncoming.getIntPort(),
		'IncomingUseSsl': this.oIncoming.ssl(),
		'OutgoingServer': this.oOutgoing.server(),
		'OutgoingPort': this.oOutgoing.getIntPort(),
		'OutgoingUseSsl': this.oOutgoing.ssl(),
		'OutgoingUseAuth': this.outgoingUseAuth()
	};
};

/**
 * Validates if required fields are empty or not.
 * @returns {Boolean}
 */
CServerPairPropertiesView.prototype.validateBeforeSave = function ()
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

module.exports = CServerPairPropertiesView;
