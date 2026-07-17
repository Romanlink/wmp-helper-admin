import http from './http'

// ======================== 菜单 API ========================

export function listModules() {
  return http.get('/modules')
}

export function searchModules(keyword) {
  return http.get('/modules/search', { params: { keyword } })
}

export function getModuleChildren(parentId) {
  return http.get('/modules/children', { params: { parentId } })
}

export function getModuleById(id) {
  return http.get(`/modules/${id}`)
}

export function createModule(data) {
  return http.post('/modules', data)
}

export function updateModule(id, data) {
  return http.put(`/modules/${id}`, data)
}

export function deleteModule(id) {
  return http.delete(`/modules/${id}`)
}
