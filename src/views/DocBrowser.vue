<template>
  <div class="doc-browser">
    <!-- 左侧：业务菜单树 -->
    <aside class="menu-panel">
      <div class="menu-panel-header">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        <span>文档目录</span>
      </div>

      <div v-if="menuLoading" class="menu-loading">
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
      </div>

      <nav class="menu-tree" v-else>
        <!-- 全部文档 -->
        <div
          class="menu-node"
          :class="{ 'menu-node--active': activeMenuId === null }"
          @click="selectMenu(null)"
        >
          <svg class="menu-node-icon" width="8" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          <span>全部文档</span>
        </div>

        <!-- 顶级菜单及子菜单 -->
        <template v-for="menu in topMenus" :key="menu.id">
          <div
            class="menu-node menu-node--parent"
            :class="{ 'menu-node--active': activeMenuId === menu.id, 'menu-node--expanded': expandedIds.has(menu.id) }"
            @click="toggleMenu(menu)"
          >
            <svg
              class="menu-node-arrow"
              :class="{ 'rotated': expandedIds.has(menu.id) }"
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <svg class="menu-node-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            <span class="menu-node-name">{{ menu.menuName }}</span>
            <span class="menu-node-count" v-if="docCounts[menu.id] !== undefined">{{ docCounts[menu.id] }}</span>
          </div>

          <!-- 子菜单 -->
          <transition name="submenu-slide">
            <div v-if="expandedIds.has(menu.id)" class="submenu-list">
              <div
                v-for="child in childMenusMap[menu.id] || []"
                :key="child.id"
                class="menu-node menu-node--child"
                :class="{ 'menu-node--active': activeMenuId === child.id }"
                @click.stop="selectMenu(child.id)"
              >
                <svg class="menu-node-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span class="menu-node-name">{{ child.menuName }}</span>
              </div>
            </div>
          </transition>
        </template>
      </nav>
    </aside>

    <!-- 右侧：文档列表 -->
    <section class="doc-panel">
      <!-- 头部：标题 + 新增按钮 -->
      <div class="doc-panel-header">
        <div class="doc-panel-title">
          <h3>{{ activeMenuName }}</h3>
          <span class="doc-total-badge">{{ docs.length }} 篇</span>
        </div>
        <button v-if="docsEditable" class="btn btn-primary btn-sm" @click="openCreateModal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新增文档
        </button>
      </div>

      <!-- 加载中 -->
      <div v-if="docLoading" class="doc-loading">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>

      <!-- 文档表格 -->
      <div v-else-if="docs.length" class="doc-table-wrap">
        <table class="doc-table">
          <thead>
            <tr>
              <th>文档 ID</th>
              <th>标题</th>
              <th>标签</th>
              <th>所属系统</th>
              <th>更新时间</th>
              <th style="text-align:right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in docs" :key="doc.docId" class="doc-row" @click="openDetail(doc)">
              <td>
                <span class="doc-id-badge">{{ doc.docId }}</span>
              </td>
              <td>
                <span class="doc-title-text">{{ doc.docTitle }}</span>
                <span v-if="doc.isVisible === false" class="tag tag-warning" style="margin-left:6px;font-size:11px">隐藏</span>
              </td>
              <td @click.stop>
                <!-- 标签展示 + 添加按钮 -->
                <div class="tag-list">
                  <span
                    v-for="(tag, idx) in parseTags(doc.docTags)"
                    :key="idx"
                    class="tag tag-multi"
                  >
                    {{ tag }}
                    <button class="tag-remove" @click.stop="removeTag(doc, idx)" title="移除标签">&times;</button>
                  </span>
                  <!-- 添加标签入口 -->
                  <span
                    v-if="editingTagId !== doc.docId"
                    class="tag tag-add"
                    @click.stop="startAddTag(doc)"
                  >
                    + 标签
                  </span>
                  <!-- 内联添加标签输入 -->
                  <input
                    v-else
                    v-model="newTagInput"
                    class="tag-input-inline"
                    placeholder="输入标签"
                    @keydown.enter.prevent="confirmAddTag(doc)"
                    @keydown.escape.prevent="cancelAddTag"
                    @blur="confirmAddTag(doc)"
                    ref="tagInputRefSetter"
                  />
                </div>
              </td>
              <td class="time-cell">{{ doc.menuName || '—' }}</td>
              <td class="time-cell">{{ doc.updateTime || '—' }}</td>
              <td class="action-cell" @click.stop>
                <button class="btn btn-icon-sm btn-ghost" title="下载" v-if="doc.originalPath && docsDownloadable" @click="downloadDoc(doc.docId)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
                <button v-if="docsEditable" class="btn btn-icon-sm btn-secondary" title="编辑" @click="openEditModal(doc)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 空状态 -->
      <div v-else class="doc-empty">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted)"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        <p>该目录下暂无文档</p>
      </div>
    </section>

    <!-- 新增/编辑文档弹窗 -->
    <div v-if="showFormModal" class="modal-overlay">
      <div class="modal" style="width:640px; max-height:90vh">
        <div class="modal-header">
          <span>{{ isEditing ? '编辑文档' : '新增文档' }}</span>
          <button class="btn btn-icon btn-sm btn-ghost" @click="showFormModal = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">文档标题 <span class="text-danger">*</span></label>
            <input v-model="form.docTitle" placeholder="请输入文档标题" />
          </div>

          <!-- 新增模式：上传按钮 -->
          <div v-if="!isEditing" class="form-group">
            <label class="form-label">上传PDF文件</label>
            <div class="upload-area">
              <input
                type="file"
                accept=".pdf"
                @change="onFileChange"
                ref="fileInputRef"
                style="display:none"
              />
              <div class="upload-zone" @click="$refs.fileInputRef.click()" @dragover.prevent @drop.prevent="onFileDrop">
                <template v-if="!uploadedFilePath">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <p>点击或拖拽 PDF 文件到此处</p>
                  <span class="upload-hint">仅支持 .pdf 格式</span>
                </template>
                <template v-else>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--success)"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <p style="color:var(--success)">文件已上传</p>
                  <span class="upload-hint">{{ uploadedFileName }}</span>
                </template>
              </div>
              <span v-if="uploading" class="upload-status">上传中...</span>
              <span v-if="uploadError" class="upload-status upload-error">{{ uploadError }}</span>
            </div>
          </div>

          <!-- 编辑模式：原始路径 -->
          <div v-else class="form-group">
            <label class="form-label">原始文件路径</label>
            <input v-model="form.originalPath" placeholder="/path/to/file.pdf" />
          </div>

          <div class="form-group">
            <label class="form-label">文档内容（Markdown）<span class="form-hint">上传PDF后自动解析填充，可手动修改</span></label>
            <textarea v-model="form.docContent" placeholder="支持 Markdown 语法... 超过5000字将自动截断" style="min-height:160px"></textarea>
            <span v-if="form.docContent && form.docContent.length > 4500" class="char-count" :class="{ 'char-count--warn': form.docContent.length > 5000 }">
              {{ form.docContent.length }} / 5000
            </span>
          </div>
          <div v-if="isEditing" class="form-group" style="flex-direction:row;align-items:center;gap:8px">
            <input type="checkbox" v-model="form.isVisible" id="doc-visible" style="width:auto" />
            <label for="doc-visible" class="form-label" style="margin:0">展示</label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showFormModal = false">取消</button>
          <button class="btn btn-primary" @click="submitForm" :disabled="formSubmitting">
            {{ formSubmitting ? '提交中...' : (isEditing ? '保存修改' : '创建文档') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 文档详情弹窗 -->
    <div v-if="showDetail" class="modal-overlay">
      <div class="modal" style="width:720px; max-height:90vh">
        <div class="modal-header">
          <span>{{ detailDoc?.docTitle }}</span>
          <button class="btn btn-icon btn-sm btn-ghost" @click="showDetail = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="detail-meta">
            <span v-for="(tag, i) in parseTags(detailDoc?.docTags || '')" :key="i" class="tag tag-multi">{{ tag }}</span>
            <span class="text-muted text-sm">{{ formatDate(detailDoc?.createTime) }} 创建 · {{ formatDate(detailDoc?.updateTime) }} 更新</span>
          </div>
          <div class="detail-content markdown-body" v-html="renderMarkdown(detailDoc?.docContent || '')"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { listMenus, getMenuChildren } from '@/api/menu'
import { listDocsByMenu, createDoc, updateDoc, getDocByDocId, getDownloadUrl, updateDocTags, uploadFile } from '@/api/doc'
import { getParam } from '@/api/param'
import { showToast } from '@/composables/toast'

// ===== 菜单 =====
const topMenus = ref([])
const childMenusMap = ref({})
const expandedIds = ref(new Set())
const activeMenuId = ref(null)
const docCounts = ref({})

// ===== 文档 =====
const docs = ref([])
const menuLoading = ref(false)
const docLoading = ref(false)

// ===== 详情弹窗 =====
const showDetail = ref(false)
const detailDoc = ref(null)

// ===== 新增/编辑弹窗 =====
const showFormModal = ref(false)
const isEditing = ref(false)
const editingDocId = ref(null)
const formSubmitting = ref(false)
const form = ref({
  docTitle: '',
  docTags: '',
  originalPath: '',
  docContent: '',
  isVisible: true
})

// ===== 文件上传 =====
const fileInputRef = ref(null)
const uploadedFilePath = ref('')
const uploadedFileName = ref('')
const uploadedAttachPwd = ref('')  // 附件加密密码
const uploading = ref(false)
const uploadError = ref('')

// ===== 编辑开关 =====
const docsEditable = ref(true)

// ===== 下载开关 =====
const docsDownloadable = ref(true)

// ===== 标签编辑 =====
const editingTagId = ref(null)
const newTagInput = ref('')
const tagInputRefSetter = (el) => {
  if (el) nextTick(() => el.focus())
}

const activeMenuName = computed(() => {
  if (activeMenuId.value === null) return '全部文档'
  for (const m of topMenus.value) {
    if (m.id === activeMenuId.value) return m.menuName
    const children = childMenusMap.value[m.id] || []
    const c = children.find(x => x.id === activeMenuId.value)
    if (c) return c.menuName
  }
  return '文档列表'
})

function parseTags(str) {
  if (!str) return []
  return str.split(/[|,]/).map(t => t.trim()).filter(Boolean)
}

// ===== 菜单加载 =====
async function loadMenus() {
  menuLoading.value = true
  try {
    const all = await listMenus() || []
    topMenus.value = all.filter(m => !m.parentId || m.parentId === 0)
    await Promise.all(topMenus.value.map(async (m) => {
      try {
        const children = await getMenuChildren(m.id) || []
        if (children.length) childMenusMap.value[m.id] = children
      } catch { /* ignore */ }
    }))
  } catch { /* ignore */ }
  menuLoading.value = false
}

// ===== 文档加载 =====
async function loadDocs(menuId) {
  docLoading.value = true
  try {
    const result = await listDocsByMenu(menuId) || []
    docs.value = result
  } catch {
    docs.value = []
  }
  docLoading.value = false
}

async function selectMenu(menuId) {
  activeMenuId.value = menuId
  await loadDocs(menuId)
}

async function toggleMenu(menu) {
  const id = menu.id
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
    expandedIds.value = new Set(expandedIds.value)
  } else {
    expandedIds.value.add(id)
    expandedIds.value = new Set(expandedIds.value)
    await selectMenu(id)
  }
}

// ===== 详情弹窗 =====
function openDetail(doc) {
  detailDoc.value = doc
  showDetail.value = true
}

function downloadDoc(docId) {
  window.open(getDownloadUrl(docId), '_blank')
}

// ===== 新增/编辑 =====
function openCreateModal() {
  isEditing.value = false
  editingDocId.value = null
  form.value = {
    docTitle: '',
    docTags: '',
    originalPath: '',
    docContent: '',
    isVisible: true
  }
  uploadedFilePath.value = ''
  uploadedFileName.value = ''
  uploadedAttachPwd.value = ''
  uploadError.value = ''
  showFormModal.value = true
}

async function openEditModal(doc) {
  isEditing.value = true
  editingDocId.value = doc.docId
  // 获取最新详情
  try {
    const fresh = await getDocByDocId(doc.docId)
    form.value = {
      docTitle: fresh.docTitle || '',
      docTags: fresh.docTags || '',
      originalPath: fresh.originalPath || '',
      docContent: fresh.docContent || '',
      isVisible: fresh.isVisible !== false
    }
  } catch {
    form.value = {
      docTitle: doc.docTitle || '',
      docTags: doc.docTags || '',
      originalPath: doc.originalPath || '',
      docContent: doc.docContent || '',
      isVisible: doc.isVisible !== false
    }
  }
  showFormModal.value = true
}

async function submitForm() {
  if (!form.value.docTitle.trim()) return
  formSubmitting.value = true
  try {
    const payload = {
      docTitle: form.value.docTitle.trim(),
      docTags: form.value.docTags.trim(),
      originalPath: isEditing.value ? form.value.originalPath.trim() : uploadedFilePath.value,
      attachPwd: uploadedAttachPwd.value || undefined,
      docContent: form.value.docContent,
      isVisible: form.value.isVisible,
      menuId: activeMenuId.value
    }
    if (isEditing.value) {
      await updateDoc(editingDocId.value, payload)
      showToast('更新成功！')
    } else {
      await createDoc(payload)
      showToast('创建成功！')
    }
    showFormModal.value = false
    // 刷新列表
    await loadDocs(activeMenuId.value)
  } catch (e) {
    showToast('操作失败：' + (e?.message || '未知错误'), 'error')
  }
  formSubmitting.value = false
}

// ===== 文件上传 =====
async function doUpload(file) {
  uploading.value = true
  uploadError.value = ''
  try {
    const result = await uploadFile(file)
    uploadedFilePath.value = result.filePath || ''
    uploadedAttachPwd.value = result.attachPwd || ''
    uploadedFileName.value = file.name
    // 自动填充 PDF 解析后的 Markdown 内容
    if (result.parsedContent) {
      form.value.docContent = result.parsedContent
    }
  } catch (e) {
    uploadError.value = '上传失败：' + (e?.message || '未知错误')
    uploadedFilePath.value = ''
    uploadedAttachPwd.value = ''
    uploadedFileName.value = ''
  }
  uploading.value = false
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    uploadError.value = '仅支持 PDF 文件'
    return
  }
  doUpload(file)
}

function onFileDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    uploadError.value = '仅支持 PDF 文件'
    return
  }
  doUpload(file)
}

// ===== 标签操作 =====
function startAddTag(doc) {
  editingTagId.value = doc.docId
  newTagInput.value = ''
}
function cancelAddTag() {
  editingTagId.value = null
  newTagInput.value = ''
}
async function confirmAddTag(doc) {
  const tag = newTagInput.value.trim()
  // 先清除编辑状态，避免 blur 二次触发
  editingTagId.value = null
  newTagInput.value = ''
  if (!tag) return
  // 组装当前标签 + 新标签，以 | 分隔全量传给后端
  const currentTags = parseTags(doc.docTags)
  if (currentTags.includes(tag)) return // 已存在，跳过
  currentTags.push(tag)
  const newTagsStr = currentTags.join('|')
  try {
    await updateDocTags(doc.docId, newTagsStr)
    doc.docTags = newTagsStr
    showToast('标签已添加')
  } catch { /* ignore */ }
}
async function removeTag(doc, idx) {
  const currentTags = parseTags(doc.docTags)
  if (idx < 0 || idx >= currentTags.length) return
  currentTags.splice(idx, 1)
  const newTagsStr = currentTags.join('|')
  try {
    await updateDocTags(doc.docId, newTagsStr)
    doc.docTags = newTagsStr
    showToast('标签已移除')
  } catch { /* ignore */ }
}

// ===== 工具函数 =====
function formatDate(date) {
  if (!date) return '—'
  // 后端 @JsonFormat 已返回 yyyy-MM-dd HH:mm:ss 字符串，直接使用
  if (typeof date === 'string' && date.includes('-') && date.includes(':')) return date
  const d = new Date(date)
  if (isNaN(d.getTime())) return date
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

function renderMarkdown(md) {
  if (!md) return ''
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
}

async function loadEditableStatus() {
  try {
    const param = await getParam('doc_editable')
    docsEditable.value = param?.paramValue === '1'
  } catch {
    // 加载失败默认可编辑
    docsEditable.value = true
  }
}

async function loadDownloadableStatus() {
  try {
    const param = await getParam('doc_downloadable')
    docsDownloadable.value = param?.paramValue === '1'
  } catch {
    docsDownloadable.value = true
  }
}

onMounted(async () => {
  await loadEditableStatus()
  await loadDownloadableStatus()
  await loadMenus()
  await loadDocs(null)
})
</script>

<style scoped>
.doc-browser {
  display: flex;
  height: 100%;
  gap: 0;
  background: var(--bg-root);
}

/* ===== 左侧菜单面板 ===== */
.menu-panel {
  width: 147px;
  min-width: 147px;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.menu-panel-header {
  padding: 16px 16px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 7px;
  border-bottom: 1px solid var(--border-color);
}
.menu-loading {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 24px;
}
.loading-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: blink 1.2s infinite;
}
.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%,80%,100% { opacity: 0.2 } 40% { opacity: 1 } }

.menu-tree {
  flex: 1;
  padding: 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.menu-node {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13.5px;
  color: var(--text-secondary);
  transition: all 0.15s;
  user-select: none;
  position: relative;
}
.menu-node:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.menu-node--active {
  background: var(--accent-dim);
  color: var(--accent-hover);
  font-weight: 600;
}
.menu-node--active::before {
  content: '';
  position: absolute;
  left: 0; top: 50%; transform: translateY(-50%);
  width: 3px; height: 16px;
  background: var(--accent);
  border-radius: 0 3px 3px 0;
}
.menu-node-arrow {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.2s ease;
}
.menu-node-arrow.rotated { transform: rotate(90deg); }
.menu-node-icon { flex-shrink: 0; opacity: 0.7; }
.menu-node-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.menu-node-count {
  font-size: 11px;
  background: var(--bg-secondary);
  color: var(--text-muted);
  border-radius: 10px;
  padding: 1px 7px;
  flex-shrink: 0;
}
.submenu-list {
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.menu-node--child { padding: 7px 10px; font-size: 13px; }
.submenu-slide-enter-active, .submenu-slide-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.submenu-slide-enter-from, .submenu-slide-leave-to {
  opacity: 0; transform: translateY(-6px);
}

/* ===== 右侧文档面板 ===== */
.doc-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-root);
}
.doc-panel-header {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
}
.doc-panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.doc-panel-title h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
.doc-total-badge {
  font-size: 12px;
  background: var(--bg-secondary);
  color: var(--text-muted);
  border-radius: 12px;
  padding: 2px 10px;
  border: 1px solid var(--border-color);
}

/* 加载中 */
.doc-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
  color: var(--text-muted);
  font-size: 14px;
}
.spinner {
  width: 20px; height: 20px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg) } }

/* 文档表格 */
.doc-table-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}
.doc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}
.doc-table thead th {
  position: sticky;
  top: 0;
  background: var(--bg-secondary);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.4px;
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}
.doc-row {
  cursor: pointer;
  transition: background 0.12s;
  border-bottom: 1px solid var(--border-light);
}
.doc-row:hover { background: var(--bg-hover); }
.doc-row td {
  padding: 13px 16px;
  vertical-align: middle;
}
.doc-id-badge {
  font-size: 11px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  background: var(--bg-secondary);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 2px 8px;
  white-space: nowrap;
}
.doc-title-text {
  font-weight: 500;
  color: var(--text-primary);
}

/* ===== 标签样式 ===== */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.tag-multi {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px 3px 10px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 500;
  background: linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(16, 185, 129, 0.08));
  color: #6ee7b7;
  border: 1px solid rgba(52, 211, 153, 0.3);
  white-space: nowrap;
  transition: all 0.15s;
}
.tag-multi:hover {
  border-color: rgba(52, 211, 153, 0.5);
}
.tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px; height: 14px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.1);
  color: #6ee7b7;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s;
}
.tag-remove:hover {
  background: rgba(239,68,68,0.3);
  color: #fca5a5;
}
.tag-add {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 500;
  background: transparent;
  color: var(--text-muted);
  border: 1px dashed var(--border-color);
  cursor: pointer;
  transition: all 0.15s;
}
.tag-add:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-dim);
}
.tag-input-inline {
  width: 90px;
  padding: 3px 8px;
  background: var(--bg-input);
  border: 1px solid var(--accent);
  border-radius: 20px;
  color: var(--text-primary);
  font-size: 11.5px;
  outline: none;
}
.tag-input-inline::placeholder {
  color: var(--text-muted);
  font-size: 11px;
}

.time-cell {
  color: var(--text-muted);
  font-size: 12.5px;
  white-space: nowrap;
}
.action-cell {
  text-align: right;
  white-space: nowrap;
}

/* ===== 操作按钮 ===== */
.btn-icon-sm {
  width: 28px;
  height: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  margin-left: 3px;
}
.btn-icon-sm.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  border-color: var(--border-color);
}
.btn-icon-sm.btn-ghost:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.btn-icon-sm.btn-secondary {
  background: transparent;
  color: var(--accent);
  border-color: rgba(99,130,255,0.3);
}
.btn-icon-sm.btn-secondary:hover {
  background: var(--accent-dim);
  border-color: var(--accent);
}

/* 空状态 */
.doc-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 14px;
}

/* 详情弹窗 */
.detail-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}
.markdown-body { line-height: 1.8; font-size: 14px; color: var(--text-secondary); }
.markdown-body :deep(h2) { font-size: 18px; margin: 16px 0 8px; color: var(--text-primary); }
.markdown-body :deep(h3) { font-size: 16px; margin: 12px 0 6px; color: var(--text-secondary); }
.markdown-body :deep(h4) { font-size: 14px; margin: 10px 0 4px; }
.markdown-body :deep(p) { margin: 6px 0; }
.markdown-body :deep(li) { margin-left: 20px; margin-bottom: 4px; }
.markdown-body :deep(code) {
  background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px;
  font-family: 'SF Mono', 'Fira Code', monospace; font-size: 13px;
}
.markdown-body :deep(strong) { color: var(--text-primary); }

/* ===== 文件上传区域 ===== */
.upload-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 28px 20px;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-muted);
  text-align: center;
}
.upload-zone:hover {
  border-color: var(--accent);
  background: var(--accent-dim);
}
.upload-zone p {
  margin: 0;
  font-size: 13px;
}
.upload-hint {
  font-size: 11px;
  color: var(--text-muted);
  opacity: 0.6;
}
.upload-status {
  font-size: 12px;
  color: var(--text-muted);
}
.upload-error {
  color: var(--text-danger);
}

/* ===== 字数统计 ===== */
.char-count {
  font-size: 11px;
  color: var(--text-muted);
  text-align: right;
  margin-top: 4px;
}
.char-count--warn {
  color: var(--text-danger);
}

.form-hint {
  font-weight: 400;
  font-size: 11px;
  color: var(--text-muted);
  margin-left: 6px;
}
</style>
