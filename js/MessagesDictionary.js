'use strict';

var
	_ = require('underscore'),
//	moment = require('moment'),
	
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js')
;

function CMessagesDictionary()
{
	this.oMessages = {};
	
//	setInterval(this.checkCount.bind(this), 30000);
}

CMessagesDictionary.prototype.get = function (aKey)
{
	var sKey = JSON.stringify(aKey);
	return this.oMessages[sKey];
};

CMessagesDictionary.prototype.set = function (aKey, oMessage)
{
	var sKey = JSON.stringify(aKey);
	this.oMessages[sKey] = oMessage;
};

//CMessagesDictionary.prototype.checkCount = function ()
//{
//	var
//		iCount = _.size(this.oMessages),
//		iPrevNow = moment().add(-1, 'minutes').unix()
//	;
//	if (iCount > 10)
//	{
//		console.log('iCount', iCount);
//		_.each(this.oMessages, function (oMessage, sKey) {
//			console.log(oMessage.iLastAccessTime !== 0 && oMessage.iLastAccessTime < iPrevNow, oMessage.iLastAccessTime, iPrevNow);
//			if (oMessage.iLastAccessTime !== 0 && oMessage.iLastAccessTime < iPrevNow)
//			{
//				Utils.destroyObjectWithObservables(this.oMessages, sKey);
//			}
//		});
//		console.log('size', _.size(this.oMessages));
//	}
//};

CMessagesDictionary.prototype.remove = function (aKey)
{
	var sKey = JSON.stringify(aKey);
	Utils.destroyObjectWithObservables(this.oMessages, sKey);
};

CMessagesDictionary.prototype.updateMomentDates = function ()
{
	_.each(this.oMessages, function (oMessage) {
		oMessage.updateMomentDate();
	}, this);
};

module.exports = new CMessagesDictionary();
