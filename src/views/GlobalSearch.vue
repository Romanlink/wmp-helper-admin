<template>
  <div class="global-search">
    <!-- 搜索区域 -->
    <div class="search-area" :class="{ 'search-area--compact': isSearchMode }">
      <div class="search-box">
        <input
          ref="searchInputRef"
          v-model="searchKeyword"
          type="text"
          placeholder="输入关键词搜索文档标题、内容、标签..."
          class="search-input"
          @keydown.enter="performSearch"
        />
        <button class="search-icon-btn" @click="performSearch">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
      </div>
      <transition name="search-hint">
        <p v-if="!isSearchMode" class="search-hint">
          
        </p>
      </transition>
    </div>

    <!-- 搜索结果计数 -->
    <div v-if="isSearchMode" class="search-result-bar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <span>搜索 "<strong>{{ lastSearchKeyword }}</strong>" 找到 <strong>{{ docs.length }}</strong> 条结果</span>
      <button class="btn btn-ghost btn-sm" @click="clearSearch" style="margin-left:auto">清除</button>
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
              <div class="tag-list">
                <span
                  v-for="(tag, idx) in parseTags(doc.docTags)"
                  :key="idx"
                  class="tag tag-multi"
                >
                  {{ tag }}
                  <button class="tag-remove" @click.stop="removeTag(doc, idx)" title="移除标签">&times;</button>
                </span>
                <span
                  v-if="editingTagId !== doc.docId"
                  class="tag tag-add"
                  @click.stop="startAddTag(doc)"
                >
                  + 标签
                </span>
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
            <td class="time-cell">{{ doc.moduleName || '—' }}</td>
            <td class="time-cell">{{ doc.updateTime || '—' }}</td>
            <td class="action-cell" @click.stop>
              <button class="btn btn-icon-sm btn-ghost" title="下载" v-if="doc.originalPath && docsDownloadable" @click="downloadDoc(doc.docId)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!isSearchMode" class="doc-empty doc-empty--idle">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted);opacity:0.3">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <p>输入关键词，搜索全站文档</p>
    </div>
    <div v-else class="doc-empty">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted)"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <p>未找到匹配的文档</p>
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
import { ref, nextTick, onMounted } from 'vue'
import { searchDocs, updateDocTags, getDownloadUrl } from '@/api/doc'
import { getParam } from '@/api/param'
import { showToast } from '@/composables/toast'

// ===== 搜索 =====
const searchKeyword = ref('')
const lastSearchKeyword = ref('')
const isSearchMode = ref(false)
const searchInputRef = ref(null)

// ===== 文档 =====
const docs = ref([])
const docLoading = ref(false)

// ===== 详情弹窗 =====
const showDetail = ref(false)
const detailDoc = ref(null)

// ===== 标签编辑 =====
const editingTagId = ref(null)
const newTagInput = ref('')
const tagInputRefSetter = (el) => {
  if (el) nextTick(() => el.focus())
}

// ===== 编辑开关 =====
const docsEditable = ref(true)

// ===== 下载开关 =====
const docsDownloadable = ref(true)

function parseTags(str) {
  if (!str) return []
  return str.split(/[|,]/).map(t => t.trim()).filter(Boolean)
}

// ===== 搜索 =====
async function performSearch() {
  const kw = searchKeyword.value.trim()
  if (!kw) return
  lastSearchKeyword.value = kw
  isSearchMode.value = true
  docLoading.value = true
  try {
    const result = await searchDocs(kw) || []
    docs.value = result
  } catch {
    docs.value = []
  }
  docLoading.value = false
}

function clearSearch() {
  searchKeyword.value = ''
  lastSearchKeyword.value = ''
  isSearchMode.value = false
  docs.value = []
}

// ===== 详情弹窗 =====
function openDetail(doc) {
  detailDoc.value = doc
  showDetail.value = true
}

function downloadDoc(docId) {
  window.open(getDownloadUrl(docId), '_blank')
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
  editingTagId.value = null
  newTagInput.value = ''
  if (!tag) return
  const currentTags = parseTags(doc.docTags)
  if (currentTags.includes(tag)) return
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

onMounted(() => {
  loadEditableStatus()
  loadDownloadableStatus()
})
</script>

<style scoped>
.global-search {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-root);
}

/* ===== 搜索框区域 ===== */
.search-area {
  padding: 48px 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.search-area--compact {
  padding: 12px 24px 12px;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
}
.search-box {
  display: flex;
  align-items: center;
  max-width: 580px;
  width: 100%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.search-area--compact .search-box {
  max-width: 460px;
}
.search-input {
  flex: 1;
  padding: 14px 16px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-right: none;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-dim);
}
.search-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 48px;
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  color: #fff;
  cursor: pointer;
  transition: all var(--transition);
  flex-shrink: 0;
}
.search-icon-btn:hover {
  background: var(--accent-hover);
  box-shadow: 0 0 12px var(--accent-glow);
}
.search-hint {
  margin-top: 14px;
  font-size: 13px;
  color: var(--text-muted);
  transition: opacity 0.3s;
}
.search-hint-enter-from,
.search-hint-leave-to { opacity: 0; }

.search-result-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  font-size: 13px;
  color: var(--text-secondary);
  animation: fadeSlideIn 0.25s ease;
}
.search-result-bar strong {
  color: var(--accent-hover);
}

/* ===== 加载中 ===== */
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

/* ===== 文档表格 ===== */
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
  z-index: 1;
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

/* ===== 空状态 ===== */
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
.doc-empty--idle p {
  font-size: 14px;
  color: var(--text-muted);
  opacity: 0.5;
}

/* ===== 详情弹窗 ===== */
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

/* ===== 动画 ===== */
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
