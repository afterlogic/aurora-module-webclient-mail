'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	
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
	
	this.currentMessage.subscribe(function () {
		if (!this.currentMessage())
		{
			this.closePopup();
		}
	}, this);

	
	this.fPreventBackspace = function (ev) {
		var
			bBackspace = ev.which === $.ui.keyCode.BACKSPACE,
			bInput = ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA',
			bEditableDiv = ev.target.tagName === 'DIV' && $(ev.target).attr('contenteditable') === 'true'
		;
		
		if (bBackspace && !bInput && !bEditableDiv)
		{
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
};

/**
 * @param {Array} aParams
 */
CMessagePanePopup.prototype.onOpen = function (aParams)
{
	aParams = aParams || [];
	this.onRoute(aParams);
	this.preventBackspaceOn();
};

CMessagePanePopup.prototype.saveAndClose = function ()
{
	if (this.hasUnsavedChanges())
	{
		this.saveCommand();
	}

	// closePopup method will remove the entire popup so click event for span.item.save_and_close won't be fired and tooltip won't be hidden.
	// So we postpone it for a bit.
	setTimeout(this.closePopup.bind(this), 0);
};

CMessagePanePopup.prototype.cancelPopup = function ()
{
	this.closePopup();
};

/**
 * @param {Object} oEvent
 */
CMessagePanePopup.prototype.onEscHandler = function (oEvent)
{
	this.closePopup();
};

module.exports = new CMessagePanePopup();
