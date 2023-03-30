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
		// if (!Settings.AllowPrivateMessages || !message) {
		// 	return false;
		// }
		if (!message) {
			return false;
		}
		const text = message.text() || '';
		const regex = /([A-Z0-9\"!#\$%\^\{\}`~&'\+\-=_\.]+\.[\d]+@[A-Z0-9\.\-]+)/ig;
		const recipients = [...message.oTo.aCollection, ...message.oCc.aCollection].map(addr => addr.sEmail).filter(email => /.+\.[\d]+@.+/.test(email));
		return message.Custom['X-Private-Message-Sender'] || recipients.length > 0 || regex.test(text);
	},

	isMinePrivateMessage(message) {
		if (!Settings.AllowPrivateMessages || !message) {
			return false;
		}
		const recipients = [...message.oTo.aCollection, ...message.oCc.aCollection].map(addr => addr.sEmail);
		return ( message.Custom['X-Private-Message-Sender'] === privateAccountEmail || recipients.includes(privateAccountEmail));
	},
	
	isAnotherUserPrivateMessage(message) {
		// if (!Settings.AllowPrivateMessages) {
		// 	return false;
		// }
		if (!message) {
			return false;
		}
		const text = message.text();
		// const regex = /([^\s.]+\.[\d]+@[A-Z0-9\.\-]+)/ig;
		const regex = /([A-Z0-9\"!#\$%\^\{\}`~&'\+\-=_\.]+\.[\d]+@[A-Z0-9\.\-]+)/ig;
		const matches = text.match(regex);
		return matches && matches.some(email => email !== privateAccountEmail);
	},

	// depricated
	shouldMessageReplyBePrivate(message) {
		if (!message) {
			return false;
		}
		const recipients = [...message.oTo.aCollection, ...message.oCc.aCollection].map(addr => addr.sEmail);
		return recipients.includes(privateAccountEmail);
	}
};
