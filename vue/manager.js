import settings from 'src/../../../MailWebclient/vue/settings'

export default {
  moduleName: 'MailWebclient',

  requiredModules: ['Mail'],

  init (appData) {
    settings.init(appData)
  },

  getAdminSystemTabs () {
    return [
      {
        tabName: 'mail',
        title: 'MAILWEBCLIENT.LABEL_SETTINGS_TAB',
        component() {
          return import('src/../../../MailWebclient/vue/components/MailAdminSettings')
        },
      },
      {
        tabName: 'mail-servers',
        paths: [
          'mail-servers',
          'mail-servers/id/:id',
          'mail-servers/create',
          'mail-servers/search/:search',
          'mail-servers/search/:search/id/:id',
          'mail-servers/page/:page',
          'mail-servers/page/:page/id/:id',
          'mail-servers/search/:search/page/:page',
          'mail-servers/search/:search/page/:page/id/:id',
        ],
        title: 'MAILWEBCLIENT.LABEL_SERVERS_SETTINGS_TAB',
        component() {
          return import('src/../../../MailWebclient/vue/components/MailServersAdminSettings')
        },
      },
    ]
  },
}
