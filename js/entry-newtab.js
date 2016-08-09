'use strict';

var $ = require('jquery');

$('body').ready(function () {
	var
		oAvaliableModules = {
			'MailWebclient': require('modules/MailWebclient/js/manager-newtab.js'),
			'ContactsWebclient': require('modules/ContactsWebclient/js/manager-components.js'),
			'CalendarWebclient': require('modules/CalendarWebclient/js/manager-newtab.js'),
			'MailSensitivityWebclientPlugin': require('modules/MailSensitivityWebclientPlugin/js/manager.js'),
			'OpenPgpWebclient': require('modules/OpenPgpWebclient/js/manager.js')
		},
		ModulesManager = require('modules/CoreClient/js/ModulesManager.js'),
		App = require('modules/CoreClient/js/App.js')
	;
	
	App.setNewTab();
	ModulesManager.init(oAvaliableModules, App.getUserRole(), App.isPublic());
	App.init();
});
