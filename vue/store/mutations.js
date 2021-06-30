import Vue from 'vue'

export function setTenantServers (state, { tenantId, servers }) {
  Vue.set(state.serversByTenants, tenantId, servers)
}
