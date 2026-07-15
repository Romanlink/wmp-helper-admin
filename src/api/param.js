import http from './http'

// ======================== 系统参数 API ========================

/**
 * 查询单个系统参数
 * @param {string} paramId - 参数标识（如 doc_editable）
 * @returns {{ paramId, paramValue, paramDesc }}
 */
export function getParam(paramId) {
  return http.get(`/params/${paramId}`)
}
