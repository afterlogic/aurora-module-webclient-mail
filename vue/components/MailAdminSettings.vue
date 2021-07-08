<template>
  <q-scroll-area class="full-height full-width">
    <div class="q-pa-lg ">
      <div class="row q-mb-md">
        <div class="col text-h5">{{ $t('MAILWEBCLIENT.HEADING_SETTINGS_TAB') }}</div>
      </div>
      <q-card flat bordered class="card-edit-settings">
        <q-card-section>
          <div class="row">
            <div class="col-5">
              <q-checkbox dense v-model="autocreateMailAccountOnNewUserFirstLogin" :label="$t('MAILWEBCLIENT.LABEL_ALLOW_AUTO_PROVISIONING_NEW_USERS')" />
            </div>
          </div>
          <div class="row q-mt-sm q-mb-lg">
            <div class="col-10">
              <q-item-label caption v-html="$t('MAILWEBCLIENT.LABEL_HINT_ALLOW_AUTO_PROVISIONING_NEW_USERS_HTML')"></q-item-label>
            </div>
          </div>
          <div class="row q-mb-md">
            <div class="col-5">
              <q-checkbox dense v-model="allowMultiAccounts" :label="$t('MAILWEBCLIENT.LABEL_ALLOW_USERS_ADD_MAILBOXES')" />
            </div>
          </div>
          <div class="row" v-show="allowHorizontalLayout">
            <div class="col-1" v-t="'MAILWEBCLIENT.LABEL_DEFAULT_LAYOUT'"></div>
            <div class="col-5">
              <q-select outlined dense bg-color="white" v-model="horizontalLayoutByDefault"
                        emit-value map-options :options="layoutOptions" />
            </div>
          </div>
        </q-card-section>
      </q-card>
      <div class="q-pt-md text-right">
        <q-btn unelevated no-caps dense class="q-px-sm" :ripple="false" color="primary" @click="save"
               :label="saving ? $t('COREWEBCLIENT.ACTION_SAVE_IN_PROGRESS') : $t('COREWEBCLIENT.ACTION_SAVE')">
        </q-btn>
      </div>
    </div>
    <UnsavedChangesDialog ref="unsavedChangesDialog" />
  </q-scroll-area>
</template>

<script>
import _ from 'lodash'

import errors from 'src/utils/errors'
import notification from 'src/utils/notification'
import webApi from 'src/utils/web-api'

import settings from '../settings'

import UnsavedChangesDialog from 'src/components/UnsavedChangesDialog'

export default {
  name: 'MailAdminSettings',

  components: {
    UnsavedChangesDialog,
  },

  data() {
    return {
      autocreateMailAccountOnNewUserFirstLogin: true,
      allowMultiAccounts: false,
      allowHorizontalLayout: false,
      horizontalLayoutByDefault: false,
      layoutOptions: [
        { label: this.$t('MAILWEBCLIENT.LABEL_VERT_SPLIT_LAYOUT'), value: false },
        { label: this.$t('MAILWEBCLIENT.LABEL_HORIZ_SPLIT_LAYOUT'), value: true }
      ],
      saving: false,
    }
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
    populate () {
      const data = settings.getEditableByAdmin()
      this.autocreateMailAccountOnNewUserFirstLogin = data.autocreateMailAccountOnNewUserFirstLogin
      this.allowMultiAccounts = data.allowMultiAccounts
      this.allowHorizontalLayout = data.allowHorizontalLayout
      this.horizontalLayoutByDefault = data.horizontalLayoutByDefault
    },

    hasChanges () {
      const data = settings.getEditableByAdmin()
      return this.autocreateMailAccountOnNewUserFirstLogin !== data.autocreateMailAccountOnNewUserFirstLogin ||
          this.allowMultiAccounts !== data.allowMultiAccounts ||
          this.allowHorizontalLayout !== data.allowHorizontalLayout ||
          this.horizontalLayoutByDefault !== data.horizontalLayoutByDefault
    },

    save () {
      if (!this.saving) {
        this.saving = true
        const parameters = {
          AutocreateMailAccountOnNewUserFirstLogin: this.autocreateMailAccountOnNewUserFirstLogin,
          AllowAddAccounts: this.allowMultiAccounts,
          HorizontalLayoutByDefault: this.horizontalLayoutByDefault,
        }
        webApi.sendRequest({
          moduleName: 'Mail',
          methodName: 'UpdateSettings',
          parameters,
        }).then(result => {
          this.saving = false
          if (result === true) {
            settings.saveEditableByAdmin({
              autocreateMailAccountOnNewUserFirstLogin: parameters.AutocreateMailAccountOnNewUserFirstLogin,
              allowMultiAccounts: parameters.AllowAddAccounts,
              horizontalLayoutByDefault: parameters.HorizontalLayoutByDefault,
            })
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
  },
}
</script>

<style scoped>

</style>
