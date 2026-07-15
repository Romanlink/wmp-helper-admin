<template>
  <div class="menu-manage">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="keyword" @input="onSearch" placeholder="搜索菜单名称..." />
      </div>
      <button class="btn btn-primary" @click="openCreate">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        新增菜单
      </button>
    </div>

    <!-- 菜单表格 -->
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th style="width:60px">序号</th>
            <th style="width:40px"></th>
            <th>菜单名称</th>
            <th style="width:160px">路由路径</th>
            <th style="width:80px">排序</th>
            <th style="width:90px">状态</th>
            <th style="width:100px">更新时间</th>
            <th style="width:140px">操作</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="menu in menus" :key="menu.id">
            <tr>
              <td class="text-muted">{{ menu.id }}</td>
              <td>
                <button
                  v-if="hasChildren(menu.id)"
                  class="btn btn-icon btn-sm btn-ghost expand-btn"
                  :class="{ expanded: expandedRows.has(menu.id) }"
                  @click="toggleExpand(menu.id)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </td>
              <td>
                <div class="menu-name-cell">
                  <span v-if="menu.parentId === 0" class="tag tag-primary" style="margin-right:8px">顶级</span>
                  <span class="menu-name">{{ menu.menuName }}</span>
                </div>
              </td>
              <td class="text-muted text-sm">{{ menu.menuPath || '—' }}</td>
              <td>{{ menu.sortOrder }}</td>
              <td>
                <span v-if="menu.isVisible" class="tag tag-success">展示</span>
                <span v-else class="tag tag-warning">隐藏</span>
              </td>
              <td class="text-muted text-sm">{{ formatDate(menu.updateTime) }}</td>
              <td>
                <div class="action-btns">
                  <button class="btn btn-sm btn-secondary" @click="openEdit(menu)">编辑</button>
                  <button class="btn btn-sm btn-danger" @click="confirmDelete(menu)">删除</button>
                </div>
              </td>
            </tr>
            <!-- 子菜单行 -->
            <template v-if="expandedRows.has(menu.id)">
              <tr v-if="childMenus[menu.id]?.length">
                <td colspan="8" style="padding:0">
                  <div class="child-table">
                    <table>
                      <tbody>
                        <tr v-for="child in childMenus[menu.id]" :key="child.id" class="child-row">
                          <td style="width:100px" class="text-muted">{{ child.id }}</td>
                          <td style="width:40px"></td>
                          <td>
                            <span style="margin-left:20px">└ {{ child.menuName }}</span>
                          </td>
                          <td style="width:160px" class="text-muted text-sm">{{ child.menuPath || '—' }}</td>
                          <td style="width:80px">{{ child.sortOrder }}</td>
                          <td style="width:90px">
                            <span v-if="child.isVisible" class="tag tag-success">展示</span>
                            <span v-else class="tag tag-warning">隐藏</span>
                          </td>
                          <td style="width:100px" class="text-muted text-sm">{{ formatDate(child.updateTime) }}</td>
                          <td style="width:140px">
                            <div class="action-btns">
                              <button class="btn btn-sm btn-secondary" @click.stop="openEdit(child)">编辑</button>
                              <button class="btn btn-sm btn-danger" @click.stop="confirmDelete(child)">删除</button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
              <tr v-else>
                <td colspan="8" style="padding:12px 16px; color:var(--text-muted); text-align:center">暂无子菜单</td>
              </tr>
            </template>
          </template>
          <tr v-if="!menus.length">
            <td colspan="8" class="text-center" style="padding:48px 0">
              <div class="text-muted">暂无菜单数据</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal">
        <div class="modal-header">
          <span>{{ editing ? '编辑菜单' : '新增菜单' }}</span>
          <button class="btn btn-icon btn-sm btn-ghost" @click="showForm = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">菜单名称 <span style="color:var(--text-danger)">*</span></label>
            <input v-model="form.menuName" placeholder="4-6个中文汉字" maxlength="6" />
          </div>
          <div class="form-group">
            <label class="form-label">父菜单</label>
            <select v-model.number="form.parentId">
              <option :value="0">顶级菜单</option>
              <option v-for="m in topLevelMenus" :key="m.id" :value="m.id">{{ m.menuName }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">路由路径</label>
            <input v-model="form.menuPath" placeholder="/system/menu" />
          </div>
          <div class="form-group">
            <label class="form-label">图标名称</label>
            <input v-model="form.menuIcon" placeholder="el-icon-setting" />
          </div>
          <div class="form-group">
            <label class="form-label">排序序号</label>
            <input v-model.number="form.sortOrder" type="number" placeholder="0" />
          </div>
          <div class="form-group">
            <label class="form-label">是否展示</label>
            <select v-model.number="form.isVisible">
              <option :value="1">展示</option>
              <option :value="0">隐藏</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showForm = false">取消</button>
          <button class="btn btn-primary" @click="saveMenu" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { listMenus, searchMenus, getMenuChildren, createMenu, updateMenu, deleteMenu } from '@/api/menu'

const menus = ref([])
const keyword = ref('')
const expandedRows = ref(new Set())
const childMenus = ref({})
const showForm = ref(false)
const editing = ref(false)
const saving = ref(false)

const form = ref({
  menuName: '',
  parentId: 0,
  menuPath: '',
  menuIcon: '',
  sortOrder: 0,
  isVisible: 1
})

const topLevelMenus = computed(() => menus.value.filter(m => m.parentId === 0))

async function loadMenus() {
  try {
    menus.value = await listMenus() || []
  } catch (e) {
    menus.value = []
  }
}

async function onSearch() {
  try {
    menus.value = keyword.value
      ? (await searchMenus(keyword.value) || [])
      : (await listMenus() || [])
  } catch {
    menus.value = []
  }
}

function hasChildren(parentId) {
  return menus.value.some(m => m.parentId === parentId)
}

async function toggleExpand(parentId) {
  if (expandedRows.value.has(parentId)) {
    expandedRows.value.delete(parentId)
  } else {
    expandedRows.value.add(parentId)
    try {
      childMenus.value[parentId] = await getMenuChildren(parentId) || []
    } catch {
      childMenus.value[parentId] = []
    }
  }
  expandedRows.value = new Set(expandedRows.value)
}

function openCreate() {
  editing.value = false
  form.value = { menuName: '', parentId: 0, menuPath: '', menuIcon: '', sortOrder: 0, isVisible: 1 }
  showForm.value = true
}

function openEdit(menu) {
  editing.value = true
  form.value = {
    id: menu.id,
    menuName: menu.menuName,
    parentId: menu.parentId,
    menuPath: menu.menuPath || '',
    menuIcon: menu.menuIcon || '',
    sortOrder: menu.sortOrder || 0,
    isVisible: menu.isVisible ? 1 : 0
  }
  showForm.value = true
}

async function saveMenu() {
  if (!form.value.menuName?.trim()) {
    alert('请输入菜单名称')
    return
  }
  saving.value = true
  try {
    if (editing.value) {
      await updateMenu(form.value.id, {
        menuName: form.value.menuName.trim(),
        parentId: form.value.parentId,
        menuPath: form.value.menuPath,
        menuIcon: form.value.menuIcon,
        sortOrder: form.value.sortOrder,
        isVisible: !!form.value.isVisible
      })
    } else {
      await createMenu({
        menuName: form.value.menuName.trim(),
        parentId: form.value.parentId,
        menuPath: form.value.menuPath,
        menuIcon: form.value.menuIcon,
        sortOrder: form.value.sortOrder,
        isVisible: !!form.value.isVisible
      })
    }
    showForm.value = false
    await loadMenus()
  } catch (e) {
    alert('保存失败: ' + e.message)
  } finally {
    saving.value = false
  }
}

async function confirmDelete(menu) {
  if (!confirm(`确定删除菜单「${menu.menuName}」吗？子菜单也会一并删除。`)) return
  try {
    await deleteMenu(menu.id)
    expandedRows.value.delete(menu.id)
    expandedRows.value = new Set(expandedRows.value)
    await loadMenus()
  } catch (e) {
    alert('删除失败: ' + e.message)
  }
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

onMounted(loadMenus)
</script>

<style scoped>
.menu-manage { display: flex; flex-direction: column; gap: 20px; }

.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }

.search-box {
  position: relative; width: 300px;
}
.search-icon {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  color: var(--text-muted); pointer-events: none;
}
.search-box input { padding-left: 38px; }

.expand-btn { transition: transform var(--transition); }
.expand-btn.expanded { transform: rotate(90deg); }

.menu-name-cell { display: flex; align-items: center; }
.menu-name { font-weight: 500; }

.child-table { background: rgba(0,0,0,0.15); border-top: 1px solid var(--border-color); }
.child-row:hover { background: var(--bg-hover) !important; }

.action-btns { display: flex; gap: 6px; }
</style>
