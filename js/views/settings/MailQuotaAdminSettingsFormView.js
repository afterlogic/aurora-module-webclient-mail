'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CMailQuotaAdminSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName, 'UpdateEntityQuota');
	
	this.bTenantAdmin = App.getUserRole() === Enums.UserRole.TenantAdmin;

	this.iTenantId = 0;
	this.allowGlobalTenantQuota = ko.observable(false);
	this.globalTenantQuotaMb = ko.observable(0);
	this.allocatedTenantSpaceMb = ko.observable(0);
	
	this.iUserId = 0;
	this.userQuotaMb = ko.observable(0);
}

_.extendOwn(CMailQuotaAdminSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CMailQuotaAdminSettingsFormView.prototype.ViewTemplate = '%ModuleName%_Settings_MailQuotaAdminSettingsFormView';

CMailQuotaAdminSettingsFormView.prototype.onRouteChild = function ()
{
	this.requestPerTenantSettings();
	this.requestPerUserSettings();
};

CMailQuotaAdminSettingsFormView.prototype.requestPerTenantSettings = function ()
{
	if (Types.isPositiveNumber(this.iTenantId))
	{
		this.globalTenantQuotaMb('');
		Ajax.send(Settings.ServerModuleName, 'GetEntityQuota', { 'Type': 'Tenant', 'TenantId': this.iTenantId }, function (oResponse) {
			if (oResponse.Result)
			{
				this.allowGlobalTenantQuota(Types.pBool(oResponse.Result.AllowGlobalQuota));
				this.globalTenantQuotaMb(Types.pInt(oResponse.Result.GlobalQuotaMb));
				this.allocatedTenantSpaceMb(Types.pInt(oResponse.Result.AllocatedSpaceMb));
			}
			else
			{
				this.globalTenantQuotaMb(0);
			}
			this.updateSavedState();
		}, this);
	}
	else
	{
		this.globalTenantQuotaMb(0);
		this.updateSavedState();
	}
};

CMailQuotaAdminSettingsFormView.prototype.requestPerUserSettings = function ()
{
	if (Types.isPositiveNumber(this.iUserId))
	{
		this.userQuotaMb('');
		Ajax.send(Settings.ServerModuleName, 'GetEntityQuota', { 'Type': 'User', 'UserId': this.iUserId }, function (oResponse) {
			if (oResponse.Result)
			{
				this.userQuotaMb(Types.pInt(oResponse.Result.UserQuotaMb));
			}
			else
			{
				this.userQuotaMb(0);
			}
			this.updateSavedState();
		}, this);
	}
	else
	{
		this.userQuotaMb(0);
		this.updateSavedState();
	}
};

CMailQuotaAdminSettingsFormView.prototype.getCurrentValues = function ()
{
	if (Types.isPositiveNumber(this.iUserId))
	{
		return [
			this.userQuotaMb()
		];
	}
	if (Types.isPositiveNumber(this.iTenantId))
	{
		return [
			this.globalTenantQuotaMb()
		];
	}
	return [];
};

CMailQuotaAdminSettingsFormView.prototype.getParametersForSave = function ()
{
	if (Types.isPositiveNumber(this.iUserId))
	{
		return {
			'Type': 'User',
			'UserId': this.iUserId,
			'QuotaMb': Types.pInt(this.userQuotaMb())
		};
	}
	if (this.allowGlobalTenantQuota() && Types.isPositiveNumber(this.iTenantId))
	{
		return {
			'Type': 'Tenant',
			'TenantId': this.iTenantId,
			'QuotaMb': Types.pInt(this.globalTenantQuotaMb())
		};
	}
	return {};
};

CMailQuotaAdminSettingsFormView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === 'User' || sEntityType === 'Tenant');
	this.iUserId = sEntityType === 'User' ? iEntityId : 0;
	this.iTenantId = sEntityType === 'Tenant' ? iEntityId : 0;
};

module.exports = new CMailQuotaAdminSettingsFormView();
