<template>
  <div class="doc-convert">
    <div class="dc-card">
      <h3 class="dc-title">PDF → Word 文档转换</h3>
      <p class="dc-desc">
        上传 PDF 文件，系统将在服务器端加密转换并生成可编辑的 Word 文档。
        转换过程中的临时文件均加密存储，下载完成后自动销毁。
      </p>

      <!-- 上传区 -->
      <div
        v-if="!task"
        class="dc-drop"
        :class="{ 'dc-drop--over': dragging }"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
        @click="pickFile"
      >
        <input
          ref="fileInput"
          type="file"
          accept="application/pdf,.pdf"
          class="dc-file-hidden"
          @change="onFileChange"
        />
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p class="dc-drop-text">点击或拖拽 PDF 到此处上传</p>
        <p class="dc-drop-hint">仅支持 .pdf，单文件最大 50MB</p>
      </div>

      <!-- 进度区 -->
      <div v-else class="dc-progress">
        <div class="dc-row">
          <span class="dc-label">原始文件</span>
          <span class="dc-value">{{ task.fileName }}</span>
        </div>
        <div class="dc-row">
          <span class="dc-label">状态</span>
          <span class="dc-badge" :class="statusClass">{{ statusText }}</span>
        </div>
        <div class="dc-bar" v-if="task.status === 'CONVERTING' || task.status === 'QUEUED'">
          <div class="dc-bar-fill" :style="{ width: barWidth }"></div>
        </div>

        <button
          v-if="task.status === 'DONE'"
          class="btn btn-primary dc-download"
          @click="download"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          下载 Word 文档
        </button>

        <p v-if="task.status === 'FAILED'" class="dc-error">转换失败：{{ task.error }}</p>

        <button class="btn btn-ghost dc-reset" @click="reset">转换其他文件</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import http from '@/api/http'

const fileInput = ref(null)
const dragging = ref(false)
const task = ref(null)
const pollTimer = ref(null)

const statusText = computed(() => {
  const s = task.value?.status
  if (s === 'QUEUED') return '排队中'
  if (s === 'CONVERTING') return '转换中…'
  if (s === 'DONE') return '转换完成'
  if (s === 'FAILED') return '失败'
  return s || '—'
})
const statusClass = computed(() => {
  const s = task.value?.status
  return {
    'dc-badge--done': s === 'DONE',
    'dc-badge--fail': s === 'FAILED',
    'dc-badge--run': s === 'QUEUED' || s === 'CONVERTING'
  }
})
const barWidth = computed(() => (task.value?.status === 'CONVERTING' ? '80%' : '30%'))

function pickFile() {
  fileInput.value?.click()
}
function onFileChange(e) {
  const f = e.target.files?.[0]
  if (f) upload(f)
}
function onDrop(e) {
  dragging.value = false
  const f = e.dataTransfer.files?.[0]
  if (f) upload(f)
}

async function upload(file) {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    alert('仅支持上传 PDF 文件')
    return
  }
  const form = new FormData()
  form.append('file', file)
  try {
    const res = await http.post('/doc-convert/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    task.value = {
      taskId: res.taskId,
      token: res.token,
      status: res.status,
      fileName: file.name,
      error: ''
    }
    startPolling()
  } catch (e) {
    alert('上传失败：' + (e.response?.data?.message || e.message))
  }
}

function startPolling() {
  stopPolling()
  pollTimer.value = setInterval(async () => {
    if (!task.value || task.value.status === 'DONE' || task.value.status === 'FAILED') {
      stopPolling()
      return
    }
    try {
      const res = await http.get('/doc-convert/status', { params: { taskId: task.value.taskId } })
      task.value.status = res.status
      if (res.error) task.value.error = res.error
      if (res.status === 'DONE' || res.status === 'FAILED') {
        stopPolling()
      }
    } catch (e) {
      // 忽略轮询异常，继续下一次
    }
  }, 1500)
}
function stopPolling() {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }
}

async function download() {
  if (!task.value?.token) return
  try {
    const blob = await http.get('/doc-convert/download', {
      params: { token: task.value.token },
      responseType: 'blob'
    })
    // 注意：http.js 拦截器对 responseType==='blob' 的响应直接透传 Blob（非完整 response 对象），
    // 所以这里拿到的是 Blob 本体，不是 { data: Blob }。
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = task.value.fileName.replace(/\.pdf$/i, '') + '.docx'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    // http.js 对 blob 错误响应已解析出 message 并 reject 为普通 Error；
    // 对非 blob 错误仍为 axios 错误（含 e.response）。
    const msg = e.message || (e.response?.data?.message) || '下载失败'
    if (msg.includes('令牌') || msg.includes('失效')) {
      alert('下载令牌已失效，请重新上传文件后再下载。')
      reset()
    } else {
      alert('下载失败：' + msg)
    }
  }
}

function reset() {
  stopPolling()
  task.value = null
  if (fileInput.value) fileInput.value.value = ''
}

onUnmounted(stopPolling)
</script>

<style scoped>
.doc-convert {
  max-width: 640px;
  margin: 0 auto;
}
.dc-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 28px;
}
.dc-title {
  margin: 0 0 6px;
  font-size: 18px;
  color: var(--text-primary);
}
.dc-desc {
  margin: 0 0 20px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-muted);
}
.dc-drop {
  border: 1.5px dashed var(--border-color);
  border-radius: var(--radius-md);
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition);
}
.dc-drop:hover,
.dc-drop--over {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-dim);
}
.dc-drop-text {
  margin: 12px 0 4px;
  font-size: 14px;
  font-weight: 500;
}
.dc-drop-hint {
  margin: 0;
  font-size: 12px;
}
.dc-file-hidden {
  display: none;
}
.dc-progress {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dc-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}
.dc-label {
  color: var(--text-muted);
  min-width: 56px;
}
.dc-value {
  color: var(--text-primary);
  font-weight: 500;
  word-break: break-all;
}
.dc-badge {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.dc-badge--run { background: var(--accent-dim); color: var(--accent); }
.dc-badge--done { background: rgba(52,211,153,0.15); color: #16a34a; }
.dc-badge--fail { background: rgba(239,68,68,0.15); color: #ef4444; }
.dc-bar {
  height: 6px;
  background: var(--bg-hover);
  border-radius: 999px;
  overflow: hidden;
}
.dc-bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.6s ease;
}
.dc-download {
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}
.dc-error {
  color: #ef4444;
  font-size: 13px;
  margin: 0;
}
.dc-reset {
  align-self: flex-start;
}
.btn {
  border: none;
  border-radius: var(--radius-md);
  padding: 9px 16px;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: var(--accent-hover); }
.btn-ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); }
.btn-ghost:hover { background: var(--bg-hover); }
</style>
