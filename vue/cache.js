import _ from 'lodash'

import errors from 'src/utils/errors'
import notification from 'src/utils/notification'
import typesUtils from 'src/utils/types'
import webApi from 'src/utils/web-api'

import MailServer from 'src/../../../MailWebclient/vue/classes/mail-server'

class MailCache {
  constructor(appData) {
    this.servers = null
    this.totalServersCount = 0
  }

  setServers (result) {
    if (_.isArray(result?.Items)) {
      this.servers = _.map(result.Items, function (serverData) {
        return new MailServer(serverData)
      })
      this.totalServersCount = typesUtils.pInt(result.Count)
    } else {
      this.servers = []
    }
  }

  requestServers () {
    return new Promise((resolve, reject) => {
      webApi.sendRequest({
        moduleName: 'Mail',
        methodName: 'GetServers',
        parameters: {},
      }).then(result => {
        this.setServers(result)
        resolve()
      }, response => {
        notification.showError(errors.getTextFromResponse(response))
        this.servers = []
        resolve()
      })
    })
  }
}

let cache = new MailCache()

export default {
  getServers () {
    return new Promise((resolve, reject) => {
      if (typesUtils.isNonEmptyArray(cache.servers)) {
        resolve(cache.servers)
      } else {
        cache.requestServers().then(() => {
          resolve(cache.servers)
        })
      }
    })
  },
}
