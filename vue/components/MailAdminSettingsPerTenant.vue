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
                <q-input outlined dense class="bg-white  col-5" v-model="tenantSpaceLimitMb"/>
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
                <q-input outlined dense class=" col-5 bg-white" v-model="userSpaceLimitMb"/>
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
            <div class="col-2">
              <div class="q-my-sm" v-t="'MAILWEBCLIENT.LABEL_ALLOCATED_TENANT_SPACE'" />
            </div>
            <div class="col-4">
              <div class="row">
                <span class="q-mt-sm">{{ allocatedSpace }}</span>
                <div class="q-ma-sm q-pb-sm col-1" v-t="'COREWEBCLIENT.LABEL_MEGABYTES'"/>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
      <div class="q-pt-md text-right">
        <q-btn unelevated no-caps dense class="q-px-sm" :ripple="false" color="primary"
               :label="saving ? $t('COREWEBCLIENT.ACTION_SAVE_IN_PROGRESS') : $t('COREWEBCLIENT.ACTION_SAVE')"
               @click="updateEntitySpaceLimits"/>
      </div>
    </div>
    <UnsavedChangesDialog ref="unsavedChangesDialog"/>
    <q-inner-loading style="justify-content: flex-start;" :showing="loading || saving">
      <q-linear-progress query />
    </q-inner-loading>
  </q-scroll-area>
</template>

<script>
import UnsavedChangesDialog from 'src/components/UnsavedChangesDialog'
import webApi from 'src/utils/web-api'
import notification from 'src/utils/notification'
import errors from 'src/utils/errors'
import cache from 'src/cache'
import types from '../../../AdminPanelWebclient/vue/src/utils/types'
import _ from 'lodash'

export default {
  name: 'MailAdminSettingsPerTenant',
  components: {
    UnsavedChangesDialog
  },
  computed: {
    tenantId () {
      return Number(this.$route?.params?.id)
    }
  },
  mounted () {
    this.saving = false
    this.populate()
  },
  data () {
    return {
      saving: false,
      loading: false,
      tenantSpaceLimitMb: 0,
      userSpaceLimitMb: 0,
      allocatedSpace: 0,
      tenant: null,
      allowChangeUserSpaceLimit: false
    }
  },
  beforeRouteLeave (to, from, next) {
    if (this.hasChanges() && _.isFunction(this?.$refs?.unsavedChangesDialog?.openConfirmDiscardChangesDialog)) {
      this.$refs.unsavedChangesDialog.openConfirmDiscardChangesDialog(next)
    } else {
      next()
    }
  },
  methods: {
    hasChanges () {
      const tenantSpaceLimitMb = this.tenant?.completeData['MailWebclient::TenantSpaceLimitMb']
      const userSpaceLimitMb = this.tenant?.completeData['MailWebclient::UserSpaceLimitMb']
      return this.tenantSpaceLimitMb !== tenantSpaceLimitMb ||
          this.userSpaceLimitMb !== userSpaceLimitMb
    },
    populate() {
      this.loading = true
      cache.getTenant(this.tenantId).then(({ tenant }) => {
        if (tenant.completeData['MailWebclient::TenantSpaceLimitMb'] !== undefined) {
          this.loading = false
          this.tenant = tenant
          this.tenantSpaceLimitMb = tenant.completeData['MailWebclient::TenantSpaceLimitMb']
          this.userSpaceLimitMb = tenant.completeData['MailWebclient::UserSpaceLimitMb']
          this.allocatedSpace = tenant.completeData['MailWebclient::AllocatedSpaceMb']
          this.allowChangeUserSpaceLimit = tenant.completeData['MailWebclient::AllowChangeUserSpaceLimit']
        } else {
          this.getSettingsForEntity()
        }
      })
    },
    getSettingsForEntity () {
      const parameters = {
        Type: 'Tenant',
        TenantId: this.tenantId,
      }
      webApi.sendRequest({
        moduleName: 'Mail',
        methodName: 'GetEntitySpaceLimits',
        parameters
      }).then(result => {
        if (result) {
          cache.getTenant(parameters.TenantId, true).then(({ tenant }) => {
            tenant.setCompleteData({
              'MailWebclient::UserSpaceLimitMb': result.UserSpaceLimitMb ? result.UserSpaceLimitMb : 0,
              'MailWebclient::TenantSpaceLimitMb': result.TenantSpaceLimitMb ? result.TenantSpaceLimitMb : 0,
              'MailWebclient::AllocatedSpaceMb': result.AllocatedSpaceMb ? result.AllocatedSpaceMb : 0,
              'MailWebclient::AllowChangeUserSpaceLimit': result.AllowChangeUserSpaceLimit,
            })
            this.populate()
          })
        }
      }, response => {
        notification.showError(errors.getTextFromResponse(response))
      })
    },
    updateEntitySpaceLimits () {
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
          cache.getTenant(parameters.TenantId, true).then(({ tenant }) => {
            tenant.setCompleteData({
              'MailWebclient::UserSpaceLimitMb': parameters.UserSpaceLimitMb,
              'MailWebclient::TenantSpaceLimitMb': parameters.TenantSpaceLimitMb,
              'MailWebclient::AllocatedSpaceMb': this.allocatedSpace,
            })
            this.populate()
          })
          this.saving = false
          if (result) {
            notification.showReport(this.$t('COREWEBCLIENT.REPORT_SETTINGS_UPDATE_SUCCESS'))
          } else {
            notification.showError(this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED'))
          }
        }, response => {
          this.saving = false
          notification.showError(errors.getTextFromResponse(response, this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED')))
        })
      }
    }
  }
}
</script>

<style scoped>

</style>
