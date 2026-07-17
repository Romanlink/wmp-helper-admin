<template>
  <div class="doc-manage">
    <!-- 搜索栏 -->
    <div class="filter-bar">
      <div class="filter-row">
        <div class="search-box">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="searchKeyword" @keyup.enter="onSearch" placeholder="搜索文档标题、标签、内容..." />
        </div>

        <select v-model="searchMode" class="search-mode-select">
          <option value="keyword">全文搜索</option>
          <option value="menu">按菜单筛选</option>
          <option value="tag">按标签筛选</option>
        </select>

        <select v-if="searchMode === 'menu'" v-model="selectedModuleId" @change="onFilterByMenu" class="filter-select">
          <option :value="null">全部菜单</option>
          <option v-for="m in allMenus" :key="m.id" :value="m.id">{{ m.moduleName }}</option>
        </select>

        <input v-if="searchMode === 'tag'" v-model="tagKeyword" @keyup.enter="onFilterByTag" placeholder="输入标签关键词..." class="filter-input" />
      </div>

      <button v-if="docsEditable" class="btn btn-primary" @click="openCreate">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        新增文档
      </button>
    </div>

    <!-- 文档卡片列表 -->
    <div class="doc-grid" v-if="docs.length">
      <div v-for="doc in docs" :key="doc.docId" class="doc-card">
        <div class="doc-card-header">
          <h3 class="doc-title">{{ doc.docTitle }}</h3>
          <span v-if="!doc.isVisible" class="tag tag-warning">隐藏</span>
        </div>

        <div class="doc-meta">
          <span class="doc-menu-tag tag tag-primary">{{ getModuleName(doc.moduleId) }}</span>
          <span class="doc-id text-muted text-sm">#{{ doc.docId }}</span>
        </div>

        <!-- 标签 -->
        <div class="doc-tags" v-if="doc.docTags">
          <span v-for="tag in doc.docTags.split(/[|,]/).map(t=>t.trim()).filter(Boolean)" :key="tag" class="tag tag-primary" style="font-size:11px;padding:1px 8px">
            {{ tag }}
          </span>
        </div>

        <!-- 内容预览 -->
        <div class="doc-preview" v-if="doc.docContent">
          {{ doc.docContent.slice(0, 120) }}{{ doc.docContent.length > 120 ? '...' : '' }}
        </div>

        <!-- 底部操作 -->
        <div class="doc-card-footer">
          <span class="text-muted text-sm">{{ formatDate(doc.updateTime) }}</span>
          <div class="doc-actions">
            <button
              v-if="doc.originalPath && docsDownloadable"
              class="btn btn-sm btn-ghost"
              @click="downloadDoc(doc.docId)"
              title="下载原始文件"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button v-if="docsEditable" class="btn btn-sm btn-secondary" @click="openEdit(doc)">编辑</button>
            <button v-if="docsEditable" class="btn btn-sm btn-danger" @click="confirmDelete(doc)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted);margin-bottom:16px"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <p class="text-muted">暂无文档数据</p>
      <button class="btn btn-primary mt-md" @click="openCreate">创建第一篇文档</button>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showForm" class="modal-overlay">
      <div class="modal" style="width:640px">
        <div class="modal-header">
          <span>{{ editing ? '编辑文档' : '新增文档' }}</span>
          <button class="btn btn-icon btn-sm btn-ghost" @click="showForm = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">文档标题 <span style="color:var(--text-danger)">*</span></label>
            <input v-model="form.docTitle" placeholder="输入文档标题" />
          </div>

          <!-- 编辑模式 -->
          <template v-if="editing">
            <div class="form-group">
              <label class="form-label">所属菜单 <span style="color:var(--text-danger)">*</span></label>
              <select v-model.number="form.moduleId">
                <option v-for="m in allMenus" :key="m.id" :value="m.id">{{ m.moduleName }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">原始文件路径</label>
              <input v-model="form.originalPath" placeholder="/data/docs/example.pdf" />
            </div>
          </template>

          <!-- 新增模式：上传按钮 -->
          <div v-else class="form-group">
            <label class="form-label">上传PDF文件</label>
            <div class="upload-area">
              <input type="file" accept=".pdf" @change="onFileChange" ref="fileInputRef" style="display:none" />
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

          <div class="form-group">
            <label class="form-label">文档内容（Markdown）<span class="form-hint">上传PDF后自动解析填充，可手动修改</span></label>
            <textarea v-model="form.docContent" rows="8" placeholder="支持 Markdown 语法... 超过5000字将自动截断"></textarea>
            <span v-if="form.docContent && form.docContent.length > 4500" class="char-count" :class="{ 'char-count--warn': form.docContent.length > 5000 }">
              {{ form.docContent.length }} / 5000
            </span>
          </div>

          <!-- 编辑模式：是否展示 -->
          <div v-if="editing" class="form-group">
            <label class="form-label">是否展示</label>
            <select v-model.number="form.isVisible">
              <option :value="1">展示</option>
              <option :value="0">隐藏</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showForm = false">取消</button>
          <button class="btn btn-primary" @click="saveDoc" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
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
          <div class="detail-meta flex gap-sm mb-md">
            <span class="tag tag-primary">{{ getModuleName(detailDoc?.moduleId) }}</span>
            <span v-for="tag in (detailDoc?.docTags || '').split(/[|,]/).map(t=>t.trim()).filter(Boolean)" :key="tag" class="tag tag-primary">{{ tag }}</span>
          </div>
          <div class="detail-content markdown-body" v-html="renderMarkdown(detailDoc?.docContent || '')"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  listDocsByMenu, searchDocs, listDocsByTag, getDocByDocId,
  createDoc, updateDoc, deleteDoc, getDownloadUrl, uploadFile
} from '@/api/doc'
import { listModules } from '@/api/menu'
import { getParam } from '@/api/param'
import { showToast } from '@/composables/toast'

const docs = ref([])
const allMenus = ref([])
const searchKeyword = ref('')
const searchMode = ref('keyword')
const selectedModuleId = ref(null)
const tagKeyword = ref('')
const showForm = ref(false)
const editing = ref(false)
const saving = ref(false)
const showDetail = ref(false)
const detailDoc = ref(null)

const form = ref({
  docTitle: '',
  moduleId: null,
  originalPath: '',
  docTags: '',
  docContent: '',
  isVisible: 1
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

async function loadDocs() {
  try {
    docs.value = await listDocsByMenu(null) || []
  } catch (e) {
    docs.value = []
  }
}

async function loadMenus() {
  try {
    allMenus.value = await listModules() || []
  } catch {
    allMenus.value = []
  }
}

async function onSearch() {
  if (!searchKeyword.value.trim()) { await loadDocs(); return }
  try {
    docs.value = await searchDocs(searchKeyword.value.trim()) || []
  } catch {
    docs.value = []
  }
}

async function onFilterByMenu() {
  try {
    if (selectedModuleId.value) {
      docs.value = await listDocsByMenu(selectedModuleId.value) || []
    } else {
      await loadDocs()
    }
  } catch {
    docs.value = []
  }
}

async function onFilterByTag() {
  if (!tagKeyword.value.trim()) { await loadDocs(); return }
  try {
    docs.value = await listDocsByTag(tagKeyword.value.trim()) || []
  } catch {
    docs.value = []
  }
}

function getModuleName(moduleId) {
  if (moduleId == null) return '未分类'
  const m = allMenus.value.find(x => x.id === moduleId)
  return m?.moduleName || '菜单#' + moduleId
}

function openCreate() {
  editing.value = false
  form.value = { docTitle: '', moduleId: allMenus.value[0]?.id || null, originalPath: '', docTags: '', docContent: '', isVisible: 1 }
  uploadedFilePath.value = ''
  uploadedFileName.value = ''
  uploadedAttachPwd.value = ''
  uploadError.value = ''
  showForm.value = true
}

async function openEdit(doc) {
  editing.value = true
  form.value = {
    docId: doc.docId,
    docTitle: doc.docTitle,
    moduleId: doc.moduleId,
    originalPath: doc.originalPath || '',
    docTags: doc.docTags || '',
    docContent: doc.docContent || '',
    isVisible: doc.isVisible ? 1 : 0
  }
  showForm.value = true
}

async function saveDoc() {
  if (!form.value.docTitle?.trim()) {
    showToast('请输入文档标题', 'error')
    return
  }
  if (!form.value.moduleId) {
    showToast('请选择所属菜单', 'error')
    return
  }
  saving.value = true
  try {
    const payload = {
      moduleId: form.value.moduleId,
      docTitle: form.value.docTitle.trim(),
      originalPath: editing.value ? (form.value.originalPath || '') : uploadedFilePath.value,
      attachPwd: uploadedAttachPwd.value || undefined,
      docTags: form.value.docTags || '',
      docContent: form.value.docContent || '',
      isVisible: !!form.value.isVisible
    }
    if (editing.value) {
      await updateDoc(form.value.docId, payload)
      showToast('更新成功！')
    } else {
      await createDoc(payload)
      showToast('创建成功！')
    }
    showForm.value = false
    await loadDocs()
  } catch (e) {
    showToast('保存失败: ' + (e?.message || '未知错误'), 'error')
  } finally {
    saving.value = false
  }
}

async function confirmDelete(doc) {
  if (!confirm(`确定删除文档「${doc.docTitle}」吗？`)) return
  try {
    await deleteDoc(doc.docId)
    showToast('删除成功！')
    await loadDocs()
  } catch (e) {
    showToast('删除失败: ' + (e?.message || '未知错误'), 'error')
  }
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

function downloadDoc(docId) {
  window.open(getDownloadUrl(docId), '_blank')
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

// 简易 Markdown 渲染
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
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (m) => m.startsWith('<') ? m : `<p>${m}</p>`)
}

async function loadEditableStatus() {
  try {
    const param = await getParam('doc_editable')
    docsEditable.value = param?.paramValue === '1'
  } catch {
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
  loadDocs()
  loadMenus()
})
</script>

<style scoped>
.doc-manage { display: flex; flex-direction: column; gap: 20px; }

/* 筛选栏 */
.filter-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.filter-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 1; }
.search-box { position: relative; width: 320px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
.search-box input { padding-left: 38px; }

.search-mode-select, .filter-select, .filter-input {
  width: auto !important; padding: 10px 36px 10px 14px;
}
.filter-input { width: 200px !important; padding: 10px 14px; }

/* 文档卡片网格 */
.doc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 18px;
}

.doc-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all var(--transition);
}
.doc-card:hover {
  border-color: rgba(255,255,255,0.1);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.doc-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.doc-title {
  font-size: 15px; font-weight: 600; color: var(--text-primary);
  line-height: 1.4; word-break: break-word;
}
.doc-meta { display: flex; align-items: center; gap: 8px; }
.doc-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.doc-preview {
  font-size: 13px; color: var(--text-muted); line-height: 1.6;
  overflow: hidden; display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  cursor: pointer;
}
.doc-card-footer { display: flex; align-items: center; justify-content: space-between; }
.doc-actions { display: flex; gap: 4px; }

/* 空状态 */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 80px 0; color: var(--text-muted);
}

/* 详情-Markdown */
.markdown-body { line-height: 1.8; font-size: 14px; }
.markdown-body :deep(h2) { font-size: 18px; margin: 16px 0 8px; color: var(--text-primary); }
.markdown-body :deep(h3) { font-size: 16px; margin: 12px 0 6px; color: var(--text-secondary); }
.markdown-body :deep(h4) { font-size: 14px; margin: 10px 0 4px; }
.markdown-body :deep(p) { margin: 6px 0; }
.markdown-body :deep(li) { margin-left: 20px; margin-bottom: 4px; }
.markdown-body :deep(code) {
  background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px;
  font-family: 'SF Mono', 'Fira Code', monospace; font-size: 13px;
}
.markdown-body :deep(blockquote) {
  border-left: 3px solid var(--accent); padding: 4px 12px;
  margin: 8px 0; background: var(--bg-secondary); border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  color: var(--text-secondary);
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
