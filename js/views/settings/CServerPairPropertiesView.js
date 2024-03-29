'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	ValidationUtils = require('%PathToCoreWebclientModule%/js/utils/Validation.js'),

	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),

	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),

	CServerModel = require('modules/%ModuleName%/js/models/CServerModel.js'),
	CServerPropertiesView = require('modules/%ModuleName%/js/views/CServerPropertiesView.js')
;

/**
 * @constructor
 * @param {string} sPairId
 * @param {boolean} bAdminEdit
 * @param {int} iServersPerPage
 */
function CServerPairPropertiesView(sPairId, bAdminEdit, iServersPerPage)
{
	var oParams = {
		aOauthConnectorsData: []
	};
	App.broadcastEvent('%ModuleName%::GetOauthConnectorsData', oParams);
	this.bVisibleOauthSettings =  bAdminEdit && Types.isNonEmptyArray(oParams.aOauthConnectorsData);
	this.aOauthConnectorsData = Types.pArray(oParams.aOauthConnectorsData);
	this.oauthSelectedConnector = ko.observable('');


	this.iServersPerPage = Types.pInt(iServersPerPage, 0);
	this.totalServersCount = ko.observable(0);
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
			this.setExternalAccessServers(oSelectedServer.bSetExternalAccessServers);
			this.externalAccessImapServer(oSelectedServer.sExternalAccessImapServer);
			this.externalAccessImapPort(oSelectedServer.iExternalAccessImapPort);
			this.externalAccessImapAlterPort(oSelectedServer.iExternalAccessImapAlterPort > 0 ? oSelectedServer.iExternalAccessImapAlterPort : '');
			this.externalAccessImapUseSsl(oSelectedServer.bExternalAccessImapUseSsl);
			this.externalAccessPop3Server(oSelectedServer.sExternalAccessPop3Server);
			this.externalAccessPop3Port(oSelectedServer.iExternalAccessPop3Port);
			this.externalAccessPop3AlterPort(oSelectedServer.iExternalAccessPop3AlterPort > 0 ? oSelectedServer.iExternalAccessPop3AlterPort : '');
			this.externalAccessPop3UseSsl(oSelectedServer.bExternalAccessPop3UseSsl);
			this.externalAccessSmtpServer(oSelectedServer.sExternalAccessSmtpServer);
			this.externalAccessSmtpPort(oSelectedServer.iExternalAccessSmtpPort);
			this.externalAccessSmtpAlterPort(oSelectedServer.iExternalAccessSmtpAlterPort > 0 ? oSelectedServer.iExternalAccessSmtpAlterPort : '');
			this.externalAccessSmtpUseSsl(oSelectedServer.bExternalAccessSmtpUseSsl);

			this.oauthSelectedConnector(oSelectedServer.bOauthEnable ? oSelectedServer.sOauthType : '');

			this.tenantId(oSelectedServer.iTenantId);
			this.name(oSelectedServer.sName);
			this.oIncoming.set(oSelectedServer.sIncomingServer, oSelectedServer.iIncomingPort, oSelectedServer.bIncomingUseSsl);
			this.oIncoming.isEnabled(this.bAdminEdit);
			this.oOutgoing.set(oSelectedServer.sOutgoingServer, oSelectedServer.iOutgoingPort, oSelectedServer.bOutgoingUseSsl);
			this.oOutgoing.isEnabled(this.bAdminEdit);
			this.outgoingUseAuth(oSelectedServer.sSmtpAuthType === window.Enums.SmtpAuthType.UseUserCredentials);
			this.outgoingUseAuth.enable(this.bAdminEdit);
			this.domains(oSelectedServer.sDomains);
			this.smtpAuthType(oSelectedServer.sSmtpAuthType);
			this.smtpLogin(oSelectedServer.sSmtpLogin);
			this.smtpPassword(oSelectedServer.sSmtpPassword);
			this.enableSieve(oSelectedServer.bEnableSieve);
			this.sievePort(oSelectedServer.iSievePort);
			this.enableThreading(oSelectedServer.bEnableThreading);
			this.useFullEmailAddressAsLogin(oSelectedServer.bUseFullEmailAddressAsLogin);
		}
		else
		{
			this.setExternalAccessServers(this.oLastEditableServer.bSetExternalAccessServers);
			this.externalAccessImapServer(this.oLastEditableServer.sExternalAccessImapServer);
			this.externalAccessImapPort(this.oLastEditableServer.iExternalAccessImapPort);
			this.externalAccessImapAlterPort(this.oLastEditableServer.iExternalAccessImapAlterPort > 0 ? this.oLastEditableServer.iExternalAccessImapAlterPort : '');
			this.externalAccessImapUseSsl(this.oLastEditableServer.bExternalAccessImapUseSsl);
			this.externalAccessPop3Server(this.oLastEditableServer.sExternalAccessPop3Server);
			this.externalAccessPop3Port(this.oLastEditableServer.iExternalAccessPop3Port);
			this.externalAccessPop3AlterPort(this.oLastEditableServer.iExternalAccessPop3AlterPort > 0 ? this.oLastEditableServer.iExternalAccessPop3AlterPort : '');
			this.externalAccessPop3UseSsl(this.oLastEditableServer.bExternalAccessPop3UseSsl);
			this.externalAccessSmtpServer(this.oLastEditableServer.sExternalAccessSmtpServer);
			this.externalAccessSmtpPort(this.oLastEditableServer.iExternalAccessSmtpPort);
			this.externalAccessSmtpAlterPort(this.oLastEditableServer.iExternalAccessSmtpAlterPort > 0 ? this.oLastEditableServer.iExternalAccessSmtpAlterPort : '');
			this.externalAccessSmtpUseSsl(this.oLastEditableServer.bExternalAccessSmtpUseSsl);

			this.oauthSelectedConnector(this.oLastEditableServer.bOauthEnable ? this.oLastEditableServer.sOauthType : '');

			this.tenantId(0);
			this.name(this.oLastEditableServer.sName);
			this.oIncoming.set(this.oLastEditableServer.sIncomingServer, this.oLastEditableServer.iIncomingPort, this.oLastEditableServer.bIncomingUseSsl);
			this.oIncoming.isEnabled(true);
			this.oOutgoing.set(this.oLastEditableServer.sOutgoingServer, this.oLastEditableServer.iOutgoingPort, this.oLastEditableServer.bOutgoingUseSsl);
			this.oOutgoing.isEnabled(true);
			this.outgoingUseAuth(this.oLastEditableServer.sSmtpAuthType === window.Enums.SmtpAuthType.UseUserCredentials);
			this.outgoingUseAuth.enable(true);
			this.domains('');
			this.smtpAuthType(window.Enums.SmtpAuthType.UseUserCredentials);
			this.smtpLogin('');
			this.smtpPassword('');
			this.enableSieve(false);
			this.sievePort(4190);
			this.enableThreading(true);
			this.useFullEmailAddressAsLogin(true);
		}

		this.setCurrentValues();
	}, this);

	this.tenantId = ko.observable(0);
	this.name = ko.observable('');
	this.name.focused = ko.observable(false);
	this.bAdminEdit = bAdminEdit;
	this.oIncoming = new CServerPropertiesView(143, 993, sPairId + '_incoming', TextUtils.i18n('%MODULENAME%/LABEL_IMAP_SERVER'), null);
	this.oOutgoing = new CServerPropertiesView(25, 465, sPairId + '_outgoing', TextUtils.i18n('%MODULENAME%/LABEL_SMTP_SERVER'), this.oIncoming.server);
	this.outgoingUseAuth = ko.observable(true);
	this.outgoingUseAuth.enable = ko.observable(true);
	this.domains = ko.observable('');
	this.bAllowEditDomains = Settings.AllowEditDomainsInServer;
//	this.name.focused.subscribe(function () {
//		if (this.bAllowEditDomains && !this.name.focused() && this.domains() === '')
//		{
//			this.domains(this.name());
//		}
//	}, this);
	this.smtpAuthType = ko.observable(window.Enums.SmtpAuthType.UseUserCredentials);
	this.smtpLogin = ko.observable('');
	this.smtpPassword = ko.observable('');
	this.enableSieve = ko.observable(false);
	this.sievePort = ko.observable(4190);
	this.enableThreading = ko.observable(true);
	this.useFullEmailAddressAsLogin = ko.observable(true);

	this.currentValues = ko.observable('');

	this.aRequiredFields = [this.oIncoming.server, this.oIncoming.port, this.oOutgoing.server, this.oOutgoing.port];
	if (bAdminEdit)
	{
		this.aRequiredFields.unshift(this.name);
	}

	this.setExternalAccessServers = ko.observable(false);
	this.externalAccessImapServer = ko.observable(this.oIncoming.server());
	this.externalAccessImapPort = ko.observable(this.oIncoming.port());
	this.externalAccessImapAlterPort = ko.observable('');
	this.externalAccessImapUseSsl = ko.observable(false);
	this.externalAccessPop3Server = ko.observable('');
	this.externalAccessPop3Port = ko.observable(110);
	this.externalAccessPop3AlterPort = ko.observable('');
	this.externalAccessPop3UseSsl = ko.observable(false);
	this.externalAccessSmtpServer = ko.observable(this.oOutgoing.server());
	this.externalAccessSmtpPort = ko.observable(this.oOutgoing.port());
	this.externalAccessSmtpAlterPort = ko.observable('');
	this.externalAccessSmtpUseSsl = ko.observable(false);
	ko.computed(function () {
		if (!this.setExternalAccessServers())
		{
			this.externalAccessImapServer(this.oIncoming.server());
			this.externalAccessImapPort(this.oIncoming.port());
			this.externalAccessImapAlterPort('');
			this.externalAccessImapUseSsl(this.oIncoming.ssl());
			this.externalAccessPop3Server('');
			this.externalAccessPop3Port(110);
			this.externalAccessPop3AlterPort('');
			this.externalAccessPop3UseSsl(false);
			this.externalAccessSmtpServer(this.oOutgoing.server());
			this.externalAccessSmtpPort(this.oOutgoing.port());
			this.externalAccessSmtpAlterPort('');
			this.externalAccessSmtpUseSsl(this.oOutgoing.ssl());
		}
	}, this);
}

CServerPairPropertiesView.prototype.ViewTemplate = '%ModuleName%_Settings_ServerPairPropertiesView';

CServerPairPropertiesView.prototype.serverInit = function (bEmptyServerToEdit)
{
	this.setServer(bEmptyServerToEdit ? new CServerModel() : this.oLastEditableServer);
};

CServerPairPropertiesView.prototype.fullInit = function ()
{
	this.setServer(this.oLastEditableServer);
	if (!this.serversRetrieved())
	{
		this.requestServers();
	}
};

CServerPairPropertiesView.prototype.setServer = function (oServer)
{
	this.oLastEditableServer = oServer;
	this.setServerId(oServer.iId);
};

CServerPairPropertiesView.prototype.setServerId = function (iServerId)
{
	if (this.serversRetrieved() || iServerId === 0)
	{
		var bEmptyServerNow = this.selectedServerId() === 0;
		this.selectedServerId(0); // If server with identifier iServerId doesn't exist in the list selectedServerId will be reset to previous value that will be 0
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

CServerPairPropertiesView.prototype.requestServers = function (iOffset, sSearch)
{
	var iTenantId = _.isFunction(App.getTenantId) ? App.getTenantId() : 0;
	this.serversRetrieved(false);
	Ajax.send('GetServers', {
			'TenantId': iTenantId,
			'Offset': Types.pInt(iOffset, 0),
			'Limit': this.iServersPerPage,
			'Search': Types.pString(sSearch, '')
		}, function (oResponse) {
			if (_.isArray(oResponse && oResponse.Result && oResponse.Result.Items))
			{
				var aServerOptions = [{ 'Name': TextUtils.i18n('%MODULENAME%/LABEL_CONFIGURE_SERVER_MANUALLY'), 'Id': 0 }];

				_.each(oResponse.Result.Items, function (oServer) {
					aServerOptions.push({ 'Name': oServer.Name, 'Id': Types.pInt(oServer.EntityId) });
				});

				this.servers(_.map(oResponse.Result.Items, function (oServerData) {
					return new CServerModel(oServerData);
				}));
				this.totalServersCount(oResponse.Result.Count);
				this.serverOptions(aServerOptions);
				this.serversRetrieved(true);
				if (this.iEditedServerId)
				{
					this.setServerId(this.iEditedServerId);
					this.iEditedServerId = 0;
				}
			}
			else
			{
				Api.showErrorByCode(oResponse);
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
		aNamePart = this.bAdminEdit ? [ this.selectedServerId(), this.name() ] : [],
		aServerPart = [
			this.oIncoming.port(),
			this.oIncoming.server(),
			this.oIncoming.ssl(),
			this.oOutgoing.port(),
			this.oOutgoing.server(),
			this.oOutgoing.ssl(),
			this.outgoingUseAuth(),
			this.domains(),
			this.smtpAuthType(),
			this.smtpLogin(),
			this.smtpPassword(),
			this.enableSieve(),
			this.sievePort(),
			this.enableThreading(),
			this.useFullEmailAddressAsLogin(),
			this.setExternalAccessServers(),
			this.externalAccessImapServer(),
			this.externalAccessImapPort(),
			this.externalAccessImapAlterPort(),
			this.externalAccessImapUseSsl(),
			this.externalAccessPop3Server(),
			this.externalAccessPop3Port(),
			this.externalAccessPop3AlterPort(),
			this.externalAccessPop3UseSsl(),
			this.externalAccessSmtpServer(),
			this.externalAccessSmtpPort(),
			this.externalAccessSmtpAlterPort(),
			this.externalAccessSmtpUseSsl(),
			this.oauthSelectedConnector()
		]
	;

	this.currentValues((aNamePart.concat(aServerPart)).join(':'));
};

CServerPairPropertiesView.prototype.getCurrentValues = function ()
{
	this.setCurrentValues();
	return [this.currentValues()];
};

CServerPairPropertiesView.prototype.getSmtpAuthType = function ()
{
	if (this.bAdminEdit || this.smtpAuthType() === window.Enums.SmtpAuthType.UseSpecifiedCredentials)
	{
		return this.smtpAuthType();
	}
	else
	{
		return this.outgoingUseAuth() ? window.Enums.SmtpAuthType.UseUserCredentials : window.Enums.SmtpAuthType.NoAuthentication;
	}
};

CServerPairPropertiesView.prototype.getParametersForSave = function ()
{
	var
		iServerId = this.selectedServerId(),
		iLastEditableServerId = this.oLastEditableServer.iId,
		sSmtpAuthType = this.getSmtpAuthType(),
		oParameters = {}
	;
	if (iServerId === 0 && !_.find(this.servers(), function (oServer) { return iLastEditableServerId === oServer.iId; }))
	{
		iServerId = iLastEditableServerId;
	}
	oParameters = {
		'ServerId': iServerId,
		'Name': this.bAdminEdit ? this.name() : this.oIncoming.server(),
		'IncomingServer': this.oIncoming.server(),
		'IncomingPort': this.oIncoming.getIntPort(),
		'IncomingUseSsl': this.oIncoming.ssl(),
		'OutgoingServer': this.oOutgoing.server(),
		'OutgoingPort': this.oOutgoing.getIntPort(),
		'OutgoingUseSsl': this.oOutgoing.ssl(),
		'Domains': this.domains(),
		'SmtpAuthType': sSmtpAuthType,
		'SmtpLogin': sSmtpAuthType === window.Enums.SmtpAuthType.UseSpecifiedCredentials ? $.trim(this.smtpLogin()) : '',
		'SmtpPassword': sSmtpAuthType === window.Enums.SmtpAuthType.UseSpecifiedCredentials ? $.trim(this.smtpPassword()) : '',
		'EnableSieve': this.enableSieve(),
		'SievePort': this.sievePort(),
		'EnableThreading': this.enableThreading(),
		'UseFullEmailAddressAsLogin': this.useFullEmailAddressAsLogin(),
		'SetExternalAccessServers': this.setExternalAccessServers()
	};
	if (this.setExternalAccessServers())
	{
		oParameters['ExternalAccessImapServer'] = this.externalAccessImapServer();
		oParameters['ExternalAccessImapPort'] = this.externalAccessImapPort();
		oParameters['ExternalAccessImapAlterPort'] = Types.pInt(this.externalAccessImapAlterPort(), 0);
		oParameters['ExternalAccessImapUseSsl'] = this.externalAccessImapUseSsl();
		oParameters['ExternalAccessPop3Server'] = this.externalAccessPop3Server();
		oParameters['ExternalAccessPop3Port'] = this.externalAccessPop3Port();
		oParameters['ExternalAccessPop3AlterPort'] = Types.pInt(this.externalAccessPop3AlterPort(), 0);
		oParameters['ExternalAccessPop3UseSsl'] = this.externalAccessPop3UseSsl();
		oParameters['ExternalAccessSmtpServer'] = this.externalAccessSmtpServer();
		oParameters['ExternalAccessSmtpPort'] = this.externalAccessSmtpPort();
		oParameters['ExternalAccessSmtpAlterPort'] = Types.pInt(this.externalAccessSmtpAlterPort(), 0);
		oParameters['ExternalAccessSmtpUseSsl'] = this.externalAccessSmtpUseSsl();
	}

	var oOAuthConnector = _.find(this.aOauthConnectorsData, function (oConnectorData) {
		return oConnectorData.Type === this.oauthSelectedConnector();
	}, this);
	oParameters['OAuthEnable'] = !!oOAuthConnector;
	if (oOAuthConnector)
	{
		oParameters['OAuthName'] = oOAuthConnector.Name;
		oParameters['OAuthType'] = oOAuthConnector.Type;
		oParameters['OAuthIconUrl'] = oOAuthConnector.IconUrl;
	}

	return oParameters;
};

/**
 * Validates if required fields are empty or not.
 * @returns {Boolean}
 */
CServerPairPropertiesView.prototype.validateBeforeSave = function ()
{
	return ValidationUtils.checkIfFieldsEmpty(this.aRequiredFields, TextUtils.i18n('COREWEBCLIENT/ERROR_REQUIRED_FIELDS_EMPTY'));
};

CServerPairPropertiesView.prototype.onDomainsClick = function ()
{
	if (!this.bAllowEditDomains)
	{
		$('.tabsbar .item.admin.domain').removeClass('recivedAnim');
		setTimeout(function () {
			$('.tabsbar .item.admin.domain').addClass('recivedAnim');
		});
	}
};

module.exports = CServerPairPropertiesView;
