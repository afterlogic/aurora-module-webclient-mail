'use strict';

const
	ko = require('knockout')
;

ko.subscribable.fn.subscribeExtended = function (callback) {
	let oldValue;
	this.subscribe((_oldValue) => {
		oldValue = _oldValue;
	}, this, 'beforeChange');
	this.subscribe((newValue) => {
		callback(newValue, oldValue);
	});
};
