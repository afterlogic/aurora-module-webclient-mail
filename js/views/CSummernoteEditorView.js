"use strict";
var _ = require("underscore"),
	$ = require("jquery"),
	ko = require("knockout"),
	TextUtils = require("%PathToCoreWebclientModule%/js/utils/Text.js"),
	App = require("%PathToCoreWebclientModule%/js/App.js"),
	Browser = require("%PathToCoreWebclientModule%/js/Browser.js"),
	CJua = require("%PathToCoreWebclientModule%/js/CJua.js"),
	UserSettings = require("%PathToCoreWebclientModule%/js/Settings.js"),
	Popups = require("%PathToCoreWebclientModule%/js/Popups.js"),
	AlertPopup = require("%PathToCoreWebclientModule%/js/popups/AlertPopup.js"),
	CAttachmentModel = require("modules/%ModuleName%/js/models/CAttachmentModel.js"),

	MailCache = require("modules/%ModuleName%/js/Cache.js"),
	Settings = require("modules/%ModuleName%/js/Settings.js")
;

require("modules/%ModuleName%/js/vendors/summernote/summernote-lite.js");
require("modules/%ModuleName%/js/vendors/summernote/summernote-lite.css");

const summernoteLangMap = {
	English: 'en-US',
	German: 'de-DE'
};
const summernoteLang = summernoteLangMap[UserSettings.Language] || summernoteLangMap.English;
require('modules/%ModuleName%/js/vendors/summernote/lang/summernote-en-US.min.js');
require('modules/%ModuleName%/js/vendors/summernote/lang/summernote-de-DE.min.js');

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

	this.bInsertImageAsBase64 = bInsertImageAsBase64;
	this.bAllowFileUpload = !(bInsertImageAsBase64 && window.File === undefined);
	// TODO: use
	this.bAllowInsertImage = Settings.AllowInsertImage;
	this.bAllowHorizontalLineButton = Settings.AllowHorizontalLineButton;
	this.lockFontSubscribing = ko.observable(false);
	this.bAllowImageDragAndDrop = !Browser.ie10AndAbove;

	// TODO: use
	this.aFontNames = [
		"Arial",
		"Arial Black",
		"Courier New",
		"Tahoma",
		"Verdana",
	];
	// TODO: use
	this.sDefaultFont = Settings.DefaultFontName;
	this.correctFontFromSettings();

	// TODO: use
	this.iDefaultSize = Settings.DefaultFontSize;

	this.isDialogOpen = ko.observable(false);

	this.aUploadedImagesData = [];
	this.visibleTemplatePopup = ko.observable(false);

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
		// in case if knockoutjs destroyed dom element with html editor
		this.oEditor.summernote("destroy");
		this.oEditor = null;
	}

	if (!this.oEditor) {
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
				onFocus: (event) => {
					// the timeout is necessary to prevent the compose popup from closing on Escape
					// if the editor dialog was open
					setTimeout(() => {
						this.isDialogOpen(false);
					}, 100);
					this.textFocused(true);
				},
				onBlur: (event) => {
					this.isDialogOpen(false);
					this.textFocused(false);
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
	// TODO: in signature
//	var sText = this.removeAllTags(this.getText());
//	if (sText === "" || sText === "&nbsp;") {
//		this.setText("<span>" + this.sPlaceholderText + "</span>");
//		if (this.oCrea) {
//			this.oCrea.setBlur();
//		}
//	}
};

CHtmlEditorView.prototype.removePlaceholder = function () {
	// TODO: in signature
//	var sText = this.oCrea ? this.removeAllTags(this.oCrea.getText(false)) : "";
//	if (sText === this.sPlaceholderText) {
//		this.setText("");
//		if (this.oCrea) {
//			this.oCrea.setFocus(true);
//		}
//	}
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
	const text = this.oEditor ? this.oEditor.summernote('code') : "";
	if (this.sPlaceholderText !== "" &&
		this.removeAllTags(text) === this.sPlaceholderText) {
		return '';
	}
	if (bRemoveSignatureAnchor) {
		return text.replace('data-anchor="signature"', '');
	}
	// TODO - add font-wrapper like in CCrea.prototype.getText
	return text;
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

CHtmlEditorView.prototype.closeAllPopups = function ()
{
	// do nothing - summernote will close its dialogs
};

/**
 * @param {string} sHtml
 */
CHtmlEditorView.prototype.insertHtml = function (sHtml) {
	// TODO: check - used for templates
	if (this.oEditor) {
		if (!this.oEditor.summernote('hasFocus')) {
			this.oEditor.summernote('focus');
		}
		this.oEditor.summernote('pasteHTML', sHtml);
	}
};

/**
 * @param {string} sUid
 * @param oAttachmentData
 */
CHtmlEditorView.prototype.insertComputerImageFromDialog = function (sUid, oAttachmentData) {
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
	return this.aUploadedImagesData;
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
			this.insertComputerImageFromDialog(sUid, oData.Result.Attachment);
		}
	} else {
		Popups.showPopup(AlertPopup, [
			TextUtils.i18n("COREWEBCLIENT/ERROR_UPLOAD_UNKNOWN"),
		]);
	}
};

module.exports = CHtmlEditorView;
