import settings from './settings'
import store from 'src/store'

import MailServersAdminSettings from './components/MailServersAdminSettings'
import MailAdminSettingsPerTenant from './components/MailAdminSettingsPerTenant'
import MailAdminSettingsPerUser from './components/MailAdminSettingsPerUser'

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
        tabTitle: 'MAILWEBCLIENT.LABEL_SETTINGS_TAB',
        tabRouteChildren: [
          { path: 'mail', component: () => import('./components/MailAdminSettings') },
        ],
      },
      {
        tabName: 'mail-servers',
        tabTitle: 'MAILWEBCLIENT.LABEL_SERVERS_SETTINGS_TAB',
        tabRouteChildren: [
          { path: 'mail-servers', component: MailServersAdminSettings },
          { path: 'mail-servers/id/:id', component: MailServersAdminSettings },
          { path: 'mail-servers/create', component: MailServersAdminSettings },
          { path: 'mail-servers/search/:search', component: MailServersAdminSettings },
          { path: 'mail-servers/search/:search/id/:id', component: MailServersAdminSettings },
          { path: 'mail-servers/page/:page', component: MailServersAdminSettings },
          { path: 'mail-servers/page/:page/id/:id', component: MailServersAdminSettings },
          { path: 'mail-servers/search/:search/page/:page', component: MailServersAdminSettings },
          { path: 'mail-servers/search/:search/page/:page/id/:id', component: MailServersAdminSettings },
        ],
      },
    ]
  },

  getAdminUserTabs () {
    if (settings.getAllowChangeMailQuotaOnMailServer()) {
      return [
        {
          tabName: 'mail-quota',
          tabTitle: 'MAILWEBCLIENT.HEADING_BROWSER_TAB',
          tabRouteChildren: [
            { path: 'id/:id/mail-quota', component: MailAdminSettingsPerUser },
            { path: 'search/:search/id/:id/mail-quota', component: MailAdminSettingsPerUser },
            { path: 'page/:page/id/:id/mail-quota', component: MailAdminSettingsPerUser },
            { path: 'search/:search/page/:page/id/:id/mail-quota', component: MailAdminSettingsPerUser },
          ],
        },
      ]
    }
    return []
  },

  getAdminTenantTabs () {
    const isUserSuperAdmin = store.getters['user/isUserSuperAdmin']
    if (isUserSuperAdmin) {
      return [
        {
          tabName: 'mail-quota',
          tabTitle: 'MAILWEBCLIENT.HEADING_BROWSER_TAB',
          tabRouteChildren: [
            { path: 'id/:id/mail-quota', component: MailAdminSettingsPerTenant },
            { path: 'search/:search/id/:id/mail-quota', component: MailAdminSettingsPerTenant },
            { path: 'page/:page/id/:id/mail-quota', component: MailAdminSettingsPerTenant },
            { path: 'search/:search/page/:page/id/:id/mail-quota', component: MailAdminSettingsPerTenant },
          ],
        }
      ]
    } else {
      return []
    }
  },
}
