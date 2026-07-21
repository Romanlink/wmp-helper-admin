<template>
  <div class="app-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <img
          :src="isLight ? '/assets/logo-blue.png' : '/assets/logo-white.png'"
          alt="Kayakwise"
          class="brand-logo-img"
          draggable="false"
        />
        <div class="brand-divider"></div>
      </div>

      <!-- 导航菜单 -->
      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item" active-class="nav-item--active">
          <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
          <span>仪表盘</span>
        </router-link>

        <router-link to="/browse" class="nav-item" active-class="nav-item--active">
          <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span>文档浏览</span>
        </router-link>

        <router-link to="/search" class="nav-item" active-class="nav-item--active">
          <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span>全站检索</span>
        </router-link>

        <router-link to="/doc-convert" class="nav-item" active-class="nav-item--active">
          <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M9 15l2 2 4-4"/>
          </svg>
          <span>文档转换</span>
        </router-link>
      </nav>

      <!-- 底部信息 -->
      <div class="sidebar-footer">
        <div class="status-dot"></div>
        <div class="footer-user">
          <span class="text-sm text-muted">{{ userInfo.realName || userInfo.username || '系统运行中' }}</span>
        </div>
        <button class="logout-btn" title="退出登录" @click="handleLogout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <header class="topbar">
        <h2 class="page-title">{{ pageTitle }}</h2>
        <div class="topbar-actions">
          <button class="theme-toggle" @click="toggleTheme" :title="isLight ? '切换暗色主题' : '切换浅色主题'">
            <!-- 太阳图标 (浅色模式) -->
            <svg v-if="isLight" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <!-- 月亮图标 (暗色模式) -->
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          </button>
        </div>
      </header>
      <div class="content-area" :class="{ 'content-area--flush': isBrowse }">
        <router-view />
      </div>
    </main>

    <!-- 全局 Toast -->
    <Toast />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logout as logoutApi } from '@/api/auth'
import Toast from '@/components/Toast.vue'

const route = useRoute()
const router = useRouter()
const pageTitle = computed(() => route.meta?.title || 'Helper')
const isBrowse = computed(() => route.name === 'DocBrowser')

// ===== 当前用户信息 =====
const userInfo = ref({})

onMounted(() => {
  try {
    const stored = localStorage.getItem('helper-user')
    if (stored) {
      userInfo.value = JSON.parse(stored)
    }
  } catch (e) {
    // ignore
  }
})

// ===== 退出登录 =====
async function handleLogout() {
  try {
    await logoutApi()
  } catch (e) {
    // 即使 API 失败也继续清除
  }
  localStorage.removeItem('helper-token')
  localStorage.removeItem('helper-user')
  router.push('/login')
}

// ===== 主题切换 =====
const isLight = ref(document.documentElement.getAttribute('data-theme') === 'light')

function toggleTheme() {
  isLight.value = !isLight.value
  const theme = isLight.value ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('helper-theme', theme)
}
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: var(--bg-root);
}

/* ========== 侧边栏 ========== */

.sidebar {
  width: 165px;
  min-width: 165px;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 0;
  user-select: none;
}

/* logo 栏高度与右侧 topbar 对齐（均为 60px），使上下分隔线齐平 */
.sidebar-brand {
  height: 60px;
  padding: 0 14px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(180deg, var(--bg-primary) 0%, rgba(var(--accent-rgb, 32,97,202), 0.04) 100%);
}

.brand-logo-img {
  height: 30px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.08));
  transition: opacity 0.2s;
}
.brand-logo-img:hover { opacity: 0.85; }

.brand-divider { display: none; }

.brand-product { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.product-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 2px;
  text-transform: uppercase;
}
.product-desc {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  transition: all var(--transition);
  position: relative;
}
.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.nav-item--active {
  background: var(--accent-dim);
  color: var(--accent-hover);
}
.nav-item--active::before {
  content: '';
  position: absolute;
  left: 0; top: 50%; transform: translateY(-50%);
  width: 3px; height: 20px;
  background: var(--accent);
  border-radius: 0 3px 3px 0;
}

.nav-icon { flex-shrink: 0; }

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-user {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: var(--bg-hover);
  color: var(--danger, #ef4444);
}

.status-dot {
  width: 8px; height: 8px;
  background: var(--success);
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(52,211,153,0.5);
}

/* ========== 主内容区 ========== */

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topbar {
  height: 60px;
  min-height: 60px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.3px;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
}

/* 文档浏览页面去掉内边距，撑满全高 */
.content-area--flush {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
