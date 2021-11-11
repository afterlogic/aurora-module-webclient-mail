'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	WindowOpener = require('%PathToCoreWebclientModule%/js/WindowOpener.js'),

	InformatikMailUtils = {}
;

function _getMessagePrintHeaderBox(sFrom, sTo, sCc, sBcc, sDate, sSubject, sProject, aAttachments)
{
	var sHeaderBox = '<br/><table style="width: 100%;background: #eef3fd;border: solid 1px #ccc;border-collapse: collapse;border-spacing: 0;font: normal 10pt Helvetica, Tahoma, Arial, sans-serif">\n' +
		'   <tbody>\n';

	sHeaderBox += '<tr>\n<td style="padding: 8px;width: 1%;border-bottom: solid 1px #ccc;vertical-align: top">' +
		TextUtils.i18n('MAILWEBCLIENT/LABEL_FROM') +
		'</td>\n' +
		'<td style="padding: 8px;border-bottom: solid 1px #ccc;word-break: break-word;vertical-align: top">' + 
		TextUtils.encodeHtml(sFrom) + '</td>\n</tr>\n';

	if (sTo)
	{
		sHeaderBox += '<tr>\n<td style="padding: 8px;width: 1%;border-bottom: solid 1px #ccc;vertical-align: top">' +
			TextUtils.i18n('MAILWEBCLIENT/LABEL_TO') +
			'</td>\n' +
			'<td style="padding: 8px;border-bottom: solid 1px #ccc;word-break: break-word;vertical-align: top">' + 
			TextUtils.encodeHtml(sTo) + '</td>\n</tr>\n';
	}

	if (sCc) {
		sHeaderBox += '<tr>\n<td style="padding: 8px;width: 1%;border-bottom: solid 1px #ccc;vertical-align: top">' +
			TextUtils.i18n('COREWEBCLIENT/LABEL_CC') +
			'</td>\n' +
			'<td style="padding: 8px;border-bottom: solid 1px #ccc;word-break: break-word;vertical-align: top">' + 
			TextUtils.encodeHtml(sCc) + '</td>\n</tr>\n';
	}

	if (sBcc) {
		sHeaderBox += '<tr>\n<td style="padding: 8px;width: 1%;border-bottom: solid 1px #ccc;vertical-align: top">' +
			TextUtils.i18n('COREWEBCLIENT/LABEL_BCC') +
			'</td>\n' +
			'<td style="padding: 8px;border-bottom: solid 1px #ccc;word-break: break-word;vertical-align: top">' + 
			TextUtils.encodeHtml(sBcc) + '</td>\n</tr>\n';
	}

	if (sDate)
	{
		sHeaderBox += '<tr>\n<td style="padding: 8px;width: 1%;border-bottom: solid 1px #ccc;vertical-align: top">' +
			TextUtils.i18n('MAILWEBCLIENT/LABEL_DATE') +
			'</td>\n' +
			'<td style="padding: 8px;border-bottom: solid 1px #ccc;word-break: break-word;vertical-align: top">' + 
			TextUtils.encodeHtml(sDate) + '</td>\n</tr>\n';
	}

	sHeaderBox += '<tr>\n<td style="padding: 8px;width: 1%;border-bottom: solid 1px #ccc;vertical-align: top">' +
		TextUtils.i18n('MAILWEBCLIENT/LABEL_SUBJECT') +
		'</td>\n' +
		'<td style="padding: 8px;border-bottom: solid 1px #ccc;word-break: break-word;vertical-align: top">' + 
		TextUtils.encodeHtml(sSubject) + '</td>\n</tr>\n';

	if (sProject)
	{
		sHeaderBox += '<tr>\n<td style="padding: 8px;width: 1%;border-bottom: solid 1px #ccc;vertical-align: top">' +
			TextUtils.i18n('INFORMATIKPROJECTS/LABEL_SELECT_PROJECT') +
			'</td>\n' +
			'<td style="padding: 8px;border-bottom: solid 1px #ccc;word-break: break-word;vertical-align: top">' + 
			TextUtils.encodeHtml(sProject) + '</td>\n</tr>\n';
	}

	if (aAttachments.length > 0) {
		sHeaderBox += '<tr>\n<td style="padding: 8px;width: 1%;border-bottom: solid 1px #ccc;vertical-align: top">' +
			TextUtils.i18n('MAILWEBCLIENT/LABEL_ATTACHMENTS') +
			'</td>\n' +
			'<td style="padding: 8px;border-bottom: solid 1px #ccc;word-break: break-word;vertical-align: top">';

		_.each(aAttachments, function (sAttachment) {
			sHeaderBox += '<div>' + TextUtils.encodeHtml(sAttachment) + '</div>';
		});

		sHeaderBox += '</td>\n</tr>\n';
	}

	sHeaderBox += '   </tbody>\n' +
		'</table><br/>';
	
	return sHeaderBox;
}

InformatikMailUtils.printMessageFromCompose = function (oDomText, sFrom, sTo, sCc, sBcc, sDate, sSubject, sProject, aAttachments)
{
	var
		oWin = WindowOpener.open('', sSubject + '-print'),
		sHtml = ''
	;

	if (oWin) {
		var sMessagePrintHeaderBox = _getMessagePrintHeaderBox(sFrom, sTo, sCc, sBcc, sDate, sSubject, sProject, aAttachments);
		oDomText.prepend(sMessagePrintHeaderBox);

		sHtml = oDomText.wrap('<p>').parent().html();
		$(oWin.document.body).html(sHtml);
		oWin.print();
	}
};

module.exports = InformatikMailUtils;
