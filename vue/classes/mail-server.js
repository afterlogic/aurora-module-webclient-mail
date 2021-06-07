import typesUtils from 'src/utils/types'

import core from 'src/core'

import settings from 'src/../../../MailWebclient/vue/settings'

const smtpAuthTypeEnum = settings.getSmtpAuthTypeEnum()

class MailServer {
  constructor(serverData) {
    this.id = typesUtils.pInt(serverData?.EntityId) || typesUtils.pInt(serverData?.ServerId)
    this.tenantId = typesUtils.pInt(serverData?.TenantId)
    this.tenantName = core.getTenantName(this.tenantId)
    this.name = typesUtils.pString(serverData?.Name)
    this.incomingServer = typesUtils.pString(serverData?.IncomingServer)
    this.incomingPort = typesUtils.pInt(serverData?.IncomingPort)
    this.incomingUseSsl = !!serverData?.IncomingUseSsl
    this.outgoingServer = typesUtils.pString(serverData?.OutgoingServer)
    this.outgoingPort = typesUtils.pInt(serverData?.OutgoingPort)
    this.outgoingUseSsl = !!serverData?.OutgoingUseSsl
    this.domains = typesUtils.pString(serverData?.Domains)
    this.smtpAuthType = typesUtils.pEnum(serverData?.SmtpAuthType, smtpAuthTypeEnum)
    this.smtpLogin = typesUtils.pString(serverData?.SmtpLogin)
    this.smtpPassword = typesUtils.pString(serverData?.SmtpPassword)
    this.enableSieve = !!serverData?.EnableSieve
    this.sievePort = typesUtils.pInt(serverData?.SievePort, 4190)
    this.enableThreading = !!(serverData?.EnableThreading)
    this.useFullEmailAddressAsLogin = !!(serverData?.UseFullEmailAddressAsLogin)

    this.setExternalAccessServers = !!(serverData?.SetExternalAccessServers)
    this.externalAccessImapServer = typesUtils.pString(serverData?.ExternalAccessImapServer)
    this.externalAccessImapPort = typesUtils.pInt(serverData?.ExternalAccessImapPort, 143)
    this.externalAccessSmtpServer = typesUtils.pString(serverData?.ExternalAccessSmtpServer)
    this.externalAccessSmtpPort = typesUtils.pInt(serverData?.ExternalAccessSmtpPort, 25)

    this.allowToDelete = !!(serverData?.AllowToDelete);
    this.allowEditDomains = !!(serverData?.AllowEditDomains)
    this.ownerType = typesUtils.pString(serverData?.OwnerType)

    this.oauthEnable = !!(serverData?.OAuthEnable)
    this.oauthName = typesUtils.pString(serverData?.OAuthName)
    this.oauthType = typesUtils.pString(serverData?.OAuthType)
    this.oauthIconUrl = typesUtils.pString(serverData?.OAuthIconUrl)
  }

  update (parameters) {
    this.name = parameters.Name
    this.incomingServer = parameters.IncomingServer
    this.incomingPort = parameters.IncomingPort
    this.incomingUseSsl = parameters.IncomingUseSsl
    this.outgoingServer = parameters.OutgoingServer
    this.outgoingPort = parameters.OutgoingPort
    this.outgoingUseSsl = parameters.OutgoingUseSsl
    this.domains = parameters.Domains
    this.smtpAuthType = parameters.SmtpAuthType
    this.smtpLogin = parameters.SmtpLogin
    this.smtpPassword = parameters.SmtpPassword
    this.enableSieve = parameters.EnableSieve
    this.sievePort = parameters.SievePort
    this.enableThreading = parameters.EnableThreading
    this.useFullEmailAddressAsLogin = parameters.UseFullEmailAddressAsLogin

    this.setExternalAccessServers = parameters.SetExternalAccessServers
    this.externalAccessImapServer = parameters.ExternalAccessImapServer
    this.externalAccessImapPort = parameters.ExternalAccessImapPort
    this.externalAccessSmtpServer = parameters.ExternalAccessSmtpServer
    this.externalAccessSmtpPort = parameters.ExternalAccessSmtpPort
  }
}

export default MailServer
