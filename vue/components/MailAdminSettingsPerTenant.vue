<template>
  <q-scroll-area class="full-height full-width">
    <div class="q-pa-lg">
      <div class="row q-mb-md">
        <div class="col text-h5" v-t="'MAILWEBCLIENT.HEADING_SETTINGS_TAB'"/>
      </div>
      <q-card flat bordered class="card-edit-settings">
        <q-card-section>
          <div class="row q-mb-sm">
            <div class="col-2">
              <div class="q-my-sm" v-t="'MAILWEBCLIENT.LABEL_TENANT_SPACE_LIMIT'" />
            </div>
            <div class="col-4">
              <div class="row">
                <q-input outlined dense class="col-5" bg-color="white" v-model="tenantSpaceLimitMb"/>
                <div class="q-ma-sm col-1" style="margin-top: 10px" v-t="'COREWEBCLIENT.LABEL_MEGABYTES'"/>
              </div>
            </div>
          </div>
          <div class="row q-mb-sm">
            <div class="col-2"></div>
            <div class="col-8 q-mb-sm">
              <q-item-label caption>
                {{ $t('MAILWEBCLIENT.HINT_TENANT_SPACE_LIMIT') }}
              </q-item-label>
            </div>
          </div>
          <div class="row" v-if="allowChangeUserSpaceLimit">
            <div class="col-2">
              <div class="q-my-sm" v-t="'MAILWEBCLIENT.LABEL_USER_SPACE_LIMIT'" />
            </div>
            <div class="col-4">
              <div class="row">
                <q-input outlined dense class=" col-5" bg-color="white" v-model="userSpaceLimitMb"/>
                <div class="q-ma-sm col-1" style="margin-top: 10px" v-t="'COREWEBCLIENT.LABEL_MEGABYTES'"/>
              </div>
            </div>
          </div>
          <div class="row q-mb-sm" v-if="allowChangeUserSpaceLimit">
            <div class="col-2"></div>
            <div class="col-8 q-mt-sm">
              <q-item-label caption>
                {{ $t('MAILWEBCLIENT.HINT_USER_SPACE_LIMIT') }}
              </q-item-label>
            </div>
          </div>
          <div class="row">
            <div class="col-2" v-t="'MAILWEBCLIENT.LABEL_ALLOCATED_TENANT_SPACE'" />
            <div class="col-4">
              <span>{{ allocatedSpace }}</span>
              <span class="q-mx-sm q-pb-sm col-1" v-t="'COREWEBCLIENT.LABEL_MEGABYTES'" />
            </div>
          </div>
        </q-card-section>
      </q-card>
      <div class="q-pt-md text-right">
        <q-btn unelevated no-caps dense class="q-px-sm" :ripple="false" color="primary"
               :label="$t('COREWEBCLIENT.ACTION_SAVE')"
               @click="save"/>
      </div>
    </div>
    <q-inner-loading style="justify-content: flex-start;" :showing="loading || saving">
      <q-linear-progress query />
    </q-inner-loading>
  </q-scroll-area>
</template>

<script>
import errors from 'src/utils/errors'
import notification from 'src/utils/notification'
import types from 'src/utils/types'
import webApi from 'src/utils/web-api'

export default {
  name: 'MailAdminSettingsPerTenant',

  data () {
    return {
      saving: false,
      loading: false,
      tenantSpaceLimitMb: '',
      userSpaceLimitMb: '',
      allocatedSpace: '',
      tenant: null,
      allowChangeUserSpaceLimit: false
    }
  },

  computed: {
    tenantId () {
      return this.$store.getters['tenants/getCurrentTenantId']
    },

    allTenants () {
      return this.$store.getters['tenants/getTenants']
    },
  },

  watch: {
    allTenants () {
      this.populate()
    },
  },

  beforeRouteLeave (to, from, next) {
    this.doBeforeRouteLeave(to, from, next)
  },

  mounted () {
    this.loading = false
    this.saving = false
    this.populate()
  },

  methods: {
    /**
     * Method is used in doBeforeRouteLeave mixin
     */
    hasChanges () {
      if (this.loading) {
        return false
      }

      const tenantCompleteData = types.pObject(this.tenant?.completeData)
      const tenantSpaceLimitMb = tenantCompleteData['MailWebclient::TenantSpaceLimitMb']
      const userSpaceLimitMb = tenantCompleteData['MailWebclient::UserSpaceLimitMb']
      return types.pInt(this.tenantSpaceLimitMb) !== tenantSpaceLimitMb ||
          (this.allowChangeUserSpaceLimit && types.pInt(this.userSpaceLimitMb) !== userSpaceLimitMb)
    },

    /**
     * Method is used in doBeforeRouteLeave mixin,
     * do not use async methods - just simple and plain reverting of values
     * !! hasChanges method must return true after executing revertChanges method
     */
    revertChanges () {
      const tenantCompleteData = types.pObject(this.tenant?.completeData)
      this.tenantSpaceLimitMb = tenantCompleteData['MailWebclient::TenantSpaceLimitMb']
      this.userSpaceLimitMb = tenantCompleteData['MailWebclient::UserSpaceLimitMb']
    },

    populate() {
      const tenant = this.$store.getters['tenants/getTenant'](this.tenantId)
      if (tenant) {
        if (tenant.completeData['MailWebclient::TenantSpaceLimitMb'] !== undefined) {
          this.loading = false
          this.tenant = tenant
          this.tenantSpaceLimitMb = tenant.completeData['MailWebclient::TenantSpaceLimitMb']
          this.userSpaceLimitMb = tenant.completeData['MailWebclient::UserSpaceLimitMb']
          this.allocatedSpace = tenant.completeData['MailWebclient::AllocatedSpaceMb']
          this.allowChangeUserSpaceLimit = tenant.completeData['MailWebclient::AllowChangeUserSpaceLimit']
        } else {
          this.getSettings()
        }
      }
    },

    save () {
      if (!this.saving) {
        this.saving = true
        const parameters = {
          Type: 'Tenant',
          TenantId: this.tenantId,
          UserSpaceLimitMb: types.pInt(this.userSpaceLimitMb),
          TenantSpaceLimitMb: types.pInt(this.tenantSpaceLimitMb),
        }
        webApi.sendRequest({
          moduleName: 'Mail',
          methodName: 'UpdateEntitySpaceLimits',
          parameters
        }).then(result => {
          this.saving = false
          if (result === true) {
            const data = {
              'MailWebclient::UserSpaceLimitMb': parameters.UserSpaceLimitMb,
              'MailWebclient::TenantSpaceLimitMb': parameters.TenantSpaceLimitMb,
              'MailWebclient::AllocatedSpaceMb': this.allocatedSpace,
            }
            this.$store.commit('tenants/setTenantCompleteData', { id: this.tenantId, data })
            notification.showReport(this.$t('COREWEBCLIENT.REPORT_SETTINGS_UPDATE_SUCCESS'))
          } else {
            notification.showError(this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED'))
          }
        }, response => {
          this.saving = false
          notification.showError(errors.getTextFromResponse(response, this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED')))
        })
      }
    },

    getSettings () {
      this.loading = true
      const parameters = {
        Type: 'Tenant',
        TenantId: this.tenantId,
      }
      webApi.sendRequest({
        moduleName: 'Mail',
        methodName: 'GetEntitySpaceLimits',
        parameters
      }).then(result => {
        this.loading = false
        if (result) {
          const data = {
            'MailWebclient::UserSpaceLimitMb': types.pInt(result.UserSpaceLimitMb),
            'MailWebclient::TenantSpaceLimitMb': types.pInt(result.TenantSpaceLimitMb),
            'MailWebclient::AllocatedSpaceMb': types.pInt(result.AllocatedSpaceMb),
            'MailWebclient::AllowChangeUserSpaceLimit': types.pBool(result.AllowChangeUserSpaceLimit),
          }
          this.$store.commit('tenants/setTenantCompleteData', { id: this.tenantId, data })
        }
      }, response => {
        notification.showError(errors.getTextFromResponse(response))
      })
    },
  }
}
</script>

<style scoped>

</style>
