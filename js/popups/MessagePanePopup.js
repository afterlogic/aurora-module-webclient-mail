'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	
	CCustomSearchPaneView = require('modules/%ModuleName%/js/views/CCustomSearchPaneView.js'),
	CMessagePaneView = require('modules/%ModuleName%/js/views/CMessagePaneView.js')
;

/**
 * @constructor
 * @extends CMessagePanePopup
 */
function CMessagePanePopup()
{
	CAbstractPopup.call(this);
	
	CMessagePaneView.call(this);
	
	this.customSearchPaneView = new CCustomSearchPaneView();
	
	this.currentMessage.subscribe(function () {
		if (!this.currentMessage()) {
			this.close();
		}
	}, this);

	this.fPreventBackspace = function (ev) {
		var
			bBackspace = ev.which === $.ui.keyCode.BACKSPACE,
			bInput = ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA',
			bEditableDiv = ev.target.tagName === 'DIV' && $(ev.target).attr('contenteditable') === 'true'
		;
		
		if (bBackspace && !bInput && !bEditableDiv) {
			ev.preventDefault();
			ev.stopPropagation();
		}
	};
}

_.extendOwn(CMessagePanePopup.prototype, CAbstractPopup.prototype);

_.extendOwn(CMessagePanePopup.prototype, CMessagePaneView.prototype);

CMessagePanePopup.prototype.PopupTemplate = '%ModuleName%_MessagePanePopup';

CMessagePanePopup.prototype.preventBackspaceOn = function ()
{
	$(document).on('keydown', this.fPreventBackspace);
};

CMessagePanePopup.prototype.preventBackspaceOff = function ()
{
	$(document).off('keydown', this.fPreventBackspace);
};

CMessagePanePopup.prototype.onClose = function ()
{
	this.preventBackspaceOff();
	this.customSearchPaneView.customSearchOff();
};

/**
 * @param {Array} aParams
 */
CMessagePanePopup.prototype.onOpen = function (aParams)
{
	aParams = aParams || [];
	this.onRoute(aParams);
	this.preventBackspaceOn();
	this.customSearchPaneView.customSearchOn(this.domTextBody(), this.domTextBodyScrollArea());
	this.domTextBodyScrollArea().focus();
};

CMessagePanePopup.prototype.cancelPopup = function ()
{
	this.close();
};

/**
 * @param {Object} oEvent
 */
CMessagePanePopup.prototype.onEscHandler = function (oEvent)
{
	if (!this.customSearchPaneView.isOpenedSearch()) {
		this.close();
	}
};

module.exports = new CMessagePanePopup();
