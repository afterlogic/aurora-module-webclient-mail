'use strict';

var
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

function CServerModel(oServer)
{
	this.iId = oServer ? Types.pInt(oServer.EntityId) || Types.pInt(oServer.ServerId) : 0;
	this.sName = oServer ? Types.pString(oServer.Name) : '';
	this.sIncomingServer = oServer ? Types.pString(oServer.IncomingServer) : '';
	this.iIncomingPort = oServer ? Types.pInt(oServer.IncomingPort) : 143;
	this.bIncomingUseSsl = oServer ? !!oServer.IncomingUseSsl : false;
	this.sOutgoingServer = oServer ? Types.pString(oServer.OutgoingServer) : '';
	this.iOutgoingPort = oServer ? Types.pInt(oServer.OutgoingPort) : 25;
	this.bOutgoingUseSsl = oServer ? !!oServer.OutgoingUseSsl : false;
	this.sDomains = oServer ? Types.pString(oServer.Domains) : '';
	this.sSmtpAuthType = oServer ? Types.pString(oServer.SmtpAuthType) : window.Enums.SmtpAuthType.UseUserCredentials;
	this.sSmtpLogin = oServer ? Types.pString(oServer.SmtpLogin) : '';
	this.sSmtpPassword = oServer ? Types.pString(oServer.SmtpPassword) : '';
	this.bEnableSieve = oServer ? !!oServer.EnableSieve : false;
	this.iSievePort = oServer && oServer.SievePort ? Types.pInt(oServer.SievePort) : 4190;
	this.bEnableThreading = oServer ? !!oServer.EnableThreading : false;
	this.bUseFullEmailAddressAsLogin = oServer ? !!oServer.UseFullEmailAddressAsLogin : true;
}

module.exports = CServerModel;
