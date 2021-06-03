<template>
  <q-scroll-area class="full-height full-width">
    <div class="q-pa-lg ">
      <div class="row q-mb-md">
        <div class="col text-h5" v-t="'MAILWEBCLIENT.HEADING_SERVERS_SETTINGS'"></div>
        <div class="col text-right">
          <q-btn unelevated no-caps dense class="q-px-sm" :ripple="false"
                 color="primary" :label="$t('MAILWEBCLIENT.ACTION_ADD_NEW_SERVER')" />
        </div>
      </div>
      <div class="relative-position">
        <q-list dense bordered separator class="rounded-borders q-mb-md" style="overflow: hidden"
                v-show="servers.length > 0">
          <q-item clickable :class="currentServerId === server.id ? 'bg-grey-4' : 'bg-white'"
                  v-for="server in servers" :key="server.name" @click="route(server.id)">
            <q-item-section>
              <q-item-label>
                {{ server.name }}
                <span v-show="server.tenantName" class="text-grey-6">{{ $t('MAILWEBCLIENT.LABEL_HINT_SERVERS_TENANTNAME', { TENANTNAME: server.tenantName }) }}</span>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn dense flat no-caps color="primary" :label="$t('COREWEBCLIENT.ACTION_DELETE')"
                     @click.native.stop="askDeleteServer(server.name, server.id, server.tenantId)"/>
            </q-item-section>
          </q-item>
        </q-list>
        <div class="flex flex-left q-mb-lg" v-show="showSearch || showPagination">
          <q-input rounded outlined dense class="bg-white" v-model="enteredSearch" v-show="showSearch" @keyup.enter="route">
            <template v-slot:append>
              <q-btn dense flat :ripple="false" icon="search" @click="route" />
            </template>
          </q-input>
          <q-pagination flat active-color="primary" color="grey-6" v-model="selectedPage" :max="pagesCount" v-show="showPagination" />
        </div>
        <div v-show="servers.length === 0 && loadingServers" style="height: 150px;"></div>
        <q-card flat bordered class="card-edit-settings"
                v-show="servers.length === 0 && !loadingServers && search === ''">
          <q-card-section v-t="'MAILWEBCLIENT.INFO_NO_SERVERS'" />
        </q-card>
        <q-card flat bordered class="card-edit-settings"
                v-show="servers.length === 0 && !loadingServers && search !== ''">
          <q-card-section v-t="'MAILWEBCLIENT.INFO_NO_SERVERS_FOUND'" />
        </q-card>
        <q-inner-loading :showing="loadingServers">
          <q-spinner size="50px" color="primary" />
        </q-inner-loading>
      </div>

      <q-card flat bordered class="card-edit-settings" v-if="showServerFields">
        <q-card-section>
          <div class="row">
            <div class="col-1 q-my-sm required-field" v-t="'MAILWEBCLIENT.LABEL_DISPLAY_NAME'"></div>
            <div class="col-3">
              <q-input outlined dense class="bg-white" v-model="serverName"></q-input>
            </div>
          </div>
          <div class="row q-mt-sm q-mb-lg">
            <div class="col-1"></div>
            <div class="col-9">
              <q-item-label caption v-t="'MAILWEBCLIENT.LABEL_HINT_DISPLAY_NAME'" />
            </div>
          </div>
          <div class="row" v-show="allowEditDomainsInServer || editMode">
            <div class="col-1 required-field" v-t="'MAILWEBCLIENT.LABEL_DOMAINS'"></div>
            <div class="col-3">
              <q-input outlined dense class="bg-white" type="textarea" rows="2" v-model="domains" :disable="!allowEditDomainsInServer" />
            </div>
          </div>
          <div class="row q-mt-sm q-mb-lg">
            <div class="col-1"></div>
            <div class="col-9" v-show="allowEditDomainsInServer || editMode">
              <q-item-label caption v-t="'MAILWEBCLIENT.LABEL_HINT_DOMAINS'" v-show="allowEditDomainsInServer" />
              <q-item-label caption v-t="'MAILWEBCLIENT.LABEL_HINT_DOMAINS_WILDCARD'" v-show="allowEditDomainsInServer" />
              <q-item-label caption v-html="$t('MAILWEBCLIENT.LABEL_HINT_DOMAINS_CANNOT_EDIT_HTML')" v-show="!allowEditDomainsInServer" />
            </div>
          </div>
          <div class="row q-mb-md">
            <div class="col-1 q-my-sm required-field" v-t="'MAILWEBCLIENT.LABEL_IMAP_SERVER'"></div>
            <div class="col-3">
              <q-input outlined dense class="bg-white" v-model="imapServer"></q-input>
            </div>
            <div class="col-1 q-my-sm text-right q-pr-md required-field" v-t="'MAILWEBCLIENT.LABEL_PORT'"></div>
            <div class="col-1">
              <q-input outlined dense class="bg-white" v-model="imapPort"></q-input>
            </div>
            <div class="col-1 q-my-sm q-pl-md">
              <q-checkbox dense v-model="imapSsl" label="SSL" />
            </div>
          </div>
          <div class="row q-mb-md">
            <div class="col-1 q-my-sm required-field" v-t="'MAILWEBCLIENT.LABEL_SMTP_SERVER'"></div>
            <div class="col-3">
              <q-input outlined dense class="bg-white" v-model="smtpServer"></q-input>
            </div>
            <div class="col-1 q-my-sm text-right q-pr-md required-field" v-t="'MAILWEBCLIENT.LABEL_PORT'"></div>
            <div class="col-1">
              <q-input outlined dense class="bg-white" v-model="smtpPort"></q-input>
            </div>
            <div class="col-1 q-my-sm q-pl-md">
              <q-checkbox dense v-model="smtpSsl" :label="$t('MAILWEBCLIENT.LABEL_SSL')" />
            </div>
          </div>
          <div class="row q-mb-md">
            <div class="col-1"></div>
            <div class="col-6">
              <q-item-label v-t="'MAILWEBCLIENT.LABEL_SMTP_AUTHENTICATION'" />
              <q-list dense>
                <q-item tag="label">
                  <q-item-section class="q-pr-none">
                    <q-radio v-model="smtpAuthentication" :val="smtpAuthTypeEnum.NoAuthentication" :label="$t('MAILWEBCLIENT.LABEL_USE_SPECIFIED_CREDENTIALS')" />
                  </q-item-section>
                </q-item>
                <q-item tag="label">
                  <q-item-section avatar>
                    <q-radio v-model="smtpAuthentication" :val="smtpAuthTypeEnum.UseSpecifiedCredentials" :label="$t('MAILWEBCLIENT.LABEL_USE_SPECIFIED_CREDENTIALS')" />
                  </q-item-section>
                  <q-item-section>
                    <q-input outlined dense class="bg-white" v-model="smtpLogin" :placeholder="$t('COREWEBCLIENT.LABEL_LOGIN')"></q-input>
                  </q-item-section>
                  <q-item-section>
                    <q-input outlined dense class="bg-white" type="password" v-model="smtpPassword" :placeholder="$t('COREWEBCLIENT.LABEL_PASSWORD')"></q-input>
                  </q-item-section>
                </q-item>
                <q-item tag="label">
                  <q-item-section>
                    <q-radio v-model="smtpAuthentication" :val="smtpAuthTypeEnum.UseUserCredentials" :label="$t('MAILWEBCLIENT.LABEL_USE_USER_CREDENTIALS')" />
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
          <div class="row q-mb-md">
            <div class="col-1"></div>
            <div class="col-9">
              <q-checkbox dense v-model="enableSieve" :label="$t('MAILWEBCLIENT.LABEL_ENABLE_SIEVE')" />
            </div>
          </div>
          <div class="row q-mb-md">
            <div class="col-1 q-my-sm" v-t="'MAILWEBCLIENT.LABEL_SIEVE_PORT'"></div>
            <div class="col-3">
              <q-input outlined dense class="bg-white" v-model="sievePort"></q-input>
            </div>
          </div>
          <div class="row q-mb-md">
            <div class="col-1"></div>
            <div class="col-9">
              <q-checkbox dense v-model="useThreading" :label="$t('MAILWEBCLIENT.LABEL_USE_THREADING')" />
            </div>
          </div>
          <div class="row q-mb-sm">
            <div class="col-1"></div>
            <div class="col-9">
              <q-checkbox dense v-model="useFullEmail"
                          :label="$t('MAILWEBCLIENT.LABEL_USE_FULL_EMAIL_ADDRESS_AS_LOGIN')" />
            </div>
          </div>
          <div class="row q-mb-md">
            <div class="col-1"></div>
            <div class="col-9">
              <q-item-label caption v-t="'MAILWEBCLIENT.LABEL_HINT_USE_FULL_EMAIL_ADDRESS_AS_LOGIN'" />
            </div>
          </div>
        </q-card-section>
      </q-card>
      <div class="q-pa-md text-right" v-if="showServerFields">
        <q-btn unelevated no-caps dense class="q-px-sm" :ripple="false" color="primary" @click="save"
               :label="saving ? $t('COREWEBCLIENT.ACTION_SAVE_IN_PROGRESS') : $t('COREWEBCLIENT.ACTION_SAVE')">
        </q-btn>
      </div>
    </div>
    <ConfirmDialog ref="confirmDialog" />
    <UnsavedChangesDialog ref="unsavedChangesDialog" />
  </q-scroll-area>
</template>

<script>
import _ from 'lodash'

import errors from 'src/utils/errors'
import notification from 'src/utils/notification'
import typesUtils from 'src/utils/types'
import webApi from 'src/utils/web-api'

import settings from 'src/../../../MailWebclient/vue/settings'
import cache from 'src/../../../MailWebclient/vue/cache'

import ConfirmDialog from 'src/components/ConfirmDialog'
import UnsavedChangesDialog from 'src/components/UnsavedChangesDialog'

export default {
  name: 'MailAdminSettings',

  components: {
    ConfirmDialog,
    UnsavedChangesDialog,
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

      editMode: true,
      showServerFields: false,

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

      saving: false,
    }
  },

  computed: {
    showPagination () {
      return this.servers.length < this.totalCount
    },
    pagesCount () {
      return Math.ceil(this.totalCount / this.limit)
    },
  },

  watch: {
    $route (to, from) {
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
    },
    selectedPage () {
      if (this.selectedPage !== this.page) {
        this.route()
      }
    },
  },

  beforeRouteLeave (to, from, next) {
    if (this.hasChanges() && _.isFunction(this?.$refs?.unsavedChangesDialog?.openConfirmDiscardChangesDialog)) {
      this.$refs.unsavedChangesDialog.openConfirmDiscardChangesDialog(next)
    } else {
      next()
    }
  },

  mounted () {
    this.saving = false
    this.populate()
  },

  methods: {
    route (serverId = 0) {
      const searchRoute = this.enteredSearch !== '' ? ('/search/' + this.enteredSearch) : ''
      const selectedPage = (this.search !== this.enteredSearch) ? 1 : this.selectedPage
      const pageRoute = selectedPage > 1 ? ('/page/' + selectedPage) : ''
      const idRoute = serverId > 0 ? ('/id/' + serverId) : ''
      const path = '/system/mail-servers' + searchRoute + pageRoute + idRoute
      if (path !== this.$route.path) {
        this.$router.push('/system/mail-servers' + searchRoute + pageRoute + idRoute)
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
      }
    },

    hasChanges () {
      const server = this.getServer(this.currentServerId)
      if (server) {
        return server.name !== this.serverName || server.incomingServer !== this.imapServer ||
            server.incomingPort !== this.imapPort || server.incomingUseSsl !== this.imapSsl ||
            server.outgoingServer !== this.smtpServer || server.outgoingPort !== this.smtpPort ||
            server.outgoingUseSsl !== this.smtpSsl || server.domains !== this.domains ||
            server.smtpAuthType !== this.smtpAuthentication || server.smtpLogin !== this.smtpLogin ||
            server.smtpPassword !== this.smtpPassword || server.enableSieve !== this.enableSieve ||
            server.sievePort !== this.sievePort || server.enableThreading !== this.useThreading ||
            server.useFullEmailAddressAsLogin !== this.useFullEmail
      } else {
        return false
      }
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

    save () {
      if (!this.saving) {
        this.saving = true
        const parameters = {
          ServerId: this.currentServerId,
          TenantId: this.currentServerTenantId,
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
        }
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
    askDeleteServer(name, id, tenantId) {
      if (_.isFunction(this?.$refs?.confirmDialog?.openDialog)) {
        this.$refs.confirmDialog.openDialog({
          title: name,
          message: this.$t('MAILWEBCLIENT.CONFIRM_REMOVE_SERVER'),
          okHandler: this.deleteServer.bind(this, id, tenantId)
        })
      }
    },
    deleteServer(id, tenantId) {
      this.loadingServers = true
      webApi.sendRequest({
        moduleName: 'Mail',
        methodName: 'DeleteServer',
        parameters: {
          ServerId: id,
          TenantId: tenantId,
          DeletionConfirmedByAdmin: true
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
