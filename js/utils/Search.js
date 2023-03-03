const
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js')
;

function removeQuotes (text) {
	return text.trim().replace(/(^"|"$)/g, '');
}

function addQuotesIfNeeded (text) {
	text = text.replace(/"/g, '\\"');
	if (-1 < text.indexOf(' ') || -1 < text.indexOf('"')) {
		text = '"' + text + '"';
	}
	return text;
}

function getAdvancedSearchParts(search) {
	const
		keyWords = ['from:', 'to:', 'subject:', 'text:', 'email:', 'has:', 'date:', 'text:', 'body:'],
		patternRegex = (function () {
			const pattern = keyWords.map(keyWord => `\\b${keyWord}`).join('|');
			return new RegExp(`(${pattern})`, 'g');
		}()),
		splittedSearch = search.split(patternRegex),
		searchParts = {}
	;
	let index = 0;

	while (index < splittedSearch.length) {
		const part = splittedSearch[index];
		if (keyWords.includes(part)) {
			searchParts[part.replace(':', '')] = splittedSearch[index + 1];
			index += 2;
		} else {
			index += 1;
		}
	}

	return searchParts;
}

module.exports = {
	/**
	 * Should be called with MessageListView as context
	 */
	getSearchStringForDescription() {
		return '<span class="part">' + TextUtils.encodeHtml(this.search()) + '</span>';
	},

	/**
	 * Should be called with MessageListView as context
	 */
	calculateSearchStringFromAdvancedForm() {
		const
			from = this.searchInputFrom().trim(),
			to = this.searchInputTo().trim(),
			subject = this.searchInputSubject().trim(),
			text = this.searchInputText().trim(),
			hasAttachments = this.searchAttachmentsCheckbox(),
			dateStart = this.searchDateStart().trim(),
			dateEnd = this.searchDateEnd().trim(),
			searchParts = []
		;
		if (from !== '') {
			searchParts.push(`from:${addQuotesIfNeeded(from)}`);
		}
		if (to !== '') {
			searchParts.push(`to:${addQuotesIfNeeded(to)}`);
		}
		if (subject !== '') {
			searchParts.push(`subject:${addQuotesIfNeeded(subject)}`);
		}
		if (text !== '') {
			searchParts.push(`text:${addQuotesIfNeeded(text)}`);
		}
		if (hasAttachments) {
			searchParts.push('has:attachments');
		}
		if (dateStart !== '' || dateEnd !== '') {
			searchParts.push(`date:${addQuotesIfNeeded(dateStart)}/${addQuotesIfNeeded(dateEnd)}`);
		}
		return searchParts.join(' ');
	},

	/**
	 * Should be called with MessageListView as context
	 */
	parseAdvancedSearch() {
		const advancedSearchParts = getAdvancedSearchParts(this.search());
		if (Object.keys(advancedSearchParts).length === 0) {
			this.searchInput(this.search());
			this.isAdvancedSearch(false);
		} else {
			this.searchInputFrom(removeQuotes(advancedSearchParts.from || ''));
			this.searchInputTo(removeQuotes(advancedSearchParts.to || ''));
			this.searchInputSubject(removeQuotes(advancedSearchParts.subject || ''));
			this.searchInputText(removeQuotes(advancedSearchParts.text || ''));
			this.searchAttachmentsCheckbox(advancedSearchParts.has === 'attachments');
			if (advancedSearchParts.date) {
				const dateParts = advancedSearchParts.date.split('/');
				if (dateParts.length === 2) {
					this.searchDateStart(dateParts[0]);
					this.searchDateEnd(dateParts[1]);
				}
			}
			this.isAdvancedSearch(true);
		}
	}
};