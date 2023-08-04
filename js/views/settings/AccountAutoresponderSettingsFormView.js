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
	
	this.dateFormatMoment = CommonUtils.getDateFormatForMoment(UserSettings.dateFormat())
	this.dateFormatDatePicker = CalendarUtils.getDateFormatForDatePicker(UserSettings.dateFormat())

	// this.timeOptions = ko.observableArray(CalendarUtils.getTimeListStepHour(this.getCurrentTimeFormat(), 'HH:mm'));
	// UserSettings.timeFormat.subscribe(function () {
	// 	this.timeOptions(CalendarUtils.getTimeListStepHour(this.getCurrentTimeFormat(), 'HH:mm'));
	// }, this);

	this.startDateDom = ko.observable(null);
	this.startDate = ko.observable('');
	// this.startTime = ko.observable('');
	this.startTimestamp = ko.computed(function () {
		// return moment(this.startDate() + ' ' + this.startTime(), this.dateFormatMoment + ' HH:mm').unix();
		return moment(this.startDate(), this.dateFormatMoment).unix();
	}, this);

	this.endDateDom = ko.observable(null);
	this.endDate = ko.observable('');
	// this.endTime = ko.observable('');
	this.endTimestamp = ko.computed(function () {
		// return moment(this.endDate() + ' ' + this.endTime(), this.dateFormatMoment + ' HH:mm').unix();
		return moment(this.endDate(), this.dateFormatMoment).endOf('day').unix();
	}, this);

	this.startDate.subscribe(function(v) {
		const momentStart = moment(v, this.dateFormatMoment);

		if (momentStart.isValid()) {
			this.startDateDom().datepicker('setDate', momentStart.format(this.dateFormatMoment));

			//correct end date if the internal is negative
			const momentEnd = this.endDate() ? moment(this.endDate(), this.dateFormatMoment) : moment();
			if (momentStart.diff(momentEnd, 'days') >= 0) {
				this.endDate(momentStart.add(6, 'days').format(this.dateFormatMoment))
			}
		}
	}, this);
	
	this.endDate.subscribe(function(v) {
		const momentEnd = moment(v, this.dateFormatMoment);
		
		if (momentEnd.isValid()) {
			this.endDateDom().datepicker('setDate', momentEnd.format(this.dateFormatMoment));
			
			//correct start date if the internal is negative
			const momentStart = this.startDate() ? moment(this.startDate(), this.dateFormatMoment) : moment();
			if (momentStart.diff(momentEnd, 'days') >= 0) {
				this.startDate(momentEnd.subtract(6, 'days').format(this.dateFormatMoment))
			}
		}
	}, this);

	AccountList.editedId.subscribe(function () {
		if (this.bShown) {
			this.populate();
		}
	}, this);

	this.startDateDom.subscribe(function (v) {
		this.createDatePickerObject(v, this.startDate);
	}, this);

	this.endDateDom.subscribe(function (v) {
		this.createDatePickerObject(v, this.endDate);
	}, this);

	this.scheduled.subscribe(function(bEnabled) {
		if (bEnabled) {
			const momentStart = moment(this.startDate(), this.dateFormatMoment);
			if (!momentStart.isValid()) {
				this.startDate(moment().format(this.dateFormatMoment));
				// this.startTime(momentStart.format('HH:mm'));
			}
		}
	}, this);

	this.allowScheduledAutoresponder = Settings.AllowScheduledAutoresponder;
}

_.extendOwn(CAccountAutoresponderSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CAccountAutoresponderSettingsFormView.prototype.ViewTemplate = '%ModuleName%_Settings_AccountAutoresponderSettingsFormView';

CAccountAutoresponderSettingsFormView.prototype.getCurrentTimeFormat = function ()
{
	return UserSettings.timeFormat() !== Enums.TimeFormat.F24 ? 'hh:mm A' : 'HH:mm';
}

CAccountAutoresponderSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.enable(),
		this.subject(),
		this.message(),
		this.scheduled(),
		this.startTimestamp(),
		this.endTimestamp(),
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
	const oParams = {
		'AccountID': AccountList.editedId(),
		'Enable': this.enable(),
		'Subject': this.subject(),
		'Message': this.message(),
		'Scheduled': this.scheduled(),
		// 'Start': null,
		// 'End': null
	};	
	
	if (this.scheduled()) {
		oParams['Start'] = this.startTimestamp();
		oParams['End'] = this.endTimestamp();
	}

	return oParams;
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

		oAutoresponder.scheduled = oParameters.Scheduled
		oAutoresponder.start = oParameters.Start;
		oAutoresponder.end = oParameters.End;
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
	const oAccount = AccountList.getEdited();
	
	if (oAccount)
	{
		const oAutoresponder = oAccount.autoresponder();
		if (oAutoresponder !== null)
		{
			this.enable(oAutoresponder.enable);
			this.subject(oAutoresponder.subject);
			this.message(oAutoresponder.message);
			
			this.scheduled(oAutoresponder.scheduled);
			
			const momentStart = moment.unix(oAutoresponder.start);
			if (oAutoresponder.start !== null && momentStart.isValid()) {
				// this.startDateDom().datepicker('setDate', momentStart.toDate())
				this.startDate(momentStart.format(this.dateFormatMoment));
				// this.startTime(momentStart.format(this.getCurrentTimeFormat()));
			}
				
			const momentEnd = moment.unix(oAutoresponder.end);
			if (oAutoresponder.end !== null &&  momentEnd.isValid()) {
				// this.endDateDom().datepicker('setDate', momentEnd.toDate())
				this.endDate(momentEnd.format(this.dateFormatMoment));
				// this.endTime(momentEnd.format(this.getCurrentTimeFormat()));
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
		dateFormat: 'dd/mm/yy',
		onClose: function (sValue) {
			if (ko.isObservable(value)) {
				value(sValue);
			}
		}
	});

	$(oElement).datepicker('setDate', value());

	$(oElement).on('mousedown', function() {
		$('#ui-datepicker-div').toggle();
	});
};

module.exports = new CAccountAutoresponderSettingsFormView();
