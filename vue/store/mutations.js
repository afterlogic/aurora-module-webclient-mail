export function setTenantServers (state, { tenantId, servers }) {
  state.serversByTenants[tenantId] = servers
}
