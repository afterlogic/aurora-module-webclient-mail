'use strict';

const
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	Settings = require('modules/%ModuleName%/js/Settings.js')
;

// let privateAccountEmail = null;

function getPrivateMessageMatches(message) {
	if (!message) {
		return [];
	}
	const regex = /([A-Z]{3}-[0-9]{6})/ig;
	const header = message.Custom['X-Private-Message-Sender'] || '';
	const subject = message.subject() || '';
	const text = message.text() || '';
	const matches = [].concat(header.match(regex) || [], subject.match(regex) || [], text.match(regex) || []);
	return matches;
}

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
		const matches = getPrivateMessageMatches(message);
		return matches.length > 0;
	},

	isMinePrivateMessage(message) {
		if (!Settings.AllowPrivateMessages) {
			return false;
		}
		const matches = getPrivateMessageMatches(message);
		return matches.includes(Settings.PrivateMessagesEmail);
	},
	
	isAnotherUserPrivateMessage(message) {
		const matches = getPrivateMessageMatches(message);
		return matches.length > 0 && !matches.includes(Settings.PrivateMessagesEmail);
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
