'use strict';

const
	App = require('%PathToCoreWebclientModule%/js/App.js')
;

module.exports = {
	isPrivateEmailAccount(email) {
		return /.+\.[\d]+@.+/.test(email);
	},

	getPrivateAccount() {
		const AccountList = require('modules/%ModuleName%/js/AccountList.js');
		return AccountList.getPrivateAccount();
	}
};
