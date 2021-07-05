import _ from 'lodash'

import errors from 'src/utils/errors'
import notification from 'src/utils/notification'
import webApi from 'src/utils/web-api'

import MailServer from '../classes/mail-server'

export function requestTenantServers (context, tenantId) {
  webApi.sendRequest({
    moduleName: 'Mail',
    methodName: 'GetServers',
    parameters: {
      TenantId: tenantId
    },
  }).then(result => {
    if (_.isArray(result?.Items)) {
      const servers = _.map(result.Items, function (serverData) {
        return new MailServer(serverData)
      })
      context.commit('setTenantServers', { tenantId, servers })
    }
  }, response => {
    notification.showError(errors.getTextFromResponse(response))
  })
}
