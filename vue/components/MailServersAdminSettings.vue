<template>
  <div class="full-height full-width">
    <q-scroll-area class="full-height full-width">
      <div class="q-pa-lg ">
        <div class="row q-mb-md">
          <div class="col text-h5" v-t="'MAILWEBCLIENT.HEADING_SERVERS_SETTINGS'"></div>
          <div class="col text-right" v-if="!createMode">
            <q-btn unelevated no-caps dense class="q-px-sm" :ripple="false" color="primary" @click="addNewServer"
                   :label="$t('MAILWEBCLIENT.ACTION_ADD_NEW_SERVER')" />
          </div>
        </div>
        <div class="relative-position" v-if="!createMode">
          <q-list dense bordered separator class="rounded-borders q-mb-md" style="overflow: hidden"
                  v-if="servers.length > 0">
            <q-item clickable :class="currentServerId === server.id ? 'bg-grey-4' : 'bg-white'"
                    v-for="server in servers" :key="server.id" @click="route(server.id)">
              <q-item-section>
                <q-item-label>
                  {{ server.name }}
                  <span v-if="server.tenantName" class="text-grey-6">{{ $t('MAILWEBCLIENT.LABEL_HINT_SERVERS_TENANTNAME', { TENANTNAME: server.tenantName }) }}</span>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn dense flat no-caps color="negative" class="no-hover" :label="$t('COREWEBCLIENT.ACTION_DELETE')"
                       @click.native.stop="askDeleteServer(server.name, server.id, server.tenantId)"/>
              </q-item-section>
            </q-item>
          </q-list>
          <div class="flex flex-left q-mb-lg" v-if="showSearch || showPagination">
            <q-input rounded outlined dense bg-color="white" v-model="enteredSearch" v-if="showSearch" @keyup.enter="route">
              <template v-slot:append>
                <q-btn dense flat :ripple="false" icon="search" @click="route" />
              </template>
            </q-input>
            <q-pagination flat active-color="primary" color="grey-6" v-model="selectedPage" :max="pagesCount" v-if="showPagination" />
          </div>
          <div v-if="servers.length === 0 && loadingServers" style="height: 150px;"></div>
          <q-card flat bordered class="card-edit-settings"
                  v-if="servers.length === 0 && !loadingServers && search === ''">
            <q-card-section class="text-caption" v-t="'MAILWEBCLIENT.INFO_NO_SERVERS'" />
          </q-card>
          <q-card flat bordered class="card-edit-settings"
                  v-if="servers.length === 0 && !loadingServers && search !== ''">
            <q-card-section class="text-caption" v-t="'MAILWEBCLIENT.INFO_NO_SERVERS_FOUND'" />
          </q-card>
        </div>

        <q-card flat bordered class="card-edit-settings" v-if="showServerFields || createMode">
          <q-card-section>
            <div class="row q-mb-md" v-if="createMode && tenantOptions.length > 1">
              <div class="col-2 q-my-sm q-pl-sm required-field" v-t="'MAILWEBCLIENT.LABEL_TENANT'"></div>
              <div class="col-5">
                <q-select outlined dense bg-color="white" v-model="selectedTenantId"
                          emit-value map-options :options="tenantOptions" />
              </div>
            </div>
            <div class="row">
              <div class="col-2 q-my-sm q-pl-sm required-field" v-t="'MAILWEBCLIENT.LABEL_DISPLAY_NAME'"></div>
              <div class="col-5">
                <q-input outlined dense bg-color="white" v-model="serverName" ref="serverName"></q-input>
              </div>
            </div>
            <div class="row q-mt-sm q-mb-lg">
              <div class="col-2"></div>
              <div class="col-9">
                <q-item-label caption v-t="'MAILWEBCLIENT.LABEL_HINT_DISPLAY_NAME'" />
              </div>
            </div>
            <div class="row" v-if="allowEditDomainsInServer || !createMode">
              <div class="col-2" v-t="'MAILWEBCLIENT.LABEL_DOMAINS'"></div>
              <div class="col-3 textarea">
                <q-input outlined dense bg-color="white" type="textarea" rows="2" v-model="domains" ref="domains"
                         :disable="!allowEditDomainsInServer" />
              </div>
            </div>
            <div class="row q-mt-sm q-mb-lg" v-if="allowEditDomainsInServer || !createMode">
              <div class="col-2"></div>
              <div class="col-9">
                <q-item-label caption v-t="'MAILWEBCLIENT.LABEL_HINT_DOMAINS'" v-if="allowEditDomainsInServer" />
                <q-item-label caption class="text-weight-bold q-mt-md" v-t="'MAILWEBCLIENT.LABEL_HINT_DOMAINS_WILDCARD'" v-if="allowEditDomainsInServer" />
                <q-item-label caption v-html="$t('MAILWEBCLIENT.LABEL_HINT_DOMAINS_CANNOT_EDIT_HTML')" v-if="!allowEditDomainsInServer" />
              </div>
            </div>

            <div class="row q-mb-md">
              <div class="col-2 q-my-sm q-pl-sm required-field" v-t="'MAILWEBCLIENT.LABEL_IMAP_SERVER'"></div>
              <div class="col-3">
                <q-input outlined dense bg-color="white" v-model="imapServer" ref="imapServer"
                         @blur="fillUpSmtpServerFromImapServer"></q-input>
              </div>
              <div class="col-1 q-my-sm text-right q-pr-md  q-pl-sm required-field" v-t="'MAILWEBCLIENT.LABEL_PORT'"></div>
              <div class="col-1">
                <q-input outlined dense bg-color="white" v-model="imapPort" ref="imapPort"></q-input>
              </div>
              <div class="col-1 q-my-sm q-pl-md">
                <q-checkbox dense v-model="imapSsl" label="SSL" />
              </div>
            </div>

            <div class="row q-mb-md">
              <div class="col-2 q-my-sm q-pl-sm required-field" v-t="'MAILWEBCLIENT.LABEL_SMTP_SERVER'"></div>
              <div class="col-3">
                <q-input outlined dense bg-color="white" v-model="smtpServer" ref="smtpServer"></q-input>
              </div>
              <div class="col-1 q-my-sm text-right q-pr-md q-pl-sm required-field" v-t="'MAILWEBCLIENT.LABEL_PORT'"></div>
              <div class="col-1">
                <q-input outlined dense bg-color="white" v-model="smtpPort" ref="smtpPort"></q-input>
              </div>
              <div class="col-1 q-my-sm q-pl-md">
                <q-checkbox dense v-model="smtpSsl" :label="$t('MAILWEBCLIENT.LABEL_SSL')" />
              </div>
            </div>
            <div class="row q-mb-md">
              <div class="col-2"></div>
              <div class="col-6">
                <q-item-label v-t="'MAILWEBCLIENT.LABEL_SMTP_AUTHENTICATION'" />
                <q-list dense >
                  <q-item manual-focus>
                    <q-item-section class="q-pr-none">
                      <span>
                      <q-radio dense v-model="smtpAuthentication" :val="smtpAuthTypeEnum.NoAuthentication" :label="$t('MAILWEBCLIENT.LABEL_NO_AUTHENTICATION')" />
                      </span>
                    </q-item-section>
                  </q-item>
                  <q-item manual-focus>
                    <q-item-section avatar>
                      <span>
                        <q-radio dense v-model="smtpAuthentication" :val="smtpAuthTypeEnum.UseSpecifiedCredentials" :label="$t('MAILWEBCLIENT.LABEL_USE_SPECIFIED_CREDENTIALS')" />
                      </span>
                    </q-item-section>
                    <q-item-section>
                      <q-input outlined dense bg-color="white" v-model="smtpLogin" :placeholder="$t('COREWEBCLIENT.LABEL_LOGIN')"></q-input>
                    </q-item-section>
                    <q-item-section>
                      <q-input outlined dense bg-color="white" type="password" autocomplete="new-password"
                               v-model="smtpPassword" :placeholder="$t('COREWEBCLIENT.LABEL_PASSWORD')" />
                    </q-item-section>
                  </q-item>
                  <q-item manual-focus>
                    <q-item-section>
                      <span>
                      <q-radio dense v-model="smtpAuthentication" :val="smtpAuthTypeEnum.UseUserCredentials"
                               :label="$t('MAILWEBCLIENT.LABEL_USE_USER_CREDENTIALS')"/>
                      </span>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </div>
            <div class="row q-mb-md">
              <div class="col-2"></div>
              <div class="col-5">
                <q-checkbox dense v-model="enableSieve" :label="$t('MAILWEBCLIENT.LABEL_ENABLE_SIEVE')" />
              </div>
            </div>
            <div class="row q-mb-md">
              <div class="col-2 q-my-sm" v-t="'MAILWEBCLIENT.LABEL_SIEVE_PORT'"></div>
              <div class="col-5">
                <q-input outlined dense bg-color="white" v-model="sievePort"></q-input>
              </div>
            </div>
            <div class="row q-mb-md">
              <div class="col-2"></div>
              <div class="col-5">
                <q-checkbox dense v-model="useThreading" :label="$t('MAILWEBCLIENT.LABEL_USE_THREADING')" />
              </div>
            </div>
            <div class="row q-mb-sm">
              <div class="col-2"></div>
              <div class="col-5">
                <q-checkbox dense v-model="useFullEmail"
                            :label="$t('MAILWEBCLIENT.LABEL_USE_FULL_EMAIL_ADDRESS_AS_LOGIN')" />
              </div>
            </div>
            <div class="row">
              <div class="col-2"></div>
              <div class="col-5">
                <q-item-label caption v-t="$t('MAILWEBCLIENT.LABEL_HINT_USE_FULL_EMAIL_ADDRESS_AS_LOGIN')" />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="card-edit-settings q-mt-md" v-if="showServerFields || createMode">
          <q-card-section>
            <div class="row q-mb-sm">
              <div class="col-10">
                <q-checkbox dense v-model="setExternalAccessServers"
                            :label="$t('MAILWEBCLIENT.LABEL_ADMIN_EXTERNAL_ACCESS_SERVERS')" />
              </div>
            </div>
            <div class="row q-mb-md">
              <div class="col-10">
                <q-item-label caption v-html="$t('MAILWEBCLIENT.LABEL_HINT_ADMIN_EXTERNAL_ACCESS_SERVERS')" />
              </div>
            </div>
            <div class="row q-mb-md">
              <div class="col-2 q-my-sm" v-t="'MAILWEBCLIENT.LABEL_IMAP_SERVER'"
                   :class="setExternalAccessServers ? '' : 'disabled'"></div>
              <div class="col-3">
                <q-input outlined dense bg-color="white" v-model="externalAccessImapServer"
                         :disable="!setExternalAccessServers"></q-input>
              </div>
              <div class="col-1 q-my-sm text-right q-pr-md" v-t="'MAILWEBCLIENT.LABEL_PORT'"
                   :class="setExternalAccessServers ? '' : 'disabled'"></div>
              <div class="col-1">
                <q-input outlined dense bg-color="white" v-model="externalAccessImapPort"
                         :disable="!setExternalAccessServers"></q-input>
              </div>
              <div class="col-1 q-my-sm text-right q-pr-md" v-t="'MAILWEBCLIENT.LABEL_ALTERNATIVE_PORT'"
                   :class="setExternalAccessServers ? '' : 'disabled'"></div>
              <div class="col-1">
                <q-input outlined dense bg-color="white" v-model="externalAccessImapAlterPortModel"
                         :disable="!setExternalAccessServers"></q-input>
              </div>
              <div class="col-1 q-my-sm q-pl-md">
                <q-checkbox outlined dense v-model="externalAccessImapUseSsl" label="SSL" 
                          :disable="!setExternalAccessServers"/>
              </div>
            </div>
            <div class="row q-mb-md">
              <div class="col-2 q-my-sm" v-t="'MAILWEBCLIENT.LABEL_POP3_SERVER'"
                   :class="setExternalAccessServers ? '' : 'disabled'"></div>
              <div class="col-3">
                <q-input outlined dense bg-color="white" v-model="externalAccessPop3Server"
                         :disable="!setExternalAccessServers"></q-input>
              </div>
              <div class="col-1 q-my-sm text-right q-pr-md" v-t="'MAILWEBCLIENT.LABEL_PORT'"
                   :class="setExternalAccessServers ? '' : 'disabled'"></div>
              <div class="col-1">
                <q-input outlined dense bg-color="white" v-model="externalAccessPop3Port"
                         :disable="!setExternalAccessServers"></q-input>
              </div>
              <div class="col-1 q-my-sm text-right q-pr-md" v-t="'MAILWEBCLIENT.LABEL_ALTERNATIVE_PORT'"
                   :class="setExternalAccessServers ? '' : 'disabled'"></div>
              <div class="col-1">
                <q-input outlined dense bg-color="white" v-model="externalAccessPop3AlterPortModel"
                         :disable="!setExternalAccessServers"></q-input>
              </div>
              <div class="col-1 q-my-sm q-pl-md">
                <q-checkbox outlined dense v-model="externalAccessPop3UseSsl" label="SSL" 
                          :disable="!setExternalAccessServers"/>
              </div>
            </div>
            <div class="row">
              <div class="col-2 q-my-sm" v-t="'MAILWEBCLIENT.LABEL_SMTP_SERVER'"
                   :class="setExternalAccessServers ? '' : 'disabled'"></div>
              <div class="col-3">
                <q-input outlined dense bg-color="white" v-model="externalAccessSmtpServer"
                         :disable="!setExternalAccessServers"></q-input>
              </div>
              <div class="col-1 q-my-sm text-right q-pr-md" v-t="'MAILWEBCLIENT.LABEL_PORT'"
                   :class="setExternalAccessServers ? '' : 'disabled'"></div>
              <div class="col-1">
                <q-input outlined dense bg-color="white" v-model="externalAccessSmtpPort"
                         :disable="!setExternalAccessServers"></q-input>
              </div>
              <div class="col-1 q-my-sm text-right q-pr-md" v-t="'MAILWEBCLIENT.LABEL_ALTERNATIVE_PORT'"
                   :class="setExternalAccessServers ? '' : 'disabled'"></div>
              <div class="col-1">
                <q-input outlined dense bg-color="white" v-model="externalAccessSmtpAlterPortModel"
                         :disable="!setExternalAccessServers"></q-input>
              </div>
              <div class="col-1 q-my-sm q-pl-md">
                <q-checkbox outlined dense v-model="externalAccessSmtpUseSsl" label="SSL"
                         :disable="!setExternalAccessServers"/>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="card-edit-settings q-mt-md" v-if="oauthConnectorsData.length > 0 && (showServerFields || createMode)">
          <q-card-section>
            <div class="row">
              <div class="col-6">
                <q-item-label v-t="'MAILWEBCLIENT.INFO_ADMIN_OAUTH'" />
                <q-list dense>
                  <q-item manual-focus v-for="data in oauthConnectorsData" :key="data.type">
                    <q-item-section class="q-pr-none">
                      <span>
                        <q-radio dense v-model="oauthConnector" :val="data.type" :label="data.name" />
                      </span>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <div class="q-pt-md text-right" v-if="showServerFields || createMode">
          <q-btn unelevated no-caps dense class="q-px-sm" :ripple="false" color="primary" @click="save" v-if="!createMode"
                 :label="$t('COREWEBCLIENT.ACTION_SAVE')">
          </q-btn>
          <q-btn unelevated no-caps dense class="q-px-sm" :ripple="false" color="primary" @click="create" v-if="createMode"
                 :label="$t('COREWEBCLIENT.ACTION_CREATE')">
          </q-btn>
          <q-btn unelevated no-caps dense class="q-px-sm q-ml-sm" :ripple="false" color="secondary" @click="cancelCreate"
                 v-if="createMode" :label="$t('COREWEBCLIENT.ACTION_CANCEL')">
          </q-btn>
        </div>
      </div>
      <ConfirmDialog ref="confirmDialog" />
    </q-scroll-area>
    <q-inner-loading style="justify-content: flex-start;" :showing="loadingServers || saving || creating">
      <q-linear-progress query />
    </q-inner-loading>
  </div>
</template>

<script>
import _ from 'lodash'

import eventBus from 'src/event-bus'
import errors from 'src/utils/errors'
import notification from 'src/utils/notification'
import typesUtils from 'src/utils/types'
import webApi from 'src/utils/web-api'

import settings from '../settings'
import cache from '../cache'

import ConfirmDialog from 'src/components/ConfirmDialog'

export default {
  name: 'MailAdminSettings',

  components: {
    ConfirmDialog,
  },

  data() {
    return {
      smtpAuthTypeEnum: settings.getSmtpAuthTypeEnum(),
      allowEditDomainsInServer: settings.getAllowEditDomainsInServer(),

      page: 1,
      search: '',
      limit: 10,
      servers: [],
      totalCount: 0,
      loadingServers: false,

      showSearch: false,
      enteredSearch: '',
      selectedPage: 1,

      currentServerId: 0,
      currentServerTenantId: 0,

      createMode: false,
      showServerFields: false,

      selectedTenantId: 0,
      tenantOptions: [],

      serverName: '',
      domains: '',
      imapServer: '',
      imapPort: 0,
      imapSsl: false,
      smtpServer: '',
      smtpPort: 0,
      smtpSsl: false,
      smtpAuthentication: '0',
      smtpLogin: '',
      smtpPassword: '',
      enableSieve: false,
      sievePort: 0,
      useThreading: false,
      useFullEmail: false,

      setExternalAccessServers: false,
      externalAccessImapServer: '',
      externalAccessImapPort: 143,
      externalAccessImapAlterPort: '',
      externalAccessImapUseSsl: false,
      externalAccessPop3Server: '',
      externalAccessPop3Port: 110,
      externalAccessPop3AlterPort: '',
      externalAccessPop3UseSsl: false,
      externalAccessSmtpServer: '',
      externalAccessSmtpPort: 25,
      externalAccessSmtpAlterPort: '',
      externalAccessSmtpUseSsl: false,

      oauthConnectorsData: [],
      oauthConnector: '',

      saving: false,
      creating: false,
    }
  },

  computed: {
    showPagination () {
      return this.servers.length < this.totalCount
    },
    pagesCount () {
      return Math.ceil(this.totalCount / this.limit)
    },
    externalAccessImapAlterPortModel: {
      get () {
        return (this.externalAccessImapAlterPort === 0) ? '' : this.externalAccessImapAlterPort
      },
      set (val) {
        this.externalAccessImapAlterPort = val
      }
    },
    externalAccessPop3AlterPortModel: {
      get () {
        return (this.externalAccessPop3AlterPort === 0) ? '' : this.externalAccessPop3AlterPort
      },
      set (val) {
        this.externalAccessPop3AlterPort = val
      }
    },
    externalAccessSmtpAlterPortModel: {
      get () {
        return (this.externalAccessSmtpAlterPort === 0) ? '' : this.externalAccessSmtpAlterPort
      },
      set (val) {
        this.externalAccessSmtpAlterPort = val
      }
    },
  },

  watch: {
    $route (to, from) {
      this.parseRoute()
    },

    selectedPage () {
      if (this.selectedPage !== this.page) {
        this.route()
      }
    },

    imapSsl () {
      if (this.imapSsl && this.imapPort === 143) {
        this.imapPort = 993
      }
      if (!this.imapSsl && this.imapPort === 993) {
        this.imapPort = 143
      }
      if (!this.setExternalAccessServers) {
        this.externalAccessImapUseSsl = this.imapSsl
      }
    },

    smtpSsl () {
      if (this.smtpSsl && this.smtpPort === 25) {
        this.smtpPort = 465
      }
      if (!this.smtpSsl && this.smtpPort === 465) {
        this.smtpPort = 25
      }
      if (!this.setExternalAccessServers) {
        this.externalAccessSmtpUseSsl= this.smtpSsl
      }
    },

    imapServer: function (val) {
      if (!this.setExternalAccessServers) {
        this.externalAccessImapServer = val
      }
    },

    imapPort: function (val) {
      if (!this.setExternalAccessServers) {
        this.externalAccessImapPort = val
      }
    },

    smtpServer: function (val) {
      if (!this.setExternalAccessServers) {
        this.externalAccessSmtpServer = val
      }
    },

    smtpPort: function (val) {
      if (!this.setExternalAccessServers) {
        this.externalAccessSmtpPort = val
      }
    },

    setExternalAccessServers () {
      if (!this.setExternalAccessServers) {
        this.externalAccessImapServer = this.imapServer
        this.externalAccessImapPort = this.imapPort
        this.externalAccessImapUseSsl = this.imapSsl
        this.externalAccessSmtpServer = this.smtpServer
        this.externalAccessSmtpPort = this.smtpPort
        this.externalAccessSmtpUseSsl = this.smtpSsl
      }
    }
  },

  beforeRouteLeave (to, from, next) {
    this.$root.doBeforeRouteLeave(to, from, next)
  },

  beforeRouteUpdate (to, from, next) {
    this.$root.doBeforeRouteLeave(to, from, next)
  },

  mounted () {
    this.saving = false
    this.creating = false
    this.populate()

    const tenants = this.$store.getters['tenants/getTenants']
    const tenantOptions = [
      { label: 'system-wide', value: 0 },
    ]
    if (tenants.length > 1) {
      tenants.forEach(tenant => {
        tenantOptions.push({ label: tenant.name, value: tenant.id })
      })
    }
    this.tenantOptions = tenantOptions

    this.populateOauthConnectorsData()

    this.parseRoute()
  },

  methods: {
    route (serverId = 0) {
      const searchRoute = this.enteredSearch !== '' ? ('/search/' + this.enteredSearch) : ''
      const selectedPage = (this.search !== this.enteredSearch) ? 1 : this.selectedPage
      const pageRoute = selectedPage > 1 ? ('/page/' + selectedPage) : ''
      const idRoute = serverId > 0 ? ('/id/' + serverId) : ''
      const path = '/system/mail-servers' + searchRoute + pageRoute + idRoute
      if (path !== this.$route.path) {
        this.$router.push(path)
      }
    },

    parseRoute () {
      if (this.$route.path === '/system/mail-servers/create') {
        this.createMode = true
        this.showServerFields = false
        this.populateServer()
      } else {
        this.createMode = false

        const search = typesUtils.pString(this.$route?.params?.search)
        const page = typesUtils.pPositiveInt(this.$route?.params?.page)
        if (this.search !== search || this.page !== page) {
          this.search = search
          this.enteredSearch = search
          this.page = page
          this.selectedPage = page
          this.populate()
        }

        const serverId = typesUtils.pNonNegativeInt(this.$route?.params?.id)
        if (this.currentServerId !== serverId) {
          this.currentServerId = serverId
          this.populateServer()
        }
      }
    },

    populateOauthConnectorsData () {
      const params = {
        oauthConnectorsData: []
      }
      eventBus.$emit('MailWebclient::GetOauthConnectorsData', params)
      this.oauthConnectorsData = _.isArray(params.oauthConnectorsData)
        ? params.oauthConnectorsData.filter(data => {
          return typesUtils.isNonEmptyString(data.name) && typesUtils.isNonEmptyString(data.type)
        })
        : []
      if (this.oauthConnectorsData.length > 0) {
        this.oauthConnectorsData.unshift({
          name: this.$t('MAILWEBCLIENT.LABEL_ADMIN_OAUTH_NOTHING_SELECTED'),
          type: '',
        })
      }
    },

    populate () {
      this.loadingServers = true
      cache.getServers(this.search, this.page, this.limit).then(({ servers, totalCount, page, search }) => {
        if (page === this.page && search === this.search) {
          this.servers = servers
          this.totalCount = totalCount
          if (this.search === '') {
            this.showSearch = totalCount > this.limit
          }
          this.loadingServers = false
          if (this.currentServerId !== 0) {
            this.populateServer()
          }
        }
      })
    },

    populateServer () {
      if (this.createMode) {
        this.currentServerId = 0
        this.selectedTenantId = (this.tenantOptions.length > 1) ? this.tenantOptions[1].value : 0
        this.serverName = ''
        this.domains = ''
        this.imapServer = ''
        this.imapPort = 143
        this.imapSsl = false
        this.smtpServer = ''
        this.smtpPort = 25
        this.smtpSsl = false
        this.smtpAuthentication = this.smtpAuthTypeEnum.UseUserCredentials
        this.smtpLogin = ''
        this.smtpPassword = ''
        this.enableSieve = false
        this.sievePort = 4190
        this.useThreading = true
        this.useFullEmail = true

        this.setExternalAccessServers = false
        this.externalAccessImapServer = ''
        this.externalAccessImapPort = 143
        this.externalAccessImapAlterPort = ''
        this.externalAccessImapUseSsl = false
        this.externalAccessPop3Server = ''
        this.externalAccessPop3Port = 110
        this.externalAccessPop3AlterPort = ''
        this.externalAccessPop3UseSsl = false
        this.externalAccessSmtpServer = ''
        this.externalAccessSmtpPort = 25
        this.externalAccessSmtpAlterPort = ''
        this.externalAccessSmtpUseSsl = false

        this.oauthConnector = ''
      } else {
        const server = _.find(this.servers, server => {
          return server.id === this.currentServerId
        })
        this.showServerFields = !!server
        if (this.showServerFields) {
          this.currentServerTenantId = server.tenantId
          this.serverName = server.name
          this.domains = server.domains
          this.imapServer = server.incomingServer
          this.imapPort = server.incomingPort
          this.imapSsl = server.incomingUseSsl
          this.smtpServer = server.outgoingServer
          this.smtpPort = server.outgoingPort
          this.smtpSsl = server.outgoingUseSsl
          this.smtpAuthentication = server.smtpAuthType
          this.smtpLogin = server.smtpLogin
          this.smtpPassword = server.smtpPassword
          this.enableSieve = server.enableSieve
          this.sievePort = server.sievePort
          this.useThreading = server.enableThreading
          this.useFullEmail = server.useFullEmailAddressAsLogin

          this.setExternalAccessServers = server.setExternalAccessServers
          this.externalAccessImapServer = server.externalAccessImapServer
          this.externalAccessImapPort = server.externalAccessImapPort
          this.externalAccessImapAlterPort = server.externalAccessImapAlterPort
          this.externalAccessImapUseSsl = server.externalAccessImapUseSsl
          this.externalAccessPop3Server = server.externalAccessPop3Server
          this.externalAccessPop3Port = server.externalAccessPop3Port
          this.externalAccessPop3AlterPort = server.externalAccessPop3AlterPort
          this.externalAccessPop3UseSsl = server.externalAccessPop3UseSsl
          this.externalAccessSmtpServer = server.externalAccessSmtpServer
          this.externalAccessSmtpPort = server.externalAccessSmtpPort
          this.externalAccessSmtpAlterPort = server.externalAccessSmtpAlterPort
          this.externalAccessSmtpUseSsl = server.externalAccessSmtpUseSsl

          this.oauthConnector = server.oauthType
        }
      }
    },

    fillUpSmtpServerFromImapServer () {
      if (_.isEmpty(this.smtpServer)) {
        this.smtpServer = this.imapServer
      }
    },

    /**
     * Method is used in doBeforeRouteLeave mixin
     */
    hasChanges () {
      if (this.createMode) {
        let isExternalAccessChanged = this.setExternalAccessServers !== false
        if (!isExternalAccessChanged && this.setExternalAccessServers) {
          isExternalAccessChanged = this.externalAccessImapServer !== '' || this.externalAccessImapPort !== 143 ||
              this.externalAccessImapAlterPort !== '' || this.externalAccessImapUseSsl !== false || this.externalAccessPop3Server !== '' ||
              this.externalAccessPop3Port !== 110 || this.externalAccessPop3AlterPort !== '' || this.externalAccessPop3UseSsl !== false ||
              this.externalAccessSmtpServer !== '' || this.externalAccessSmtpPort !== 25 ||
              this.externalAccessSmtpAlterPort !== '' || this.externalAccessSmtpUseSsl !== false
        }
        return this.serverName !== '' || this.domains !== '' || this.imapServer !== '' || this.imapPort !== 143 ||
            this.imapSsl !== false || this.smtpServer !== '' || this.smtpPort !== 25 || this.smtpSsl !== false ||
            this.smtpAuthentication !== this.smtpAuthTypeEnum.UseUserCredentials || this.smtpLogin !== '' ||
            this.smtpPassword !== '' || this.enableSieve !== false || this.sievePort !== 4190 ||
            this.useThreading !== true || this.useFullEmail !== true || this.setExternalAccessServers !== false ||
            isExternalAccessChanged || this.oauthConnector !== ''
      } else {
        const server = this.getServer(this.currentServerId)
        if (server) {
          let isExternalAccessChanged = server.setExternalAccessServers !== this.setExternalAccessServers
          if (!isExternalAccessChanged && this.setExternalAccessServers) {
            isExternalAccessChanged = server.externalAccessImapServer !== this.externalAccessImapServer ||
                server.externalAccessImapPort !== this.externalAccessImapPort ||
                server.externalAccessImapAlterPort !== this.externalAccessImapAlterPort ||
                server.externalAccessImapUseSsl !== this.externalAccessImapUseSsl ||
                server.externalAccessPop3Server !== this.externalAccessPop3Server ||
                server.externalAccessPop3Port !== this.externalAccessPop3Port ||
                server.externalAccessPop3AlterPort !== this.externalAccessPop3AlterPort ||
                server.externalAccessPop3UseSsl !== this.externalAccessPop3UseSsl ||
                server.externalAccessSmtpServer !== this.externalAccessSmtpServer ||
                server.externalAccessSmtpPort !== this.externalAccessSmtpPort ||
                server.externalAccessSmtpAlterPort !== this.externalAccessSmtpAlterPort
                server.externalAccessSmtpUseSsl !== this.externalAccessSmtpUseSsl
          }
          return server.name !== this.serverName || server.incomingServer !== this.imapServer ||
              server.incomingPort !== this.imapPort || server.incomingUseSsl !== this.imapSsl ||
              server.outgoingServer !== this.smtpServer || server.outgoingPort !== this.smtpPort ||
              server.outgoingUseSsl !== this.smtpSsl || server.domains !== this.domains ||
              server.smtpAuthType !== this.smtpAuthentication || server.smtpLogin !== this.smtpLogin ||
              server.smtpPassword !== this.smtpPassword || server.enableSieve !== this.enableSieve ||
              server.sievePort !== this.sievePort || server.enableThreading !== this.useThreading ||
              server.useFullEmailAddressAsLogin !== this.useFullEmail ||
              isExternalAccessChanged || server.oauthType !== this.oauthConnector
        } else {
          return false
        }
      }
    },

    /**
     * Method is used in doBeforeRouteLeave mixin,
     * do not use async methods - just simple and plain reverting of values
     * !! hasChanges method must return true after executing revertChanges method
     */
    revertChanges () {
      this.populateServer()
    },

    getServer (id) {
      return this.servers.find(server => {
        return server.id === id
      })
    },

    updateServer (parameters) {
      const server = this.getServer(parameters.ServerId)
      if (server) {
        server.update(parameters)
      }
    },

    getSaveParameters () {
      const parameters = {
        Name: this.serverName,
        IncomingServer: this.imapServer,
        IncomingPort: this.imapPort,
        IncomingUseSsl: this.imapSsl,
        OutgoingServer: this.smtpServer,
        OutgoingPort: this.smtpPort,
        OutgoingUseSsl: this.smtpSsl,
        Domains: this.domains,
        SmtpAuthType: this.smtpAuthentication,
        SmtpLogin: this.smtpLogin,
        SmtpPassword: this.smtpPassword,
        EnableSieve: this.enableSieve,
        SievePort: this.sievePort,
        EnableThreading: this.useThreading,
        UseFullEmailAddressAsLogin: this.useFullEmail,
        SetExternalAccessServers: this.setExternalAccessServers,
        ExternalAccessImapServer: this.externalAccessImapServer,
        ExternalAccessImapPort: typesUtils.pInt(this.externalAccessImapPort),
        ExternalAccessImapAlterPort: typesUtils.pInt(this.externalAccessImapAlterPort),
        ExternalAccessImapUseSsl: typesUtils.pBool(this.externalAccessImapUseSsl),
        ExternalAccessPop3Server: this.externalAccessPop3Server,
        ExternalAccessPop3Port: typesUtils.pInt(this.externalAccessPop3Port),
        ExternalAccessPop3AlterPort: typesUtils.pInt(this.externalAccessPop3AlterPort),
        ExternalAccessPop3UseSsl: typesUtils.pBool(this.externalAccessPop3UseSsl),
        ExternalAccessSmtpServer: this.externalAccessSmtpServer,
        ExternalAccessSmtpPort: typesUtils.pInt(this.externalAccessSmtpPort),
        ExternalAccessSmtpAlterPort: typesUtils.pInt(this.externalAccessSmtpAlterPort),
        ExternalAccessSmtpUseSsl: typesUtils.pBool(this.externalAccessSmtpUseSsl)
      }

      const isOAuthEnable = this.oauthConnector !== ''
      const selectedConnector = isOAuthEnable
        ? this.oauthConnectorsData.find(data => {
          return data.type === this.oauthConnector
        })
        : null
      if (selectedConnector) {
        parameters.OAuthEnable = true
        parameters.OAuthName = selectedConnector.name
        parameters.OAuthType = selectedConnector.type
        parameters.OAuthIconUrl = selectedConnector.iconUrl
      } else {
        parameters.OAuthEnable = false
        parameters.OAuthName = ''
        parameters.OAuthType = ''
        parameters.OAuthIconUrl = ''
      }

      return parameters
    },

    isDataValid () {
      let emptyField = ''
      if (_.isEmpty(_.trim(this.serverName))) {
        emptyField = 'serverName'
      } else if (_.isEmpty(_.trim(this.imapServer))) {
        emptyField = 'imapServer'
      } else if (_.isEmpty(_.trim(this.imapPort))) {
        emptyField = 'imapPort'
      } else if (_.isEmpty(_.trim(this.smtpServer))) {
        emptyField = 'smtpServer'
      } else if (_.isEmpty(_.trim(this.smtpPort))) {
        emptyField = 'smtpPort'
      }
      if (!_.isEmpty(emptyField)) {
        if (_.isFunction(this.$refs[emptyField]?.$el?.focus)) {
          this.$refs[emptyField].$el.focus()
        }
        notification.showError(this.$t('COREWEBCLIENT.ERROR_REQUIRED_FIELDS_EMPTY'))
        return false
      }
      return true
    },

    save () {
      if (!this.saving && this.isDataValid()) {
        this.saving = true
        const parameters = _.extend(this.getSaveParameters(), {
          ServerId: this.currentServerId,
          TenantId: this.currentServerTenantId,
        })
        webApi.sendRequest({
          moduleName: 'Mail',
          methodName: 'UpdateServer',
          parameters,
        }).then(result => {
          this.saving = false
          if (result === true) {
            this.updateServer(parameters)
            this.populateServer()
            this.populate()
            notification.showReport(this.$t('COREWEBCLIENT.REPORT_SETTINGS_UPDATE_SUCCESS'))
          } else {
            notification.showError(this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED'))
          }
        }, error => {
          this.saving = false
          notification.showError(errors.getTextFromResponse(error, this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED')))
        })
      }
    },

    addNewServer () {
      this.$router.push('/system/mail-servers/create')
    },

    cancelCreate () {
      this.$router.push('/system/mail-servers')
    },

    create () {
      if (!this.creating && this.isDataValid()) {
        this.creating = true
        const parameters = _.extend(this.getSaveParameters(), {
          TenantId: this.selectedTenantId,
        })
        webApi.sendRequest({
          moduleName: 'Mail',
          methodName: 'CreateServer',
          parameters,
        }).then(result => {
          this.creating = false
          if (_.isSafeInteger(result)) {
            this.populateServer()
            this.populate()
            this.$router.push('/system/mail-servers/id/' + result)
            notification.showReport(this.$t('COREWEBCLIENT.REPORT_SETTINGS_UPDATE_SUCCESS'))
          } else {
            notification.showError(this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED'))
          }
        }, error => {
          this.creating = false
          notification.showError(errors.getTextFromResponse(error, this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED')))
        })
      }
    },

    askDeleteServer(name, id, tenantId) {
      if (_.isFunction(this?.$refs?.confirmDialog?.openDialog)) {
        this.$refs.confirmDialog.openDialog({
          title: name,
          message: this.$t('MAILWEBCLIENT.CONFIRM_REMOVE_SERVER'),
          okHandler: this.deleteServer.bind(this, id, tenantId)
        })
      }
    },

    deleteServer (id, tenantId) {
      this.loadingServers = true
      webApi.sendRequest({
        moduleName: 'Mail',
        methodName: 'DeleteServer',
        parameters: {
          ServerId: id,
          TenantId: tenantId
        },
      }).then(result => {
        this.loadingServers = false
        if (result === true) {
          if (this.servers.length > 1 || this.selectedPage === 1) {
            this.populate()
          } else {
            this.selectedPage -= 1
            this.route()
          }
        } else {
          notification.showError(this.$t('MAILWEBCLIENT.ERROR_DELETE_MAIL_SERVER'))
        }
      }, error => {
        this.loadingServers = false
        notification.showError(errors.getTextFromResponse(error, this.$t('MAILWEBCLIENT.ERROR_DELETE_MAIL_SERVER')))
      })
    },
  },
}
</script>

<style scoped>

</style>
