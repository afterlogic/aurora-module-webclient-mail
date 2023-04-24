'use strict';

const
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	Settings = require('modules/%ModuleName%/js/Settings.js')
;

// let privateAccountEmail = null;

module.exports = {
	isPrivateAccountEmail(email) {
		// if (!Settings.AllowPrivateMessages) {
		// 	return false;
		// }
		let isPrivateAccountEmail = false;

		if (Settings.PrivateMessagesEmail) {
			isPrivateAccountEmail = Settings.PrivateMessagesEmail === email;
		}
		// const isPrivateAccountEmail = this.isPrivateEmailAddress(email);
		// if (isPrivateAccountEmail) {
		// 	privateAccountEmail = email;
		// }
		return isPrivateAccountEmail;
	},

	getPrivateAccountEmail() {
		// return privateAccountEmail;
		return Settings.PrivateMessagesEmail;
	},

	hasPrivateAccount() {
		// return privateAccountEmail !== null;
		return !!Settings.PrivateMessagesEmail;
	},


	/**
	 * Called only when the message is being sent.
	 * @param {jQuery object} signatureAnchor 
	 */
	addPrivateMarkerToMessageBody(signatureAnchor) {
		if (Settings.PrivateMessagesEmail) {
			const markerText = TextUtils.i18n('%MODULENAME%/LABEL_PRIVATE_MESSAGE_MARKER', {PRIVATE_MARKER: Settings.PrivateMessagesEmail});
			$(`<br/><div style="font-size: smaller">${markerText}</div>`).insertAfter(signatureAnchor);
			signatureAnchor.attr('data-private', Settings.PrivateMessagesEmail)
		}
	},

	/**
	 * Called only when the message is being sent.
	 * @param {object} parameters 
	 */
	correctPrivateMessageParameters(parameters) {
		if (Settings.PrivateMessagesEmail) {
			parameters.Subject = `${parameters.Subject} [${Settings.PrivateMessagesEmail}]`;
		}
	},

	/**
	 * Called during saving and sending a message.
	 * @param {object} parameters 
	 * @returns 
	 */
	addPrivateMessageHeaderToParameters(parameters) {
		if (!this.hasPrivateAccount()) {
			return;
		}
		if (!parameters.CustomHeaders) {
			parameters.CustomHeaders = {};
		}
		parameters.CustomHeaders['X-Private-Message-Sender'] = this.getPrivateAccountEmail();
	},

	isPrivateEmailAddress(sEmailAddress) {
		return /.+\.[\d]+@.+/.test(sEmailAddress);
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
		const recipients = [...message.oTo.aCollection, ...message.oCc.aCollection].map(addr => addr.sEmail).filter(email => this.isPrivateEmailAddress(email));
		return message.Custom['X-Private-Message-Sender'] || recipients.length > 0 || regex.test(text);
	},

	isMinePrivateMessage(message) {
		if (!Settings.AllowPrivateMessages || !message) {
			return false;
		}
		const recipients = [...message.oTo.aCollection, ...message.oCc.aCollection].map(addr => addr.sEmail);
		return ( message.Custom['X-Private-Message-Sender'] === this.getPrivateAccountEmail() || recipients.includes(this.getPrivateAccountEmail()));
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
		return matches && matches.some(email => email !== this.getPrivateAccountEmail());
	},

	// depricated
	shouldMessageReplyBePrivate(message) {
		if (!message) {
			return false;
		}
		const recipients = [...message.oTo.aCollection, ...message.oCc.aCollection].map(addr => addr.sEmail);
		return recipients.includes(this.getPrivateAccountEmail());
	}
};
