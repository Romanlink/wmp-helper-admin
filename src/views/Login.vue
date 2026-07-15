<template>
  <div class="login-page">
    <!-- 左侧 70% 留白区域 -->
    <div class="login-left">
      <div class="left-content">
        <img
          :src="isLight ? '/assets/logo-blue.png' : '/assets/logo-white.png'"
          alt="Kayakwise"
          class="left-logo"
          draggable="false"
        />
        <div class="left-tagline">HELPER</div>
      </div>
    </div>

    <!-- 右侧 30% 登录区域 -->
    <div class="login-right">
      <div class="login-card">
        <h1 class="login-title">欢迎登录</h1>
        <p class="login-subtitle">请输入您的账号信息</p>

        <form class="login-form" @submit.prevent="handleLogin">
          <!-- 用户名 -->
          <div class="form-group">
            <label class="form-label">用户名</label>
            <div class="input-wrap" :class="{ 'input-wrap--error': errors.username }">
              <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                v-model="form.username"
                type="text"
                class="form-input"
                placeholder="请输入用户名"
                autocomplete="username"
                @input="errors.username = ''"
              />
            </div>
            <span v-if="errors.username" class="form-error">{{ errors.username }}</span>
          </div>

          <!-- 密码 -->
          <div class="form-group">
            <label class="form-label">密码</label>
            <div class="input-wrap" :class="{ 'input-wrap--error': errors.password }">
              <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                placeholder="请输入密码"
                autocomplete="current-password"
                @input="errors.password = ''"
              />
              <button type="button" class="pwd-toggle" @click="showPassword = !showPassword" tabindex="-1">
                <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
            <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
          </div>

          <!-- 登录按钮 -->
          <button type="submit" class="login-btn" :disabled="loading">
            <span v-if="!loading">登 录</span>
            <span v-else class="loading-spinner"></span>
          </button>

          <!-- 错误提示 -->
          <transition name="fade">
            <div v-if="loginError" class="login-error-msg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ loginError }}
            </div>
          </transition>
        </form>

        <!-- 提示信息 -->
        <div class="login-hint">
          <p>默认账号: admin / editor / guest</p>
          <p>默认密码: admin123 / editor123 / guest123</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { login as loginApi } from '@/api/auth'

const router = useRouter()

const form = reactive({
  username: '',
  password: ''
})

const errors = reactive({
  username: '',
  password: ''
})

const loading = ref(false)
const showPassword = ref(false)
const loginError = ref('')
const isLight = ref(document.documentElement.getAttribute('data-theme') === 'light')

function validate() {
  let valid = true
  errors.username = ''
  errors.password = ''

  if (!form.username.trim()) {
    errors.username = '请输入用户名'
    valid = false
  }
  if (!form.password) {
    errors.password = '请输入密码'
    valid = false
  }
  return valid
}

async function handleLogin() {
  if (!validate()) return
  if (loading.value) return

  loading.value = true
  loginError.value = ''

  try {
    const data = await loginApi(form.username.trim(), form.password)

    // 存储 token 和用户信息
    localStorage.setItem('helper-token', data.token)
    localStorage.setItem('helper-user', JSON.stringify({
      userId: data.userId,
      username: data.username,
      realName: data.realName,
      roleId: data.roleId,
      roleName: data.roleName,
      roleCode: data.roleCode
    }))

    // 跳转到首页
    router.push('/dashboard')
  } catch (e) {
    loginError.value = e?.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 如果已有 token，直接跳转
  const token = localStorage.getItem('helper-token')
  if (token) {
    router.push('/dashboard')
  }
})
</script>

<style scoped>
.login-page {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: var(--bg-root);
  overflow: hidden;
}

/* ========== 左侧 70% ========== */
.login-left {
  flex: 7;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-root) 100%);
  border-right: 1px solid var(--border-color);
}

.left-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  opacity: 0.5;
}

.left-logo {
  height: 48px;
  width: auto;
  object-fit: contain;
  opacity: 0.6;
}

.left-tagline {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 4px;
}

/* ========== 右侧 30% ========== */
.login-right {
  flex: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  min-width: 320px;
}

.login-card {
  width: 100%;
  max-width: 340px;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.login-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 32px;
}

/* ========== 表单 ========== */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 44px;
  background: var(--bg-hover);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.2s;
}

.input-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}

.input-wrap--error {
  border-color: var(--danger, #ef4444);
}

.input-icon {
  flex-shrink: 0;
  color: var(--text-muted);
}

.form-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: var(--text-primary);
  height: 100%;
}

.form-input::placeholder {
  color: var(--text-muted);
  opacity: 0.7;
}

.pwd-toggle {
  flex-shrink: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color 0.2s;
}

.pwd-toggle:hover {
  color: var(--text-primary);
}

.form-error {
  font-size: 12px;
  color: var(--danger, #ef4444);
}

/* ========== 登录按钮 ========== */
.login-btn {
  margin-top: 6px;
  height: 44px;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--accent-rgb, 32, 97, 202), 0.3);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========== 错误提示 ========== */
.login-error-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  font-size: 13px;
  color: var(--danger, #ef4444);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* ========== 提示信息 ========== */
.login-hint {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.login-hint p {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.8;
  opacity: 0.6;
}
</style>
