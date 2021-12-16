'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
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
	
	this.wordToSearchInMessage = ko.observable('');
	this.wordToSearchInMessageFocused = ko.observable(false);
	this.isOpenedSearchInMessage = ko.observable(false);
	this.messageHtml = null;
	this.messageText = null;
	this.foundMatches = ko.observableArray([]);
	this.currentMatchPos = ko.observable(0);
	this.currentSearchTerm = '';
	
	this.currentMessage.subscribe(function () {
		if (!this.currentMessage()) {
			this.close();
		}
	}, this);

	this.useCustomSearchBound = this.useCustomSearch.bind(this);
	
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

CMessagePanePopup.prototype.customSearchOn = function ()
{
	this.messageHtml = null;
	this.messageText = null;
	this.closeSearchInMessage();
	$(document).on('keydown', this.useCustomSearchBound);
};

CMessagePanePopup.prototype.customSearchOff = function ()
{
	this.messageHtml = null;
	this.messageText = null;
	this.closeSearchInMessage();
	$(document).off('keydown', this.useCustomSearchBound);
};

CMessagePanePopup.prototype.useCustomSearch = function (ev) {
	var
		pressedF = ev.which === Enums.Key.f,
		isInsideInput = ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA',
		isInsideEditableDiv = ev.target.tagName === 'DIV' && $(ev.target).attr('contenteditable') === 'true'
	;

	if (ev.ctrlKey && pressedF && !isInsideInput && !isInsideEditableDiv) {
		ev.preventDefault();
		ev.stopPropagation();
		this.openSearchInMessage();
	}
};

CMessagePanePopup.prototype.openSearchInMessage = function ()
{
	this.foundMatches([]);
	this.currentMatchPos(0);
	this.currentSearchTerm = '';
	this.isOpenedSearchInMessage(true);
	this.wordToSearchInMessage('');
	this.wordToSearchInMessageFocused(true);
};

CMessagePanePopup.prototype.closeSearchInMessage = function ()
{
	this.isOpenedSearchInMessage(false);
};

CMessagePanePopup.prototype.searchInMessage = function ()
{
	var
		searchTerm = this.wordToSearchInMessage(),
		areaToSearch = this.domTextBody()
	;
    if (searchTerm && areaToSearch) {
		if (this.currentSearchTerm === searchTerm) {
			this.highlightNextSearchInMessage();
			return;
		}

		var
			messageHtml = this.messageHtml === null ? areaToSearch.html() : this.messageHtml,
			messageText = this.messageText === null ? areaToSearch.text() : this.messageText
		;
		this.messageHtml = messageHtml;
		this.messageText = messageText;

        //var wholeWordOnly = new RegExp("\\g"+searchTerm+"\\g","ig"); //matches whole word only
        //var anyCharacter = new RegExp("\\g["+searchTerm+"]\\g","ig"); //matches any word with any of search chars characters
        var searchTermRegEx = new RegExp(searchTerm, "ig");
        var matches = messageText.match(searchTermRegEx);

        if (matches !== null && matches.length > 0) {
            areaToSearch.html(messageHtml.replace(searchTermRegEx, '<span class="match">' + searchTerm + '</span>'));
			
			this.foundMatches(areaToSearch.find('.match'));
			this.currentMatchPos(0);
			this.currentSearchTerm = searchTerm;
			if (this.foundMatches().length > 0) {
				this.highlightCurrentMatchInMessage();
			}
            return true;
        }
    }
    return false;	
};

CMessagePanePopup.prototype.highlightPrevSearchInMessage = function ()
{
	var currentMatchPos = this.currentMatchPos() - 1;
	if (currentMatchPos < 0) {
		currentMatchPos = this.foundMatches().length - 1;
	}
	this.currentMatchPos(currentMatchPos);

	this.highlightCurrentMatchInMessage();
};

CMessagePanePopup.prototype.highlightNextSearchInMessage = function ()
{
	var currentMatchPos = this.currentMatchPos() + 1;
	if (currentMatchPos >= this.foundMatches().length) {
		currentMatchPos = 0;
	}
	this.currentMatchPos(currentMatchPos);

	this.highlightCurrentMatchInMessage();
};

CMessagePanePopup.prototype.highlightCurrentMatchInMessage = function ()
{
	this.foundMatches().removeClass('highlighted');
	var
		currentMatch = this.foundMatches().eq(this.currentMatchPos()),
		scrollAreaTop = this.domTextBodyScrollArea().offset().top,
		currentMatchTop = currentMatch.offset().top
	;
	currentMatch.addClass('highlighted');
	if (currentMatchTop < scrollAreaTop || currentMatchTop > (scrollAreaTop + this.domTextBodyScrollArea().height())) {
		this.domTextBodyScrollArea().animate({
			scrollTop: this.domTextBodyScrollArea().scrollTop() + currentMatchTop - scrollAreaTop
		}, 300);
	}
};

CMessagePanePopup.prototype.onClose = function ()
{
	this.preventBackspaceOff();
	this.customSearchOff();
};

/**
 * @param {Array} aParams
 */
CMessagePanePopup.prototype.onOpen = function (aParams)
{
	aParams = aParams || [];
	this.onRoute(aParams);
	this.preventBackspaceOn();
	this.customSearchOn();
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
	this.close();
};

module.exports = new CMessagePanePopup();
