import settings from "src/../../../MailWebclient/vue/settings"

export default {
	getAdminSystemTabs () {
		return [
			{
				name: 'mail',
				title: 'MAILWEBCLIENT.LABEL_SETTINGS_TAB',
				component () {
					return import('src/../../../MailWebclient/vue/components/MailAdminSettings')
				},
			},
		]
	},
	init (appData) {
		settings.init(appData)
	},
}
