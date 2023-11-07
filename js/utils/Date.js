'use strict';

var
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	moment = require('moment'),
	DateUtils = {},
	dateFormatForBackEnd  = 'YYYY.MM.DD'
;

DateUtils.formattedDateSearchHighlightedInput = function(inputString) 
{
	const userDateFormatMoment = Utils.getDateFormatForMoment(UserSettings.dateFormat());

	const dateRegex = /date:([^/]*)(\/([^/]*))?/;
	const match = inputString.match(dateRegex);

	let dateStart = '';
	let dateEnd = '';

	if (match) {
		const dateStartMoment = moment(match[1], dateFormatForBackEnd);
		dateStart = dateStartMoment.isValid() ? dateStartMoment.format(userDateFormatMoment) : match[1];

		const dateEndMoment = moment(match[3], dateFormatForBackEnd);
		dateEnd = dateEndMoment.isValid() ? dateEndMoment.format(userDateFormatMoment) : match[3];
	}

	if (!dateStart && !dateEnd) return inputString;

	const regex = /(\w+):(\S+)/g;
	const matches = inputString.match(regex);
	const inputStringSplit = [];

	if (matches) {
		matches.forEach((match) => {
			const parts = match.split(':');
			const secondPart = parts[0] === 'date' ? dateStart + ' - ' + dateEnd : parts[1];
			inputStringSplit.push(parts[0] + ':' + secondPart);
		});
	}

	return inputStringSplit.join(' ');
}

DateUtils.changeDateStartAndDateEndformatForSend = function (dateStartClientFormat, dateEndClientFormat) 
{
	const dateStartMoment = moment(dateStartClientFormat?.trim(), Utils.getDateFormatForMoment(UserSettings.dateFormat()));
	const dateEndMoment = moment(dateEndClientFormat?.trim(), Utils.getDateFormatForMoment(UserSettings.dateFormat()));

	const dateStartServerFormat = dateStartMoment.isValid() && dateStartMoment.format(dateFormatForBackEnd) || '';
	const dateEndServerFormat = dateEndMoment.isValid() && dateEndMoment.format(dateFormatForBackEnd) || '';

	return [dateStartServerFormat, dateEndServerFormat];
}

module.exports = DateUtils;
