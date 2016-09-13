'use strict';

var $ = require('jquery');

$('body').ready(function () {
	var
		oAvaliableModules = {
			'MailWebclient': require('modules/MailWebclient/js/manager.js'),
			'ContactsWebclient': require('modules/ContactsWebclient/js/manager.js'),
			'CalendarWebclient': require('modules/CalendarWebclient/js/manager.js'),
			'MailSensitivityWebclientPlugin': require('modules/MailSensitivityWebclientPlugin/js/manager.js'),
			'OpenPgpWebclient': require('modules/OpenPgpWebclient/js/manager.js')
		},
		ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
		App = require('%PathToCoreWebclientModule%/js/App.js')
	;
	
	App.setNewTab();
	ModulesManager.init(oAvaliableModules);
	App.init();
});
