'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js')
;

/**
 * @constructor
 * @extends CCustomSearchPaneView
 */
function CCustomSearchPaneView()
{
	this.domToSearchIn = null;
	this.domScrollArea = null;

	this.wordToSearch = ko.observable('');
	this.wordToSearch.subscribe(_.debounce(this.searchInMessage.bind(this, false), 300));
	this.wordToSearchFocused = ko.observable(false);
	this.isOpenedSearch = ko.observable(false);
	this.htmlToSearchIn = null;
	this.foundMatches = ko.observableArray([]);
	this.currentMatchPos = ko.observable(0);
	this.currentSearchTerm = '';

	this.lockHtmlChanges = ko.observable(false);
	
	this.useCustomSearchBound = this.useCustomSearch.bind(this);
	this.useCustomEscSearchBound = this.useCustomEscSearch.bind(this);
}

CCustomSearchPaneView.prototype.ViewTemplate = '%ModuleName%_CustomSearchPaneView';

CCustomSearchPaneView.prototype.customSearchOn = function (domToSearchIn, domScrollArea)
{
	this.domToSearchIn = domToSearchIn;
	this.domScrollArea = domScrollArea;
	this.htmlToSearchIn = null;
	this.closeSearchInMessage();
	$(document).on('keydown', this.useCustomSearchBound);
	$(document).on('keyup', this.useCustomEscSearchBound);

	this.domToSearchIn.bind('DOMNodeInserted', function() {
		if (!this.lockHtmlChanges()) {
			if (this.isOpenedSearch()) {
				setTimeout(function () {
					this.searchInMessage(true);
				}.bind(this), 100);
			} else {
				this.wordToSearch('');
			}
		}
		this.lockHtmlChanges(false);
	}.bind(this));
};

CCustomSearchPaneView.prototype.customSearchOff = function ()
{
	this.htmlToSearchIn = null;
	this.wordToSearch('');
	this.closeSearchInMessage();
	$(document).off('keydown', this.useCustomSearchBound);
	$(document).off('keyup', this.useCustomEscSearchBound);
};

CCustomSearchPaneView.prototype.useCustomEscSearch = function (ev) {
	if (ev.which === Enums.Key.Esc && this.isOpenedSearch()) {
		ev.preventDefault();
		ev.stopPropagation();
		this.closeSearchInMessage();
	}
};

CCustomSearchPaneView.prototype.useCustomSearch = function (ev) {
	var
		pressedF = ev.which === Enums.Key.f,
		pressedG = ev.which === Enums.Key.g,
		pressedF3 = ev.which === Enums.Key.F3
	;
	if (ev.ctrlKey && pressedF) {
		ev.preventDefault();
		ev.stopPropagation();
		this.openSearchInMessage();
	}
	if (pressedF3 || ev.ctrlKey && pressedG) {
		ev.preventDefault();
		ev.stopPropagation();
		if (this.isOpenedSearch()) {
			if (ev.shiftKey) {
				this.highlightPrevSearchInMessage();
			} else {
				this.highlightNextSearchInMessage();
			}
		} else {
			this.openSearchInMessage();
		}
	}
};

CCustomSearchPaneView.prototype.clearSearchInMessage = function ()
{
	this.foundMatches([]);
	this.currentMatchPos(0);
	this.currentSearchTerm = '';
};

CCustomSearchPaneView.prototype.openSearchInMessage = function ()
{
	if (!this.isOpenedSearch()) {
		this.clearSearchInMessage();
		this.htmlToSearchIn = null;
		this.isOpenedSearch(true);
	}
	this.wordToSearchFocused(true);
	this.searchInMessage(false);
};

CCustomSearchPaneView.prototype.closeSearchInMessage = function ()
{
	if (this.htmlToSearchIn !== null) {
		this.setHtml(this.htmlToSearchIn);
	}
	this.clearSearchInMessage();
	this.isOpenedSearch(false);
};

CCustomSearchPaneView.prototype.setHtml = function (html)
{
	this.lockHtmlChanges(true);
	this.domToSearchIn.html(html);
};

CCustomSearchPaneView.prototype.searchInMessage = function (repeatSearch)
{
	var searchTerm = this.wordToSearch();
    if (searchTerm.length > 0) {
		var htmlToSearchIn = (repeatSearch || this.htmlToSearchIn === null)
							 ? this.domToSearchIn.html()
							 : this.htmlToSearchIn;
		this.htmlToSearchIn = htmlToSearchIn;

        var searchTermRegEx = new RegExp('(?![^<]*>)(' + searchTerm + ')', "ig");
		this.setHtml(htmlToSearchIn.replace(searchTermRegEx, '<span class="match">$1</span>'));
		this.foundMatches(this.domToSearchIn.find('.match'));
		if (!repeatSearch || this.currentMatchPos() >= this.foundMatches().length) {
			this.currentMatchPos(0);
		}
		this.currentSearchTerm = searchTerm;
		if (this.foundMatches().length > 0) {
			this.highlightCurrentMatchInMessage();
		} else {
			this.clearSearchInMessage();
			this.setHtml(this.htmlToSearchIn);
		}
    } else if (this.htmlToSearchIn !== null) {
		this.clearSearchInMessage();
		this.setHtml(this.htmlToSearchIn);
	}
};

CCustomSearchPaneView.prototype.highlightPrevSearchInMessage = function ()
{
	var currentMatchPos = this.currentMatchPos() - 1;
	if (currentMatchPos < 0) {
		currentMatchPos = this.foundMatches().length - 1;
	}
	this.currentMatchPos(currentMatchPos);

	this.highlightCurrentMatchInMessage();
};

CCustomSearchPaneView.prototype.highlightNextSearchInMessage = function ()
{
	var currentMatchPos = this.currentMatchPos() + 1;
	if (currentMatchPos >= this.foundMatches().length) {
		currentMatchPos = 0;
	}
	this.currentMatchPos(currentMatchPos);

	this.highlightCurrentMatchInMessage();
};

CCustomSearchPaneView.prototype.highlightCurrentMatchInMessage = function ()
{
	this.foundMatches().removeClass('highlighted');
	var
		currentMatch = this.foundMatches().eq(this.currentMatchPos()),
		scrollAreaTop = this.domScrollArea.offset().top,
		currentMatchTop = currentMatch.offset().top
	;
	currentMatch.addClass('highlighted');
	if (currentMatchTop < scrollAreaTop || currentMatchTop > (scrollAreaTop + this.domScrollArea.height() - 100)) {
		this.domScrollArea.animate({
			scrollTop: this.domScrollArea.scrollTop() + currentMatchTop - scrollAreaTop
		}, 300);
	}
};

module.exports = CCustomSearchPaneView;
