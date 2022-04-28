import typesUtils from 'src/utils/types'

import store from 'src/store'

import settings from '../settings'

class MailServer {
  constructor(serverData) {
    const smtpAuthTypeEnum = settings.getSmtpAuthTypeEnum()

    this.id = typesUtils.pInt(serverData?.EntityId) || typesUtils.pInt(serverData?.ServerId)
    this.tenantId = typesUtils.pInt(serverData?.TenantId)
    this.tenantName = store.getters['tenants/getTenantName'](this.tenantId)
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
    this.externalAccessImapAlterPort = typesUtils.pInt(serverData?.ExternalAccessImapAlterPort)
    this.externalAccessImapUseSsl = typesUtils.pBool(serverData?.ExternalAccessImapUseSsl, false)

    this.externalAccessPop3Server = typesUtils.pString(serverData?.ExternalAccessPop3Server)
    this.externalAccessPop3Port = typesUtils.pInt(serverData?.ExternalAccessPop3Port, 110)
    this.externalAccessPop3AlterPort = typesUtils.pInt(serverData?.ExternalAccessPop3AlterPort)
    this.externalAccessPop3UseSsl = typesUtils.pBool(serverData?.ExternalAccessPop3UseSsl, false)

    this.externalAccessSmtpServer = typesUtils.pString(serverData?.ExternalAccessSmtpServer)
    this.externalAccessSmtpPort = typesUtils.pInt(serverData?.ExternalAccessSmtpPort, 25)
    this.externalAccessSmtpAlterPort = typesUtils.pInt(serverData?.ExternalAccessSmtpAlterPort)
    this.externalAccessSmtpUseSsl = typesUtils.pBool(serverData?.ExternalAccessSmtpUseSsl, false)

    this.allowToDelete = !!(serverData?.AllowToDelete)
    this.allowEditDomains = !!(serverData?.AllowEditDomains)
    this.ownerType = typesUtils.pString(serverData?.OwnerType)

    this.oauthEnable = !!(serverData?.OAuthEnable)
    this.oauthName = this.oauthEnable ? typesUtils.pString(serverData?.OAuthName) : ''
    this.oauthType = this.oauthEnable ? typesUtils.pString(serverData?.OAuthType) : ''
    this.oauthIconUrl = this.oauthEnable ? typesUtils.pString(serverData?.OAuthIconUrl) : ''
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
    this.externalAccessImapAlterPort = parameters.ExternalAccessImapAlterPort
    this.externalAccessImapUseSsl = parameters.ExternalAccessImapUseSsl
    this.externalAccessPop3Server = parameters.ExternalAccessPop3Server
    this.externalAccessPop3Port = parameters.ExternalAccessPop3Port
    this.externalAccessPop3AlterPort = parameters.ExternalAccessPop3AlterPort
    this.externalAccessPop3UseSsl = parameters.ExternalAccessPop3UseSsl
    this.externalAccessSmtpServer = parameters.ExternalAccessSmtpServer
    this.externalAccessSmtpPort = parameters.ExternalAccessSmtpPort
    this.externalAccessSmtpAlterPort = parameters.ExternalAccessSmtpAlterPort
    this.externalAccessSmtpUseSsl = parameters.ExternalAccessSmtpUseSsl
    
    this.oauthEnable = parameters.OAuthEnable
    this.oauthName = parameters.OAuthName
    this.oauthType = parameters.OAuthType
    this.oauthIconUrl = parameters.OAuthIconUrl
  }
}

export default MailServer
