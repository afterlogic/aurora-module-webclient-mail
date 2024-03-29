'use strict';

var
	_ = require('underscore'),
	Enums = {}
;

/**
 * @enum {string}
 */
Enums.FolderFilter = {
	'Flagged': 'flagged',
	'Unseen': 'unseen'
};

/**
 * @enum {number}
 */
Enums.FolderTypes = {
	'Inbox': 1,
	'Sent': 2,
	'Drafts': 3,
	'Spam': 4,
	'Trash': 5,
	'Virus': 6,
	'Starred': 7,
	'Template': 8,
	'System': 9,
	'User': 10,
	'AllInboxes': 11
};

Enums.SearchFoldersMode = {
	Current: '',
	Sub: 'sub',
	All: 'all'
};

/**
 * @enum {number}
 */
Enums.Importance = {
	'Low': 5,
	'Normal': 3,
	'High': 1
};

/**
 * @enum {number}
 */
Enums.Sensitivity = {
	'Nothing': 0,
	'Confidential': 1,
	'Private': 2,
	'Personal': 3
};

/**
 * @enum {string}
 */
Enums.AnotherMessageComposedAnswer = {
	'Discard': 'Discard',
	'SaveAsDraft': 'SaveAsDraft',
	'Cancel': 'Cancel'
};

/**
 * @enum {string}
 */
Enums.ReplyType = {
	'Reply': 'reply',
	'ReplyAll': 'reply-all',
	'Resend': 'resend',
	'Forward': 'forward',
	'ForwardAsAttach': 'eml'
};

Enums.UseSignature = {
	'Off': '0',
	'On': '1'
};

Enums.MailErrors = {
	'CannotMoveMessageQuota': 4008
};

/**
 * @enum {string}
 */
Enums.ServerOwnerType = {
	'Account': 'account',
	'Tenant': 'tenant',
	'SuperAdmin': 'superadmin'
};

/**
 * @enum {string}
 */
Enums.StarredMessagesSource = {
	InboxOnly: 'inbox_only',
	AllFolders: 'all_folders'
};

if (typeof window.Enums === 'undefined')
{
	window.Enums = {};
}

_.extendOwn(window.Enums, Enums);
