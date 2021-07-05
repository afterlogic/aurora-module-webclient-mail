import _ from 'lodash'

import errors from 'src/utils/errors'
import notification from 'src/utils/notification'
import typesUtils from 'src/utils/types'
import webApi from 'src/utils/web-api'

import MailServer from './classes/mail-server'

export default {
  getServers (search, page, limit) {
    return new Promise((resolve, reject) => {
      webApi.sendRequest({
        moduleName: 'Mail',
        methodName: 'GetServers',
        parameters: {
          Search: search,
          Offset: limit * (page - 1),
          Limit: limit,
        },
      }).then(result => {
        if (_.isArray(result?.Items)) {
          const servers = _.map(result.Items, function (serverData) {
            return new MailServer(serverData)
          })
          const totalCount = typesUtils.pInt(result.Count)
          resolve({ servers, totalCount, search, page, limit })
        } else {
          resolve({ servers: [], totalCount: 0, search, page, limit })
        }
      }, response => {
        notification.showError(errors.getTextFromResponse(response))
        resolve({ servers: [], totalCount: 0, search, page, limit })
      })
    })
  },
}
