'use strict';

var
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

function CServerModel(oServer)
{
	this.iId = oServer ? Types.pInt(oServer.iObjectId) : 0;
	this.sName = oServer ? Types.pString(oServer.Name) : '';
	this.sIncomingServer = oServer ? Types.pString(oServer.IncomingServer) : '';
	this.iIncomingPort = oServer ? Types.pString(oServer.IncomingPort) : 143;
	this.bIncomingUseSsl = oServer ? !!oServer.IncomingUseSsl : false;
	this.bOutgoingUseAuth = oServer ? !!oServer.OutgoingUseAuth : false;
	this.sOutgoingServer = oServer ? Types.pString(oServer.OutgoingServer) : '';
	this.iOutgoingPort = oServer ? Types.pString(oServer.OutgoingPort) : 25;
	this.bOutgoingUseSsl = oServer ? !!oServer.OutgoingUseSsl : false;
}

module.exports = CServerModel;
