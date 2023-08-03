'use strict';

var
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	moment = require('moment');
;

/**
 * @constructor
 */
function CAutoresponderModel()
{
	this.iAccountId = 0;

	this.enable = false;
	this.subject = '';
	this.message = '';
	this.scheduled = false;
	this.start = null;
	this.end = null;
}

/**
 * @param {number} iAccountId
 * @param {Object} oData
 */
CAutoresponderModel.prototype.parse = function (iAccountId, oData)
{
	this.iAccountId = iAccountId;

	this.enable = !!oData.Enable;
	this.subject = Types.pString(oData.Subject);
	this.message = Types.pString(oData.Message);
	
	this.scheduled = !!oData.Scheduled;
	// this.start = moment.unix(oData.Start);
	// if (oData.End != null) {
	// 	this.end = moment.unix(oData.End);
	// }
	if (oData.Start) {
		this.start = Types.pInt(oData.Start);
	}
	if (oData.End) {
		this.end = Types.pInt(oData.End);
	}
};

module.exports = CAutoresponderModel;