"use strict";
var _ = require("underscore"),
	$ = require("jquery"),
	ko = require("knockout"),
	AddressUtils = require("%PathToCoreWebclientModule%/js/utils/Address.js"),
	TextUtils = require("%PathToCoreWebclientModule%/js/utils/Text.js"),
	Types = require("%PathToCoreWebclientModule%/js/utils/Types.js"),
	App = require("%PathToCoreWebclientModule%/js/App.js"),
	Browser = require("%PathToCoreWebclientModule%/js/Browser.js"),
	CJua = require("%PathToCoreWebclientModule%/js/CJua.js"),
	UserSettings = require("%PathToCoreWebclientModule%/js/Settings.js"),
	Popups = require("%PathToCoreWebclientModule%/js/Popups.js"),
	AlertPopup = require("%PathToCoreWebclientModule%/js/popups/AlertPopup.js"),
	CAttachmentModel = require("modules/%ModuleName%/js/models/CAttachmentModel.js"),

	MailCache = require("modules/%ModuleName%/js/Cache.js"),
	Settings = require("modules/%ModuleName%/js/Settings.js"),
	CColorPickerView = require("modules/%ModuleName%/js/views/CColorPickerView.js")
;

require("modules/%ModuleName%/js/vendors/summernote/summernote-lite.js");
require("modules/%ModuleName%/js/vendors/summernote/summernote-lite.css");

const summernoteLangMap = {
	English: 'en-US',
	German: 'de-DE'
};
const summernoteLang = summernoteLangMap[UserSettings.Language] || summernoteLangMap.English;
require(`modules/%ModuleName%/js/vendors/summernote/lang/summernote-${summernoteLang}.min.js`);

/**
 * @constructor
 * @param {boolean} bInsertImageAsBase64
 * @param {Object=} oParent
 */
function CHtmlEditorView(bInsertImageAsBase64, oParent) {
	this.oParent = oParent;

	this.oEditor = null;
	this.editorId = "editorId" + Math.random().toString().replace(".", "");
	this.textFocused = ko.observable(false);
	this.workareaDom = ko.observable();
	this.editorDom = ko.observable();
	this.uploaderAreaDom = ko.observable();
	this.editorUploaderBodyDragOver = ko.observable(false);

	this.htmlEditorDom = ko.observable();
	this.toolbarDom = ko.observable();
	this.colorPickerDropdownDom = ko.observable();
	this.insertLinkDropdownDom = ko.observable();
	this.insertImageDropdownDom = ko.observable();

	this.isFWBold = ko.observable(false);
	this.isFSItalic = ko.observable(false);
	this.isTDUnderline = ko.observable(false);
	this.isTDStrikeThrough = ko.observable(false);
	this.isEnumeration = ko.observable(false);
	this.isBullets = ko.observable(false);
	this.htmlSize = ko.observable(0);

	this.isEnable = ko.observable(true);
	this.isEnable.subscribe(function () {
		if (this.oCrea) {
			this.oCrea.setEditable(this.isEnable());
		}
	}, this);

	this.bInsertImageAsBase64 = bInsertImageAsBase64;
	this.bAllowFileUpload = !(bInsertImageAsBase64 && window.File === undefined);
	this.bAllowInsertImage = Settings.AllowInsertImage;
	this.bAllowHorizontalLineButton = Settings.AllowHorizontalLineButton;
	this.lockFontSubscribing = ko.observable(false);
	this.bAllowImageDragAndDrop = !Browser.ie10AndAbove;

	this.aFontNames = [
		"Arial",
		"Arial Black",
		"Courier New",
		"Tahoma",
		"Verdana",
	];
	this.sDefaultFont = Settings.DefaultFontName;
	this.correctFontFromSettings();
	this.selectedFont = ko.observable("");
	this.selectedFont.subscribe(function () {
		if (this.oCrea && !this.lockFontSubscribing() && !this.inactive()) {
			this.oCrea.fontName(this.selectedFont());
		}
	}, this);

	this.iDefaultSize = Settings.DefaultFontSize;
	this.selectedSize = ko.observable(0);
	this.selectedSize.subscribe(function () {
		if (this.oCrea && !this.lockFontSubscribing() && !this.inactive()) {
			this.oCrea.fontSize(this.selectedSize());
		}
	}, this);

	this.visibleInsertLinkPopup = ko.observable(false);
	this.linkForInsert = ko.observable("");
	this.linkFocused = ko.observable(false);
	this.visibleLinkPopup = ko.observable(false);
	this.linkPopupDom = ko.observable(null);
	this.linkHrefDom = ko.observable(null);
	this.linkHref = ko.observable("");
	this.visibleLinkHref = ko.observable(false);

	this.isDialogOpen = ko.observable(false);
	this.visibleImagePopup = ko.observable(false);
	this.visibleImagePopup.subscribe(function () {
		this.onImageOut();
	}, this);
	this.imagePopupTop = ko.observable(0);
	this.imagePopupLeft = ko.observable(0);
	this.imageSelected = ko.observable(false);

	this.tooltipText = ko.observable("");
	this.tooltipPopupTop = ko.observable(0);
	this.tooltipPopupLeft = ko.observable(0);

	this.visibleInsertImagePopup = ko.observable(false);
	this.imageUploaderButton = ko.observable(null);
	this.aUploadedImagesData = [];
	this.imagePathFromWeb = ko.observable("");
	this.visibleTemplatePopup = ko.observable(false);

	this.visibleFontColorPopup = ko.observable(false);
	this.oFontColorPickerView = new CColorPickerView(
		TextUtils.i18n("%MODULENAME%/LABEL_TEXT_COLOR"),
		this.setTextColorFromPopup,
		this
	);
	this.oBackColorPickerView = new CColorPickerView(
		TextUtils.i18n("%MODULENAME%/LABEL_BACKGROUND_COLOR"),
		this.setBackColorFromPopup,
		this
	);

	this.inactive = ko.observable(false);
	this.sPlaceholderText = "";

	this.bAllowChangeInputDirection =
		UserSettings.IsRTL || Settings.AllowChangeInputDirection;
	this.disableEdit = ko.observable(false);

	this.textChanged = ko.observable(false);

	this.actualTextСhanged = ko.observable(false);

	this.templates = ko.observableArray([]);

	if (Settings.AllowInsertTemplateOnCompose) {
		App.subscribeEvent(
			"%ModuleName%::ParseMessagesBodies::after",
			_.bind(function (oParameters) {
				if (
					oParameters.AccountID === MailCache.currentAccountId() &&
					oParameters.Folder === MailCache.getTemplateFolder()
				) {
					this.fillTemplates();
				}
			}, this)
		);
	}
}

CHtmlEditorView.prototype.ViewTemplate = "%ModuleName%_SummernoteEditorView";

CHtmlEditorView.prototype.onClose = function () {
	if (this.oEditor) {
		this.oEditor.summernote('destroy');
		this.oEditor = null;
	}
};

/**
 * @param {string} sText
 * @param {boolean} bPlain
 * @param {string} sTabIndex
 * @param {string} sPlaceholderText
 */
CHtmlEditorView.prototype.init = function (
	sText,
	bPlain,
	sTabIndex,
	sPlaceholderText
) {
	this.sPlaceholderText = sPlaceholderText || "";

	if (this.oEditor) {
		this.oEditor.summernote("destroy");
		this.oEditor = null;
		// in case if knockoutjs destroyed dom element with html editor
		// if ()
		// {
		// this.oEditor.start(this.isEnable());
		// this.editorUploader must be re-initialized because compose popup is destroyed after it is closed
		// this.initEditorUploader();
		// }
	}

	if (!this.oEditor) {
		$(document.body).on(
			"click",
			_.bind(function (oEvent) {
				var oParent = $(oEvent.target).parents("span.dropdown_helper");
				if (oParent.length === 0) {
					this.closeAllPopups(true);
				}
			}, this)
		);

		this.initUploader(); // uploads inline images
		this.initEditorUploader(); // uploads non-images using parent methods

		this.oEditor = $(`#${this.editorId}`);
		this.oEditor.summernote({
			lang: summernoteLang,
			toolbar: [
				["history", ["undo", "redo"]],
				["style", ["bold", "italic", "underline"]],
				["font", ["fontname", "fontsize"]],
				["color", ["color"]],
				["para", ["ul", "ol", "paragraph"]],
				["misc", ["table", "link", "picture", "clear"]],
			],
			fontNames: ["Arial", "Tahoma", "Verdana", "Courier New"],
			// addDefaultFonts: false,
			dialogsInBody: true,
			shortcuts: false,
			disableResizeEditor: true,
			followingToolbar: false, //true makes toolbas sticky
			popover: {
				image: [
					[
						"image",
						["resizeFull", "resizeHalf", "resizeQuarter", "resizeNone"],
					],
					["remove", ["removeMedia"]],
				],
				link: [["link", ["linkDialogShow", "unlink"]]],
				table: [
					["add", ["addRowDown", "addRowUp", "addColLeft", "addColRight"]],
					["delete", ["deleteRow", "deleteCol", "deleteTable"]],
				],
			},
			callbacks: {
				onFocus: _.bind(this.onFocusHandler, this),
				onBlur: (event) => {
					this.isDialogOpen(false);
					this.onBlurHandler(event);
				},
				onDialogShown: () => {
					this.isDialogOpen(true);
				},
				onImageUpload: (files) => {
					Array.from(files).forEach((file) => {
						this.uploadFile(file, this.isDialogOpen());
					});
				},
			},
		});

		// 	font_size_formats: 'Small=10pt Normal=12pt Medium=14pt Large=16pt Big=18pt Huge=24pt'
		// 	// {text: '%MODULENAME%/ACTION_CHOOSE_SMALL_TEXTSIZE', value: '12px'},
		// 	// 	{text: '%MODULENAME%/ACTION_CHOOSE_NORMAL_TEXTSIZE', value: '15px', default: true},
		// 	// 	{text: '%MODULENAME%/ACTION_CHOOSE_LARGE_TEXTSIZE', value: '22px'},
		// 	// font-family: Tahoma; font-size: 15px;
	}

	this.getEditableArea().attr('tabindex', sTabIndex);
	this.clearUndoRedo();
	this.getEditableArea().css('font-family', 'Tahoma');
	this.getEditableArea().css('font-size', '16px');
	this.setText(sText, bPlain);

	this.aUploadedImagesData = [];

	if (Settings.AllowInsertTemplateOnCompose) {
		this.fillTemplates();
	}
};

CHtmlEditorView.prototype.setInactive = function (bInactive) {
	this.inactive(bInactive);
	if (this.inactive()) {
		this.setPlaceholder();
	} else {
		this.removePlaceholder();
	}
};

CHtmlEditorView.prototype.setPlaceholder = function () {
	var sText = this.removeAllTags(this.getText());
	if (sText === "" || sText === "&nbsp;") {
		this.setText("<span>" + this.sPlaceholderText + "</span>");
		if (this.oCrea) {
			this.oCrea.setBlur();
		}
	}
};

CHtmlEditorView.prototype.removePlaceholder = function () {
	var sText = this.oCrea ? this.removeAllTags(this.oCrea.getText(false)) : "";
	if (sText === this.sPlaceholderText) {
		this.setText("");
		if (this.oCrea) {
			this.oCrea.setFocus(true);
		}
	}
};

CHtmlEditorView.prototype.hasOpenedPopup = function () {
	return this.isDialogOpen();
};

CHtmlEditorView.prototype.setDisableEdit = function (bDisableEdit) {
	this.disableEdit(!!bDisableEdit);
};

CHtmlEditorView.prototype.correctFontFromSettings = function () {
	var sDefaultFont = this.sDefaultFont,
		bFound = false;
	_.each(this.aFontNames, function (sFont) {
		if (sFont.toLowerCase() === sDefaultFont.toLowerCase()) {
			sDefaultFont = sFont;
			bFound = true;
		}
	});

	if (bFound) {
		this.sDefaultFont = sDefaultFont;
	} else {
		this.aFontNames.push(sDefaultFont);
	}
};

/**
 * @param {Object} $link
 */
CHtmlEditorView.prototype.showLinkPopup = function ($link) {
	var $workarea = $(this.workareaDom()),
		$composePopup = $workarea.closest(".panel.compose"),
		oWorkareaPos = $workarea.position(),
		oPos = $link.position(),
		iHeight = $link.height(),
		iLeft = Math.round(oPos.left + oWorkareaPos.left),
		iTop = Math.round(oPos.top + iHeight + oWorkareaPos.top);
	this.linkHref($link.attr("href") || $link.text());
	$(this.linkPopupDom()).css({
		left: iLeft,
		top: iTop,
	});
	$(this.linkHrefDom()).css({
		left: iLeft,
		top: iTop,
	});

	if (!Browser.firefox && $composePopup.length === 1) {
		$(this.linkPopupDom()).css({
			"max-width": $composePopup.width() - iLeft - 40 + "px",
			"white-space": "pre-line",
			"word-wrap": "break-word",
		});
	}

	this.visibleLinkPopup(true);
};

CHtmlEditorView.prototype.hideLinkPopup = function () {
	this.visibleLinkPopup(false);
};

CHtmlEditorView.prototype.showChangeLink = function () {
	this.visibleLinkHref(true);
	this.hideLinkPopup();
};

CHtmlEditorView.prototype.changeLink = function () {
	this.oCrea.changeLink(this.linkHref());
	this.hideChangeLink();
};

CHtmlEditorView.prototype.hideChangeLink = function () {
	this.visibleLinkHref(false);
};

/**
 * @param {jQuery} $image
 * @param {Object} oEvent
 */
CHtmlEditorView.prototype.showImagePopup = function ($image, oEvent) {
	var $workarea = $(this.workareaDom()),
		oWorkareaPos = $workarea.position(),
		oWorkareaOffset = $workarea.offset();
	this.imagePopupLeft(
		Math.round(oEvent.pageX + oWorkareaPos.left - oWorkareaOffset.left)
	);
	this.imagePopupTop(
		Math.round(oEvent.pageY + oWorkareaPos.top - oWorkareaOffset.top)
	);

	this.visibleImagePopup(true);
};

CHtmlEditorView.prototype.hideImagePopup = function () {
	this.visibleImagePopup(false);
};

CHtmlEditorView.prototype.resizeImage = function (sSize) {
	var oParams = {
		width: "auto",
		height: "auto",
	};

	switch (sSize) {
		case Enums.HtmlEditorImageSizes.Small:
			oParams.width = "300px";
			break;
		case Enums.HtmlEditorImageSizes.Medium:
			oParams.width = "600px";
			break;
		case Enums.HtmlEditorImageSizes.Large:
			oParams.width = "1200px";
			break;
		case Enums.HtmlEditorImageSizes.Original:
			oParams.width = "auto";
			break;
	}

	this.oCrea.changeCurrentImage(oParams);

	this.visibleImagePopup(false);
};

CHtmlEditorView.prototype.onImageOver = function (oEvent) {
	if (oEvent.target.nodeName === "IMG" && !this.visibleImagePopup()) {
		this.imageSelected(true);

		this.tooltipText(TextUtils.i18n("%MODULENAME%/ACTION_CLICK_TO_EDIT_IMAGE"));

		var self = this,
			$workarea = $(this.workareaDom());
		$workarea.bind("mousemove.image", function (oEvent) {
			var oWorkareaPos = $workarea.position(),
				oWorkareaOffset = $workarea.offset();
			self.tooltipPopupTop(
				Math.round(oEvent.pageY + oWorkareaPos.top - oWorkareaOffset.top)
			);
			self.tooltipPopupLeft(
				Math.round(oEvent.pageX + oWorkareaPos.left - oWorkareaOffset.left)
			);
		});
	}

	return true;
};

CHtmlEditorView.prototype.onImageOut = function (oEvent) {
	if (this.imageSelected()) {
		this.imageSelected(false);

		var $workarea = $(this.workareaDom());
		$workarea.unbind("mousemove.image");
	}

	return true;
};

CHtmlEditorView.prototype.commit = function () {
	this.textChanged(false);
};

/**
 * Fills template list if there is template folder in account.
 * Messages of template folder are requested in Prefetcher.
 */
CHtmlEditorView.prototype.fillTemplates = function () {
	var oFolderList = MailCache.folderList(),
		sTemplateFolder = MailCache.getTemplateFolder(),
		oTemplateFolder = sTemplateFolder
			? oFolderList.getFolderByFullName(sTemplateFolder)
			: null,
		oUidList = oTemplateFolder
			? oTemplateFolder.getUidList(
				"",
				"",
				Settings.MessagesSortBy.DefaultSortBy,
				Settings.MessagesSortBy.DefaultSortOrder
			)
			: null,
		aTemplates = [];
	if (oUidList) {
		var aUids = oUidList.collection();
		if (aUids.length > Settings.MaxTemplatesCountOnCompose) {
			aUids = aUids.splice(Settings.MaxTemplatesCountOnCompose);
		}
		_.each(aUids, function (sUid) {
			var oMessage = oTemplateFolder.getMessageByUid(sUid);
			if (oMessage.text() !== "") {
				aTemplates.push({
					subject: oMessage.subject(),
					text: oMessage.text(),
				});
			}
		});
	}
	this.templates(aTemplates);
};

CHtmlEditorView.prototype.toggleTemplatePopup = function (oViewModel, oEvent) {
	if (this.visibleTemplatePopup()) {
		this.visibleTemplatePopup(false);
	} else {
		oEvent.stopPropagation();
		this.closeAllPopups();
		this.visibleTemplatePopup(true);
	}
};

CHtmlEditorView.prototype.insertTemplate = function (sHtml, oEvent) {
	oEvent.stopPropagation();
	this.insertHtml(sHtml);
};

CHtmlEditorView.prototype.isInitialized = function () {
	return !!this.oEditor;
};

CHtmlEditorView.prototype.setFocus = function () {
	//TODO
	if (this.oEditor) {
		this.oEditor.focus();
	}
};

/**
 * @param {string} sNewSignatureContent
 * @param {string} sOldSignatureContent
 */
CHtmlEditorView.prototype.changeSignatureContent = function (
	sNewSignatureContent,
	sOldSignatureContent
) {
	// CHECK
	if (this.oEditor && !this.disableEdit()) {
		const content = this.getEditableArea(),
			$SignatureContainer = $(content).find('div[data-anchor="signature"]'),
			$NewSignature = $(sNewSignatureContent).closest(
				'div[data-crea="font-wrapper"]'
			),
			$OldSignature = $(sOldSignatureContent).closest(
				'div[data-crea="font-wrapper"]'
			);
		/*** there is a signature container in the message ***/
		if ($SignatureContainer.length > 0) {
			const sCurrentSignatureContent = $SignatureContainer.html();
			/*** previous signature is empty -> append to the container a new signature ***/
			if (sOldSignatureContent === "") {
				$SignatureContainer.html(
					sCurrentSignatureContent + sNewSignatureContent
				);
			} else if (
				/*** previous signature was found in the container -> replace it with a new ***/
				sCurrentSignatureContent.indexOf(sOldSignatureContent) !== -1
			) {
				$SignatureContainer.html(
					sCurrentSignatureContent.replace(
						sOldSignatureContent,
						sNewSignatureContent
					)
				);
			} else if (
				/*** new signature is found in the container -> do nothing ***/
				sCurrentSignatureContent.indexOf(sNewSignatureContent) !== -1
			) {
			} else {
				const sClearOldSignature =
					$NewSignature.length === 0 || $OldSignature.length === 0
						? sOldSignatureContent
						: $OldSignature.html();
				const sClearNewSignature =
					$NewSignature.length === 0 || $OldSignature.length === 0
						? sNewSignatureContent
						: $NewSignature.html();
				/*** found a previous signature without wrapper -> replace it with a new ***/
				if (sCurrentSignatureContent.indexOf(sClearOldSignature) !== -1) {
					$SignatureContainer.html(
						sCurrentSignatureContent.replace(
							sClearOldSignature,
							sNewSignatureContent
						)
					);
				} else if (
					/*** found a new signature without wrapper -> do nothing ***/
					sCurrentSignatureContent.indexOf(sClearNewSignature) !== -1
				) {
				} else {
					/*** append the new signature to the end of the container ***/
					$SignatureContainer.html(
						sCurrentSignatureContent + sNewSignatureContent
					);
				}
			}
		}
	}
};

CHtmlEditorView.prototype.setFontValuesFromText = function () {
	this.lockFontSubscribing(true);
	this.isFWBold(this.oCrea.getIsBold());
	this.isFSItalic(this.oCrea.getIsItalic());
	this.isTDUnderline(this.oCrea.getIsUnderline());
	this.isTDStrikeThrough(this.oCrea.getIsStrikeThrough());
	this.isEnumeration(this.oCrea.getIsEnumeration());
	this.isBullets(this.oCrea.getIsBullets());
	this.selectedFont(this.oCrea.getFontName());
	this.selectedSize(this.oCrea.getFontSizeInNumber().toString());
	this.lockFontSubscribing(false);
};

CHtmlEditorView.prototype.isUndoAvailable = function () {
	alert("isUndoAvailable");
	if (this.oCrea) {
		return this.oCrea.isUndoAvailable();
	}

	return false;
};

CHtmlEditorView.prototype.getPlainText = function () {
	//TODO
	if (this.oEditor) {
		return this.oEditor.getText();
	}

	return "";
};

/**
 * @param {boolean=} bRemoveSignatureAnchor = false
 */
CHtmlEditorView.prototype.getText = function (bRemoveSignatureAnchor) {
	//TODO: use bRemoveSignatureAnchor
	const text = this.oEditor ? this.oEditor.summernote('code') : "";
	return this.sPlaceholderText !== "" &&
		this.removeAllTags(text) === this.sPlaceholderText
		? ""
		: text;
};

/**
 * Returns JQuery instance of main editable element
 */
CHtmlEditorView.prototype.getEditableArea = function () {
	return this.oEditor.data("summernote").layoutInfo.editable;
};

/**
 * @param {string} sText
 * @param {boolean} bPlain
 */
CHtmlEditorView.prototype.setText = function (sText, bPlain) {
	//TODO
	if (this.oEditor && !this.disableEdit()) {
		if (bPlain) {
			sText = '<p>' + sText + '</p>';
		}
		
		if (sText === '') {
			sText = '<p></p>';
		} 
		this.oEditor.summernote('code', sText);

		if (this.inactive() && sText === '') {
			this.setPlaceholder();
		}
	}
};

CHtmlEditorView.prototype.undoAndClearRedo = function () {
	//TODO
	if (this.oEditor) {
		// console.log();
		// tinymce.UndoManager.undo();
		//TODO clear REDO only
		// tinymce.UndoManager.reset();
		// this.oEditor.undo();
		// this.oEditor.clearRedo();
	}
};

CHtmlEditorView.prototype.clearUndoRedo = function () {
	//TODO
	if (this.oEditor) {
		// tinymce.UndoManager.reset();
	}
};

CHtmlEditorView.prototype.isEditing = function () {
	// TODO
	// return this.oCrea ? this.oCrea.bEditing : false;
	return this.oEditor ? true : false;
};

/**
 * @param {string} sText
 */
CHtmlEditorView.prototype.removeAllTags = function (sText) {
	return sText.replace(/<style>.*<\/style>/g, "").replace(/<[^>]*>/g, "");
};

CHtmlEditorView.prototype.onFocusHandler = function () {
	//TODO
	if (this.oEditor) {
		this.closeAllPopups();
		this.textFocused(true);
	}
};

CHtmlEditorView.prototype.onBlurHandler = function () {
	//TODO
	if (this.oEditor) {
		this.textFocused(false);
	}
};

CHtmlEditorView.prototype.onEscHandler = function () {
	if (!Popups.hasOpenedMaximizedPopups()) {
		this.closeAllPopups();
	}
};

/**
 * @param {boolean} bWithoutLinkPopup
 */
CHtmlEditorView.prototype.closeAllPopups = function (bWithoutLinkPopup) {
	//TODO
	bWithoutLinkPopup = !!bWithoutLinkPopup;
	if (!bWithoutLinkPopup) {
		this.visibleLinkPopup(false);
	}
	this.visibleInsertLinkPopup(false);
	this.visibleImagePopup(false);
	this.visibleInsertImagePopup(false);
	this.visibleFontColorPopup(false);
	this.visibleTemplatePopup(false);
};

/**
 * @param {string} sHtml
 */
CHtmlEditorView.prototype.insertHtml = function (sHtml) {
	//CHECK
	if (this.oEditor) {
		if (!this.oEditor.summernote('hasFocus')) {
			this.oEditor.summernote('focus');
		}
		this.oEditor.summernote('pasteHTML', sHtml);
	}
};

/**
 * @param {Object} oViewModel
 * @param {Object} oEvent
 */
CHtmlEditorView.prototype.insertLink = function (oViewModel, oEvent) {
	//TODO
	if (!this.inactive() && !this.visibleInsertLinkPopup()) {
		if (oEvent && _.isFunction(oEvent.stopPropagation)) {
			oEvent.stopPropagation();
		}
		this.linkForInsert(this.oCrea.getSelectedText());
		this.closeAllPopups();
		this.visibleInsertLinkPopup(true);
		this.linkFocused(true);
	}
};

/**
 * @param {Object} oCurrentViewModel
 * @param {Object} event
 */
CHtmlEditorView.prototype.insertLinkFromPopup = function (
	oCurrentViewModel,
	event
) {
	if (this.linkForInsert().length > 0) {
		if (AddressUtils.isCorrectEmail(this.linkForInsert())) {
			this.oCrea.insertEmailLink(this.linkForInsert());
		} else {
			this.oCrea.insertLink(this.linkForInsert());
		}
	}

	this.closeInsertLinkPopup(oCurrentViewModel, event);

	return false;
};

/**
 * @param {Object} oCurrentViewModel
 * @param {Object} event
 */
CHtmlEditorView.prototype.closeInsertLinkPopup = function (
	oCurrentViewModel,
	event
) {
	this.visibleInsertLinkPopup(false);
	if (event) {
		event.stopPropagation();
	}
};

CHtmlEditorView.prototype.textColor = function (oViewModel, oEvent) {
	if (!this.inactive()) {
		this.closeAllPopups();
		if (!this.visibleFontColorPopup()) {
			oEvent.stopPropagation();
			this.visibleFontColorPopup(true);
			this.oFontColorPickerView.onShow();
			this.oBackColorPickerView.onShow();
		}
	}
};

/**
 * @param {string} sColor
 * @return string
 */
CHtmlEditorView.prototype.colorToHex = function (sColor) {
	if (sColor.substr(0, 1) === "#") {
		return sColor;
	}

	/*jslint bitwise: true*/
	var aDigits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(sColor),
		iRed = Types.pInt(aDigits[2]),
		iGreen = Types.pInt(aDigits[3]),
		iBlue = Types.pInt(aDigits[4]),
		iRgb = iBlue | (iGreen << 8) | (iRed << 16),
		sRgb = iRgb.toString(16);
	/*jslint bitwise: false*/

	while (sRgb.length < 6) {
		sRgb = "0" + sRgb;
	}

	return aDigits[1] + "#" + sRgb;
};

/**
 * @param {string} sColor
 */
CHtmlEditorView.prototype.setTextColorFromPopup = function (sColor) {
	this.oCrea.textColor(this.colorToHex(sColor));
	this.closeAllPopups();
};

/**
 * @param {string} sColor
 */
CHtmlEditorView.prototype.setBackColorFromPopup = function (sColor) {
	this.oCrea.backgroundColor(this.colorToHex(sColor));
	this.closeAllPopups();
};

CHtmlEditorView.prototype.insertImage = function (oViewModel, oEvent) {
	if (
		!this.inactive() &&
		Settings.AllowInsertImage &&
		!this.visibleInsertImagePopup()
	) {
		oEvent.stopPropagation();
		this.imagePathFromWeb("");
		this.closeAllPopups();
		this.visibleInsertImagePopup(true);
		this.initUploader();
	}

	return true;
};

/**
 * @param {Object} oCurrentViewModel
 * @param {Object} event
 */
CHtmlEditorView.prototype.insertWebImageFromPopup = function (
	oCurrentViewModel,
	event
) {
	if (Settings.AllowInsertImage && this.imagePathFromWeb().length > 0) {
		this.oCrea.insertImage(this.imagePathFromWeb());
	}

	this.closeInsertImagePopup(oCurrentViewModel, event);
};

/**
 * @param {string} sUid
 * @param oAttachmentData
 */
CHtmlEditorView.prototype.insertComputerImageFromPopup = function (sUid, oAttachmentData) {
	if (!Settings.AllowInsertImage || !this.oEditor) {
		return;
	}

	const accountId = _.isFunction(this.oParent && this.oParent.senderAccountId)
		? this.oParent.senderAccountId()
		: MailCache.currentAccountId(),
		attachment = new CAttachmentModel(accountId)
	;

	attachment.parse(oAttachmentData);
	const viewLink = attachment.getActionUrl('view');

	if (viewLink.length > 0) {
		const $img = $(`<img src="${viewLink}" data-x-src-cid="${sUid}" />`);
		this.oEditor.summernote('insertNode', $img[0]);
		oAttachmentData.CID = sUid;
		this.aUploadedImagesData.push(oAttachmentData);
	}
};

CHtmlEditorView.prototype.getUploadedImagesData = function () {
	//TODO
	return this.aUploadedImagesData;
};

/**
 * @param {?=} oCurrentViewModel
 * @param {?=} event
 */
CHtmlEditorView.prototype.closeInsertImagePopup = function (
	oCurrentViewModel,
	event
) {
	this.visibleInsertImagePopup(false);
	if (event) {
		event.stopPropagation();
	}
};

/**
 * Initializes file uploader.
 */
CHtmlEditorView.prototype.initUploader = function () {
	// this.oJua must be re-initialized because compose popup is destroyed after it is closed
	this.oJua = new CJua({
		action: "?/Api/",
		name: "jua-uploader",
		queueSize: 2,
		hiddenElementsPosition: UserSettings.IsRTL ? "right" : "left",
		disableMultiple: true,
		disableAjaxUpload: false,
		disableDragAndDrop: true,
		hidden: _.extendOwn(
			{
				Module: Settings.ServerModuleName,
				Method: "UploadAttachment",
				Parameters: function () {
					return JSON.stringify({
						AccountID: MailCache.currentAccountId(),
					});
				},
			},
			App.getCommonRequestParameters()
		),
	});
	this.oJua
		.on("onSelect", _.bind(this.onFileUploadSelect, this))
		.on("onComplete", _.bind(this.onFileUploadComplete, this));
};

/**
 * Initializes file uploader for editor.
 */
CHtmlEditorView.prototype.initEditorUploader = function () {
	// this.editorUploader must be re-initialized because compose popup is destroyed after it is closed
	if (Settings.AllowInsertImage && this.uploaderAreaDom()) {
		if (
			this.oParent &&
			this.oParent.composeUploaderDragOver &&
			this.oParent.onFileUploadProgress &&
			this.oParent.onFileUploadStart &&
			this.oParent.onFileUploadComplete
		) {
			const fBodyDragEnter = _.bind(function () {
				this.editorUploaderBodyDragOver(true);
				this.oParent.composeUploaderDragOver(true);
			}, this);

			const fBodyDragOver = _.bind(function () {
				this.editorUploaderBodyDragOver(false);
				this.oParent.composeUploaderDragOver(false);
			}, this);

			this.editorUploader = new CJua({
				action: "?/Api/",
				name: "jua-uploader",
				queueSize: 1,
				dragAndDropElement: this.bAllowImageDragAndDrop
					? this.uploaderAreaDom()
					: null,
				disableMultiple: true,
				disableAjaxUpload: false,
				disableDragAndDrop: !this.bAllowImageDragAndDrop,
				hidden: _.extendOwn(
					{
						Module: Settings.ServerModuleName,
						Method: "UploadAttachment",
						Parameters: function () {
							return JSON.stringify({
								AccountID: MailCache.currentAccountId(),
							});
						},
					},
					App.getCommonRequestParameters()
				),
			});

			this.editorUploader
				.on(
					"onDragEnter",
					_.bind(this.oParent.composeUploaderDragOver, this.oParent, true)
				)
				.on(
					"onDragLeave",
					_.bind(this.oParent.composeUploaderDragOver, this.oParent, false)
				)
				.on("onBodyDragEnter", fBodyDragEnter)
				.on("onBodyDragLeave", fBodyDragOver)
				.on(
					"onProgress",
					_.bind(this.oParent.onFileUploadProgress, this.oParent)
				)
				.on("onSelect", _.bind(this.oParent.onFileUploadSelect, this.oParent))
				.on("onStart", _.bind(this.oParent.onFileUploadStart, this.oParent))
				.on(
					"onComplete",
					_.bind(this.oParent.onFileUploadComplete, this.oParent)
				);
		}
	}
};

CHtmlEditorView.prototype.isDragAndDropSupported = function () {
	return this.editorUploader
		? this.editorUploader.isDragAndDropSupported()
		: false;
};

CHtmlEditorView.prototype.uploadNotImageAsAttachment = function (file) {
	const fileInfo = {
		File: file,
		FileName: file.name,
		Folder: '',
		Size: file.size,
		Type: file.type,
	};
	this.editorUploader.addNewFile(fileInfo);
};

CHtmlEditorView.prototype.uploadImageAsInline = function (file) {
	if (!Settings.AllowInsertImage || !this.oJua) {
		return;
	}

	const fileInfo = {
		File: file,
		FileName: file.name,
		Folder: '',
		Size: file.size,
		Type: file.type,
	};
	this.oJua.addNewFile(fileInfo);
};

CHtmlEditorView.prototype.uploadImageAsBase64 = function (file) {
	if (!Settings.AllowInsertImage || !this.oEditor) {
		return;
	}

	const $img = $('<img src="./static/styles/images/wait.gif" />');
	this.oEditor.summernote('insertNode', $img[0]);
	const reader = new window.FileReader();
	reader.onload = function (event) {
		$img.attr('src', event.target.result);
	};
	reader.readAsDataURL(file);
};

CHtmlEditorView.prototype.uploadFile = function (file, isUploadFromDialog) {
	if (!file || typeof file.type !== 'string') {
		return;
	}
	if (Settings.AllowInsertImage && 0 === file.type.indexOf("image/")) {
		if (
			Settings.ImageUploadSizeLimit > 0 &&
			file.size > Settings.ImageUploadSizeLimit
		) {
			Popups.showPopup(AlertPopup, [
				TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_SIZE'),
			]);
		} else {
			if (this.bInsertImageAsBase64 || !isUploadFromDialog) {
				this.uploadImageAsBase64(file);
			} else {
				this.uploadImageAsInline(file);
			}
		}
	} else if (!isUploadFromDialog && this.editorUploader && this.oParent && this.oParent.onFileUploadSelect) {
		// upload is from drag
		// and uploader is initialized
		// and parent can upload attachment
		this.uploadNotImageAsAttachment(file);
	} else {
		Popups.showPopup(AlertPopup, [
			TextUtils.i18n('%MODULENAME%/ERROR_NOT_IMAGE_CHOOSEN'),
		]);
	}
};

/**
 * @param {Object} oFile
 */
CHtmlEditorView.prototype.isFileImage = function (oFile) {
	if (typeof oFile.Type === "string") {
		return -1 !== oFile.Type.indexOf("image");
	} else {
		var iDotPos = oFile.FileName.lastIndexOf("."),
			sExt = oFile.FileName.substr(iDotPos + 1),
			aImageExt = ["jpg", "jpeg", "gif", "tif", "tiff", "png"];
		return -1 !== $.inArray(sExt, aImageExt);
	}
};

/**
 * @param {string} sUid
 * @param {Object} oFile
 */
CHtmlEditorView.prototype.onFileUploadSelect = function (sUid, oFile) {
	if (!this.isFileImage(oFile)) {
		Popups.showPopup(AlertPopup, [
			TextUtils.i18n("%MODULENAME%/ERROR_NOT_IMAGE_CHOOSEN"),
		]);
		return false;
	}

	this.closeInsertImagePopup();
	return true;
};

/**
 * @param {string} sUid
 * @param {boolean} bResponseReceived
 * @param {Object} oData
 */
CHtmlEditorView.prototype.onFileUploadComplete = function (
	sUid,
	bResponseReceived,
	oData
) {
	var sError = "";

	if (oData && oData.Result) {
		if (oData.Result.Error) {
			sError =
				oData.Result.Error === "size"
					? TextUtils.i18n("COREWEBCLIENT/ERROR_UPLOAD_SIZE")
					: TextUtils.i18n("COREWEBCLIENT/ERROR_UPLOAD_UNKNOWN");

			Popups.showPopup(AlertPopup, [sError]);
		} else {
			this.insertComputerImageFromPopup(sUid, oData.Result.Attachment);
		}
	} else {
		Popups.showPopup(AlertPopup, [
			TextUtils.i18n("COREWEBCLIENT/ERROR_UPLOAD_UNKNOWN"),
		]);
	}
};

CHtmlEditorView.prototype.undo = function () {
	if (!this.inactive()) {
		this.oCrea.undo();
	}
	return false;
};

CHtmlEditorView.prototype.redo = function () {
	if (!this.inactive()) {
		this.oCrea.redo();
	}
	return false;
};

CHtmlEditorView.prototype.bold = function () {
	if (!this.inactive()) {
		this.oCrea.bold();
		this.isFWBold(!this.isFWBold());
	}
	return false;
};

CHtmlEditorView.prototype.italic = function () {
	if (!this.inactive()) {
		this.oCrea.italic();
		this.isFSItalic(!this.isFSItalic());
	}
	return false;
};

CHtmlEditorView.prototype.underline = function () {
	if (!this.inactive()) {
		this.oCrea.underline();
		this.isTDUnderline(!this.isTDUnderline());
	}
	return false;
};

CHtmlEditorView.prototype.strikeThrough = function () {
	if (!this.inactive()) {
		this.oCrea.strikeThrough();
		this.isTDStrikeThrough(!this.isTDStrikeThrough());
	}
	return false;
};

CHtmlEditorView.prototype.numbering = function () {
	if (!this.inactive()) {
		this.oCrea.numbering();
		this.isBullets(false);
		this.isEnumeration(!this.isEnumeration());
	}
	return false;
};

CHtmlEditorView.prototype.bullets = function () {
	if (!this.inactive()) {
		this.oCrea.bullets();
		this.isEnumeration(false);
		this.isBullets(!this.isBullets());
	}
	return false;
};

CHtmlEditorView.prototype.insertHorizontalLine = function () {
	if (!this.inactive()) {
		this.oCrea.insertHorizontalLine();
	}
	return false;
};

CHtmlEditorView.prototype.removeFormat = function () {
	if (!this.inactive()) {
		this.oCrea.removeFormat();
	}
	return false;
};

CHtmlEditorView.prototype.setRtlDirection = function () {
	if (!this.inactive()) {
		this.oCrea.setRtlDirection();
	}
	return false;
};

CHtmlEditorView.prototype.setLtrDirection = function () {
	if (!this.inactive()) {
		this.oCrea.setLtrDirection();
	}
	return false;
};

module.exports = CHtmlEditorView;
