import axios from 'axios'

const http = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// ==================== 请求拦截器：自动附加 Token ====================
http.interceptors.request.use(
  config => {
    const token = localStorage.getItem('helper-token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  err => Promise.reject(err)
)

// ==================== 响应拦截器：统一处理响应 + 401 ====================
http.interceptors.response.use(
  res => {
    // 二进制下载（responseType: 'blob'）直接透传 Blob，切勿按 JSON 解析，
    // 否则会把合法的文档流误判为失败并 reject。
    if (res.config && res.config.responseType === 'blob') {
      return res.data
    }
    const { code, message, data } = res.data
    if (code === 0 || code === 200) return data
    return Promise.reject(new Error(message || '请求失败'))
  },
  err => {
    // 401 未授权 — 清除 token 并跳转登录页
    if (err.response && err.response.status === 401) {
      const msg = err.response.data?.message || '登录已过期'

      // 如果是被其他设备登录替换，提示用户
      if (msg.includes('已在其他设备登录')) {
        // 避免重复弹窗
        if (!sessionStorage.getItem('helper-kicked')) {
          sessionStorage.setItem('helper-kicked', '1')
          alert(msg)
          sessionStorage.removeItem('helper-kicked')
        }
      }

      // 清除本地登录信息
      localStorage.removeItem('helper-token')
      localStorage.removeItem('helper-user')

      // 跳转登录页（hash 模式）
      if (location.hash !== '#/login') {
        location.hash = '#/login'
      }
    }
    // 对于 blob 错误响应（如下载接口返回 404 的 JSON），从中读取真实错误信息
    if (err.response && err.response.config && err.response.config.responseType === 'blob'
        && err.response.data && typeof err.response.data.text === 'function') {
      return err.response.data.text().then(text => {
        let msg = '下载失败'
        try {
          const j = JSON.parse(text)
          msg = j.message || msg
        } catch (_) { /* 非 JSON，保留默认提示 */ }
        return Promise.reject(new Error(msg))
      })
    }
    return Promise.reject(err)
  }
)

export default http
