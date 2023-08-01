'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	DateUtils = require('%PathToCoreWebclientModule%/js/utils/Date.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CAutoresponderModel = require('modules/%ModuleName%/js/models/CAutoresponderModel.js')
;

/**
 * @constructor
 */ 
function CAccountAutoresponderSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.enable = ko.observable(false);
	this.subject = ko.observable('');
	this.message = ko.observable('');

	this.scheduled = ko.observable(false);
	this.start = ko.observable(null);
	this.end = ko.observable(null);

	this.dateFormatDatePicker = 'yy.mm.dd';

	this.startDateDom = ko.observable(null);
	this.startDate = ko.observable('');

	this.endDateDom = ko.observable(null);
	this.endDate = ko.observable('');
	
	AccountList.editedId.subscribe(function () {
		if (this.bShown)
		{
			this.populate();
		}
	}, this);
}

_.extendOwn(CAccountAutoresponderSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CAccountAutoresponderSettingsFormView.prototype.ViewTemplate = '%ModuleName%_Settings_AccountAutoresponderSettingsFormView';

CAccountAutoresponderSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.enable(),
		this.subject(),
		this.message(),
		this.scheduled(false),
		this.start(null),
		this.end(null),
	];
};

CAccountAutoresponderSettingsFormView.prototype.onShow = function ()
{
	this.populate();
};

CAccountAutoresponderSettingsFormView.prototype.onBind = function ()
{
	_.delay(_.bind(function(){
		this.createDatePickerObject(this.startDateDom(), this.startDate);
	}, this), 1000);
};

CAccountAutoresponderSettingsFormView.prototype.revert = function ()
{
	this.populate();
};

CAccountAutoresponderSettingsFormView.prototype.getParametersForSave = function ()
{
	return {
		'AccountID': AccountList.editedId(),
		'Enable': this.enable(),
		'Subject': this.subject(),
		'Message': this.message()
	};
};

CAccountAutoresponderSettingsFormView.prototype.applySavedValues = function (oParameters)
{
	var
		oAccount = AccountList.getEdited(),
		oAutoresponder = oAccount.autoresponder()
	;

	if (oAutoresponder)
	{
		oAutoresponder.enable = oParameters.Enable;
		oAutoresponder.subject = oParameters.Subject;
		oAutoresponder.message = oParameters.Message;
	}
};

CAccountAutoresponderSettingsFormView.prototype.save = function ()
{
	this.isSaving(true);
	
	this.updateSavedState();
	
	Ajax.send('UpdateAutoresponder', this.getParametersForSave(), this.onResponse, this);
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAccountAutoresponderSettingsFormView.prototype.onResponse = function (oResponse, oRequest)
{
	this.isSaving(false);

	if (oResponse.Result === false)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_SAVING_SETTINGS_FAILED'));
	}
	else
	{
		var oParameters = oRequest.Parameters;
		
		this.applySavedValues(oParameters);
		
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_AUTORESPONDER_UPDATE_SUCCESS'));
	}
};

CAccountAutoresponderSettingsFormView.prototype.populate = function()
{
	var oAccount = AccountList.getEdited();
	
	if (oAccount)
	{
		if (oAccount.autoresponder() !== null)
		{
			this.enable(oAccount.autoresponder().enable);
			this.subject(oAccount.autoresponder().subject);
			this.message(oAccount.autoresponder().message);
			
			this.scheduled(oAccount.autoresponder().scheduled);
			this.start(oAccount.autoresponder().start);
			this.end(oAccount.autoresponder().end);
		}
		else
		{
			Ajax.send('GetAutoresponder', {'AccountID': oAccount.id()}, this.onGetAutoresponderResponse, this);
		}
	}
	
	this.updateSavedState();
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAccountAutoresponderSettingsFormView.prototype.onGetAutoresponderResponse = function (oResponse, oRequest)
{
	if (oResponse && oResponse.Result)
	{
		var
			oParameters = oRequest.Parameters,
			iAccountId = Types.pInt(oParameters.AccountID),
			oAccount = AccountList.getAccount(iAccountId),
			oAutoresponder = new CAutoresponderModel()
		;

		if (oAccount)
		{
			oAutoresponder.parse(iAccountId, oResponse.Result);
			oAccount.autoresponder(oAutoresponder);

			if (iAccountId === AccountList.editedId())
			{
				this.populate();
			}
		}
	}
};

CAccountAutoresponderSettingsFormView.prototype.createDatePickerObject = function (oElement, value)
{
	$(oElement).datepicker({
		showOtherMonths: true,
		selectOtherMonths: true,
		monthNames: DateUtils.getMonthNamesArray(),
		dayNamesMin: TextUtils.i18n('COREWEBCLIENT/LIST_DAY_NAMES_MIN').split(' '),
		nextText: '',
		prevText: '',
		firstDay: Types.pInt(ModulesManager.run('CalendarWebclient', 'getWeekStartsOn')),
		showOn: 'focus',
		dateFormat: this.dateFormatDatePicker,
		onClose: function (sValue) {
			if (ko.isObservable(value)) {
				value(sValue);
			}
		}
	});

	$(oElement).mousedown(function() {
		$('#ui-datepicker-div').toggle();
	});
};

module.exports = new CAccountAutoresponderSettingsFormView();
