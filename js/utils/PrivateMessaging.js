'use strict';

const
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	Settings = require('modules/%ModuleName%/js/Settings.js'),
	InformatikSettings =  require('modules/InformatikProjects/js/Settings.js')
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
		return false;
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
		return;
		// return privateAccountEmail;
		return Settings.PrivateMessagesEmail;
	},
	
	hasPrivateAccount() {
		return;
		// return privateAccountEmail !== null;
		return !!Settings.PrivateMessagesEmail;
	},


	/**
	 * Called only when the message is being sent.
	 * @param {jQuery object} htmlElem
	 * @param {jQuery object} signatureAnchor
	 */
	addPrivateMarkerToMessageBody(htmlElem, signatureAnchor) {
		return;
		if (Settings.PrivateMessagesEmail) {
			const markerText = TextUtils.i18n('%MODULENAME%/LABEL_PRIVATE_MESSAGE_MARKER', {PRIVATE_MARKER: Settings.PrivateMessagesEmail});
			$(`<br/><div style="font-size: smaller">${markerText}</div>`).insertAfter(signatureAnchor);
		}
	},

	/**
	 * Called only when the message is being sent.
	 * @param {object} parameters 
	 */
	correctPrivateMessageParameters(parameters) {
		return;
		if (Settings.PrivateMessagesEmail && !parameters.Subject.includes(`[${Settings.PrivateMessagesEmail}]`)) {
			parameters.Subject = `${parameters.Subject} [${Settings.PrivateMessagesEmail}]`;
		}
	},

	/**
	 * Called during saving and sending a message.
	 * @param {object} parameters 
	 * @returns 
	 */
	addPrivateMessageHeaderToParameters(parameters) {
		return;
		if (!this.hasPrivateAccount()) {
			return;
		}
		if (!parameters.CustomHeaders) {
			parameters.CustomHeaders = {};
		}
		parameters.CustomHeaders['X-Private-Message-Sender'] = this.getPrivateAccountEmail();
	},

	isPrivateEmailAddress(sEmailAddress) {
		return false;
		return /.+\.[\d]+@.+/.test(sEmailAddress);
	},

	isPrivateMessage(message) {
		return false;
		const matches = getPrivateMessageMatches(message);
		return matches.length > 0;
	},

	isMinePrivateMessage(message) {
		return true;
		if (!Settings.AllowPrivateMessages) {
			return false;
		}
		const matches = getPrivateMessageMatches(message);
		return matches.includes(Settings.PrivateMessagesEmail);
	},
	
	isAnotherUserPrivateMessage(message) {
		return false;
		let result = true;
		if (message) {
			const matches = getPrivateMessageMatches(message);
			const from = [...message.oFrom.aCollection].map(addr => addr.sEmail);

			result = !InformatikSettings.isEmailInternal(from[0] ? from[0] : '')
				&& matches.length > 0
				&& !matches.includes(Settings.PrivateMessagesEmail);
		}
		return result;
	},
};