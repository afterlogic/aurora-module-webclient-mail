'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	moment = require('moment'),
	
	DateUtils = require('%PathToCoreWebclientModule%/js/utils/Date.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	CalendarUtils = require('%PathToCoreWebclientModule%/js/utils/Calendar.js'),
	CommonUtils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	CAutoresponderModel = require('modules/%ModuleName%/js/models/CAutoresponderModel.js')
;

require("jquery-ui/ui/widgets/datepicker");

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

	this.timeFormat = (UserSettings.timeFormat() !== Enums.TimeFormat.F24) ? 'hh:mm A' : 'HH:mm';
	this.timeFormatMoment = this.timeFormat;
	this.dateFormatMoment = CommonUtils.getDateFormatForMoment(UserSettings.dateFormat())
	this.dateFormatDatePicker = CalendarUtils.getDateFormatForDatePicker(UserSettings.dateFormat())

	this.timeOptions = ko.observableArray(CalendarUtils.getTimeListStepHour((UserSettings.timeFormat() !== Enums.TimeFormat.F24) ? 'hh:mm A' : 'HH:mm', 'HH:mm'));

	this.startDateDom = ko.observable(null);
	this.startDate = ko.observable('');
	this.startTime = ko.observable('');
	this.start = ko.computed(function () {
		return moment(this.startDate() + ' ' + this.startTime(), this.dateFormatMoment + ' ' + this.timeFormat).unix();
	}, this);

	this.endDateDom = ko.observable(null);
	this.endDate = ko.observable('');
	this.endTime = ko.observable('');
	this.end = ko.computed(function () {
		return moment(this.endDate() + ' ' + this.endTime(), this.dateFormatMoment + ' ' + this.timeFormat).unix();
	}, this);

	UserSettings.timeFormat.subscribe(function () {
		this.timeOptions(CalendarUtils.getTimeListStepHour(this.timeFormat, 'HH:mm'));
	}, this);
	
	AccountList.editedId.subscribe(function () {
		if (this.bShown)
		{
			this.populate();
		}
	}, this);

	this.startDateDom.subscribe(function (v) {
		this.createDatePickerObject(v, this.startDate);
	}, this);

	this.endDateDom.subscribe(function (v) {
		this.createDatePickerObject(v, this.endDate);
	}, this);

	this.allowScheduledAutoresponder = Settings.AllowScheduledAutoresponder;
}

_.extendOwn(CAccountAutoresponderSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CAccountAutoresponderSettingsFormView.prototype.ViewTemplate = '%ModuleName%_Settings_AccountAutoresponderSettingsFormView';

CAccountAutoresponderSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.enable(),
		this.subject(),
		this.message(),
		this.scheduled(),
		this.start(),
		this.end(),
	];
};

CAccountAutoresponderSettingsFormView.prototype.onShow = function ()
{
	this.populate();
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
		'Message': this.message(),
		
		'Scheduled': this.scheduled(),
		'Start': this.start(),
		'End': this.end()
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
			var 
				momentStart = moment(oAccount.autoresponder().start),
				momentEnd = moment(oAccount.autoresponder().end)
			;

			if (this.startDateDom()) {
				this.startDateDom().datepicker('option', 'dateFormat', this.dateFormatDatePicker);

				if (momentStart) {
					console.log(momentStart, momentStart.toDate());
					this.startDateDom().datepicker('setDate', momentStart.toDate())
					this.startTime(momentStart.format(this.timeFormat));
				}
			}

			if (this.endDateDom()) {
				this.endDateDom().datepicker('option', 'dateFormat', this.dateFormatDatePicker);

				if (momentEnd) {
					this.endDateDom().datepicker('setDate', momentEnd.toDate())
					this.endTime(momentEnd.format(this.timeFormat));
				}
			}
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

CAccountAutoresponderSettingsFormView.prototype.getCorrectedTimeList = function (oElement, value)
{

};

module.exports = new CAccountAutoresponderSettingsFormView();
