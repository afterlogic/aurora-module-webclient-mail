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
	this.dateFormatMoment = ko.computed(function () {
		return CommonUtils.getDateFormatForMoment(UserSettings.dateFormat());
	}, this)

	this.startDateDom = ko.observable(null);
	this.startTimestamp = ko.observable(null);

	this.endDateDom = ko.observable(null);
	this.endTimestamp = ko.observable(null);

	this.startTimestamp.subscribe(function (v) {
		const momentStart = moment.unix(v);
		this.startDateDom().datepicker('setDate', momentStart.format(this.dateFormatMoment()));

		const momentEnd = this.endTimestamp() ? moment.unix(this.endTimestamp()) : moment();
		if (momentStart.diff(momentEnd, 'days') >= 0 && this.endDateDom()) {
			const newMomentEnd = momentStart.add(6, 'days');
			this.endTimestamp(newMomentEnd.unix());
		}
	}, this);
	
	this.endTimestamp.subscribe(function (v) {
		const momentEnd = moment.unix(v);
		this.endDateDom().datepicker('setDate', momentEnd.format(this.dateFormatMoment()));

		const momentStart = this.startTimestamp() ? moment.unix(this.startTimestamp()) : moment();
		if (momentStart.diff(momentEnd, 'days') >= 0 && this.startDateDom()) {
			const newMomentStart = momentEnd.subtract(6, 'days');
			this.startTimestamp(newMomentStart.unix());
		}
	}, this);

	AccountList.editedId.subscribe(function () {
		if (this.bShown) {
			this.populate();
		}
	}, this);

	this.startDateDom.subscribe(function (v) {
		if (!this.startTimestamp()) {
			this.startTimestamp(moment().unix());
		}
		this.createDatePickerObject(v, this.startTimestamp);
	}, this);

	this.endDateDom.subscribe(function (v) {
		if (!this.endTimestamp()) {
			this.endTimestamp(moment().add(6, 'days').unix());
		}
		this.createDatePickerObject(v, this.endTimestamp);
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
			
			if (oAutoresponder.start !== null) {
				this.startTimestamp(oAutoresponder.start);
			}
				
			if (oAutoresponder.end !== null) {
				this.endTimestamp(oAutoresponder.end);
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
		dateFormat: CalendarUtils.getDateFormatForDatePicker(UserSettings.dateFormat()),
		onClose: (sValue) => {
			if (ko.isObservable(value)) {
				value(moment(sValue, this.dateFormatMoment()).unix());
			}
		}
	});

	$(oElement).datepicker('setDate', moment.unix(value()).format(this.dateFormatMoment()));

	$(oElement).on('mousedown', function() {
		$('#ui-datepicker-div').toggle();
	});
};

module.exports = new CAccountAutoresponderSettingsFormView();
