<template>
  <q-scroll-area class="full-height full-width">
    <div class="q-pa-lg">
      <div class="row q-mb-md">
        <div class="col text-h5">{{$t('MAILWEBCLIENT.HEADING_SETTINGS_TAB') }}</div>
      </div>
      <q-card flat bordered class="card-edit-settings">
        <q-card-section>
          <div class="row">
            <div class="col-2">
              <div class="q-my-sm">
                {{ $t('MAILWEBCLIENT.LABEL_USER_SPACE_LIMIT') }}
              </div>
            </div>
            <div class="col-4">
              <div class="row">
                <q-input outlined dense class="col-4" bg-color="white" v-model="userSpaceLimitMb"/>
                <div class="q-ma-sm col-1" v-t="'COREWEBCLIENT.LABEL_MEGABYTES'"></div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
      <div class="q-pt-md text-right">
        <q-btn unelevated no-caps dense class="q-px-sm" :ripple="false" color="primary"
               :label="$t('COREWEBCLIENT.ACTION_SAVE')" @click="updateSettingsForEntity"/>
      </div>
    </div>
    <q-inner-loading style="justify-content: flex-start;" :showing="loading || saving">
      <q-linear-progress query />
    </q-inner-loading>
  </q-scroll-area>
</template>

<script>
import _ from 'lodash'

import errors from 'src/utils/errors'
import notification from 'src/utils/notification'
import typesUtils from 'src/utils/types'
import webApi from 'src/utils/web-api'

import cache from 'src/cache'

export default {
  name: 'MailAdminSettingsPerUser',

  data () {
    return {
      user: null,
      userSpaceLimitMb: 0,
      loading: false,
      saving: false,
    }
  },

  watch: {
    $route(to, from) {
      this.parseRoute()
    },
  },

  mounted() {
    this.parseRoute()
  },

  beforeRouteLeave (to, from, next) {
    this.doBeforeRouteLeave(to, from, next)
  },

  methods: {
    /**
     * Method is used in doBeforeRouteLeave mixin
     */
    hasChanges () {
      const limit = _.isFunction(this.user?.getData) ? this.user?.getData('Mail::UserSpaceLimitMb') : 0
      return this.userSpaceLimitMb !== limit
    },

    /**
     * Method is used in doBeforeRouteLeave mixin,
     * do not use async methods - just simple and plain reverting of values
     * !! hasChanges method must return true after executing revertChanges method
     */
    revertChanges () {
      const limit = _.isFunction(this.user?.getData) ? this.user?.getData('Mail::UserSpaceLimitMb') : 0
      this.userSpaceLimitMb = limit
    },

    parseRoute () {
      const userId = typesUtils.pPositiveInt(this.$route?.params?.id)
      if (this.user?.id !== userId) {
        this.user = {
          id: userId,
        }
        this.populate()
      }
    },
    populate () {
      this.loading = true
      const currentTenantId = this.$store.getters['tenants/getCurrentTenantId']
      cache.getUser(currentTenantId, this.user.id).then(({ user, userId }) => {
        if (userId === this.user.id) {
          this.loading = false
          if (user && _.isFunction(user?.getData)) {
            this.user = user
            this.userSpaceLimitMb = user.getData('Mail::UserSpaceLimitMb')
          } else {
            this.$emit('no-user-found')
          }
        }
      })
    },
    updateSettingsForEntity () {
      if (!this.saving) {
        this.saving = true
        const parameters = {
          Type: 'User',
          UserId: this.user?.id,
          TenantId: this.user.tenantId,
          UserSpaceLimitMb: typesUtils.pInt(this.userSpaceLimitMb),
        }
        webApi.sendRequest({
          moduleName: 'Mail',
          methodName: 'UpdateEntitySpaceLimits',
          parameters
        }).then(result => {
          this.saving = false
          if (result) {
            cache.getUser(parameters.TenantId, parameters.EntityId).then(({ user }) => {
              user.updateData([{
                field: 'Mail::UserSpaceLimitMb',
                value: parameters.UserSpaceLimitMb
              }])
              this.populate()
            })
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
  }
}
</script>
