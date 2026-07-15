import http from './http'

// ======================== 菜单 API ========================

export function listMenus() {
  return http.get('/menus')
}

export function searchMenus(keyword) {
  return http.get('/menus/search', { params: { keyword } })
}

export function getMenuChildren(parentId) {
  return http.get('/menus/children', { params: { parentId } })
}

export function getMenuById(id) {
  return http.get(`/menus/${id}`)
}

export function createMenu(data) {
  return http.post('/menus', data)
}

export function updateMenu(id, data) {
  return http.put(`/menus/${id}`, data)
}

export function deleteMenu(id) {
  return http.delete(`/menus/${id}`)
}
