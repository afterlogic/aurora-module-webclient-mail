'use strict';

const
	App = require('%PathToCoreWebclientModule%/js/App.js'),

	Settings = require('modules/%ModuleName%/js/Settings.js')
;

let privateAccountEmail = null;

module.exports = {
	isPrivateAccountEmail(email) {
		if (!Settings.AllowPrivateMessages) {
			return false;
		}
		if (privateAccountEmail !== null) {
			return privateAccountEmail === email;
		}
		const isPrivateAccountEmail = /.+\.[\d]+@.+/.test(email);
		if (isPrivateAccountEmail) {
			privateAccountEmail = email;
		}
		return isPrivateAccountEmail;
	},

	getPrivateAccountEmail() {
		return privateAccountEmail;
	},

	hasPrivateAccount() {
		return privateAccountEmail !== null;
	},

	addPrivateMessageHeaderToParameters(parameters) {
		if (privateAccountEmail === null) {
			return;
		}
		if (!parameters.CustomHeaders) {
			parameters.CustomHeaders = {};
		}
		parameters.CustomHeaders['X-Private-Message-Sender'] = privateAccountEmail;
	},

	isPrivateMessageParameters(parameters) {
		return parameters.CustomHeaders && parameters.CustomHeaders['X-Private-Message-Sender'] === privateAccountEmail;
	},

	isPrivateMessage(message) {
		if (!Settings.AllowPrivateMessages) {
			return false;
		}
		return message && message.Custom['X-Private-Message-Sender'] === privateAccountEmail;
	},

	shouldMessageReplyBePrivate(message) {
		if (!message) {
			return false;
		}
		const recipients = [...message.oTo.aCollection, ...message.oCc.aCollection].map(addr => addr.sEmail);
		return recipients.includes(privateAccountEmail);
	}
};
