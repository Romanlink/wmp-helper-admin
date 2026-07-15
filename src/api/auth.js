import http from './http'

// ======================== 认证 API ========================

/**
 * 用户登录
 * @param {string} username
 * @param {string} password
 * @returns {{ token, userId, username, realName, roleId, roleName, roleCode }}
 */
export function login(username, password) {
  return http.post('/auth/login', { username, password })
}

/**
 * 用户登出
 */
export function logout() {
  return http.post('/auth/logout')
}

/**
 * 获取当前登录用户信息 + 可访问菜单
 * @returns {{ userId, username, realName, roleId, status, menus }}
 */
export function getUserInfo() {
  return http.get('/auth/info')
}
