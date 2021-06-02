import settings from "src/../../../MailWebclient/vue/settings"

export default {
	init (appData) {
		settings.init(appData)
	},
	getAdminSystemTabs () {
		return [
			{
				name: 'mail',
				title: 'MAILWEBCLIENT.LABEL_SETTINGS_TAB',
				component () {
					return import('src/../../../MailWebclient/vue/components/MailAdminSettings')
				},
			},
			{
				name: 'mail-servers',
				path: 'mail-servers/page/:page/id/:id',
				title: 'MAILWEBCLIENT.LABEL_SERVERS_SETTINGS_TAB',
				component () {
					return import('src/../../../MailWebclient/vue/components/MailServersAdminSettings')
				},
			},
		]
	},
}
