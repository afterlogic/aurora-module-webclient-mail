'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	CFetcherModel = require('modules/%ModuleName%/js/models/CFetcherModel.js')
;

/**
 * @constructor
 */
function CFetcherListModel()
{
	this.collection = ko.observableArray([]);
}

/**
 * @param {Array} aData
 */
CFetcherListModel.prototype.parse = function (aData)
{
	var aParsedCollection = _.map(aData, function (oData) {
		var oFetcher = new CFetcherModel();
		oFetcher.parse(oData);
		return oFetcher;
	});

	this.collection(aParsedCollection);
};

/**
 * @param {number} iFetcherId
 * @returns {boolean}
 */
CFetcherListModel.prototype.hasFetcher = function (iFetcherId)
{
	return !!this.getFetcher(iFetcherId);
};

/**
 * @param {number} iFetcherId
 * @returns {Object|null}
 */
CFetcherListModel.prototype.getFetcher = function (iFetcherId)
{
	var oFetcher = _.find(this.collection(), function (oFetcher) {
		return oFetcher.id() === iFetcherId;
	});

	return oFetcher || null;
};

module.exports = CFetcherListModel;