'use strict';

const
	ko = require('knockout'),

	codemirror = require('codemirror'),
	langHtml = require('@codemirror/lang-html')
;

module.exports = {
	view: null,
	htmlSourceDom: null,
	onChangeHandler: () => {},

	setHtmlSourceDom(htmlSourceDom) {
		this.htmlSourceDom = htmlSourceDom;
	},

	setOnChangeHandler(onChangeHandler) {
		this.onChangeHandler = onChangeHandler;
	},

	clear() {
		this.view = null;
	},

	isInitialized(){
		return this.view !== null;
	},

	getText() {
		return this.view && this.view.viewState && this.view.viewState.state && this.view.viewState.state.doc
			? this.view.viewState.state.doc.toString()
			: null;
	},

	setText(doc) {
		if (this.view && this.view.viewState && this.view.viewState.state && this.view.viewState.state.doc) {
			this.view.dispatch({
				changes: {
					from: 0,
					to: this.view.viewState.state.doc.length,
					insert: doc
				}
			});
		} else {
			const parent = this.htmlSourceDom && this.htmlSourceDom.length ? this.htmlSourceDom[0] : null;
			if (parent) {
				const { EditorView, basicSetup } = codemirror;
				const { html } = langHtml;
				this.view = new EditorView({
					doc,
					extensions: [
						basicSetup,
						html(),
						EditorView.updateListener.of(() => {
							this.onChangeHandler(/*e.state.doc.toString()*/);
						})
					],
					parent
				});
			}
		}
	}
};
