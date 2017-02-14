'use strict';

var
	$ = require('jquery'),
	ko = require('knockout'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

/**
 * @constructor
 * 
 * @param {number} iDefaultPort
 * @param {number} iDefaultSslPort
 * @param {string} sId
 * @param {string} sLabel
 * @param {function} koDefaultServerValue
 */
function CServerPropertiesView(iDefaultPort, iDefaultSslPort, sId, sLabel, koDefaultServerValue)
{
	this.server = ko.observable('');
	this.server.focused = ko.observable(false);
	this.label = sLabel;
	this.defaultPort = ko.observable(iDefaultPort);
	this.defaultSslPort = ko.observable(iDefaultSslPort);
	this.port = ko.observable(iDefaultPort);
	this.port.focused = ko.observable(false);
	this.ssl = ko.observable(false);
	this.isEnabled = ko.observable(true);
	this.id = sId;

	if ($.isFunction(koDefaultServerValue))
	{
		koDefaultServerValue.focused.subscribe(function () {
			if (!koDefaultServerValue.focused() && this.server() === '')
			{
				this.server(koDefaultServerValue());
			}
		}, this);
	}
	
	this.ssl.subscribe(function () {
		var iPort = Types.pInt(this.port());
		if (this.ssl())
		{
			if (iPort === this.defaultPort())
			{
				this.port(this.defaultSslPort());
			}
		}
		else
		{
			if (iPort === this.defaultSslPort())
			{
				this.port(this.defaultPort());
			}
		}
	}, this);
}

/**
 * @param {string} sServer
 * @param {number} iPort
 * @param {boolean} bSsl
 */
CServerPropertiesView.prototype.set = function (sServer, iPort, bSsl)
{
	this.server(sServer);
	this.port(iPort);
	this.ssl(bSsl);
};

CServerPropertiesView.prototype.clear = function ()
{
	this.server('');
	this.port(this.defaultPort());
	this.ssl(false);
};

CServerPropertiesView.prototype.getIntPort = function ()
{
	return Types.pInt(this.port());
};

module.exports = CServerPropertiesView;
