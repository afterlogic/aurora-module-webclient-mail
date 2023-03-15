'use strict';

const
	App = require('%PathToCoreWebclientModule%/js/App.js')
;

module.exports = {
	isPrivateEmailAccount(email) {
//		return /.+\.[\d]+@.+/.test(email);
		return email === 'test2@afterlogic.com';
	},

	getMessageReplyFromAccountId(recipients, accountId) {
		const privateAccount = this.getPrivateAccount();
		const privateRecipient = privateAccount && recipients.find(addr => addr.sEmail === privateAccount.email());
		if (privateRecipient) {
			return privateAccount.id();
		}
		return accountId;
	},

	getPrivateAccount() {
		const AccountList = require('modules/%ModuleName%/js/AccountList.js');
		return AccountList.getPrivateAccount();
	}
};
