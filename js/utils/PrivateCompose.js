'use strict';

const
	App = require('%PathToCoreWebclientModule%/js/App.js'),

	AccountList = require('modules/%ModuleName%/js/AccountList.js')
;

module.exports = {
	getPrivateAccount() {
		// Find the alias (or account) with email similar to user PulicId (but with a hash after account name)
		// Temporary
		return AccountList.collection().find(account => account.email() === App.getUserPublicId());
	}
};
