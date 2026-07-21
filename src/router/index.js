import { createRouter, createWebHashHistory } from 'vue-router'
import AppLayout from '@/views/AppLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/',
    component: AppLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'browse',
        name: 'DocBrowser',
        component: () => import('@/views/DocBrowser.vue'),
        meta: { title: '文档浏览' }
      },
      {
        path: 'search',
        name: 'GlobalSearch',
        component: () => import('@/views/GlobalSearch.vue'),
        meta: { title: '全站检索' }
      },
      {
        path: 'doc-convert',
        name: 'DocConvert',
        component: () => import('@/views/DocConvert.vue'),
        meta: { title: '文档转换' }
      },
      {
        path: 'menus',
        name: 'ModuleManage',
        component: () => import('@/views/ModuleManage.vue'),
        meta: { title: '菜单管理' }
      },
      {
        path: 'docs',
        name: 'DocManage',
        component: () => import('@/views/DocManage.vue'),
        meta: { title: '文档管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// ==================== 全局前置守卫 ====================
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('helper-token')

  // 登录页：已登录则跳转首页
  if (to.path === '/login') {
    if (token) {
      next('/dashboard')
    } else {
      next()
    }
    return
  }

  // 其他页面：未登录则跳转登录页
  if (!token) {
    next('/login')
    return
  }

  next()
})

export default router
