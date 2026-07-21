<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon--menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ menuCount }}</span>
          <span class="stat-label">系统总数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--doc">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ docCount }}</span>
          <span class="stat-label">文档总数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--visible">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ visibleMenuCount }}</span>
          <span class="stat-label">可见系统</span>
        </div>
      </div>
    </div>

    <!-- AI 对话框 -->
    <div class="chat-container">
      <div class="chat-header">
        <div class="chat-header-left">
          <div class="ai-avatar">
            <svg width="16" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73A2 2 0 0110 4a2 2 0 012-2z"/>
              <circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <span class="chat-title">AI 助手</span>
            <span class="chat-status">
              <span :class="['status-dot-ai', isThinking ? 'thinking' : 'online']"></span>
              {{ isThinking ? '思考中···' : '在线' }}
            </span>
          </div>
        </div>
        <label class="rag-switch" :class="{ 'rag-switch--on': useRag }" title="开启后，回答将基于你有权限查看的私有文档">
          <input type="checkbox" v-model="useRag" />
          <span class="rag-switch-track"><span class="rag-switch-knob"></span></span>
          <span class="rag-switch-label">基于文档回答</span>
        </label>
        <button class="btn btn-ghost btn-sm" @click="clearMessages" title="清空对话">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
          </svg>
          清空
        </button>
      </div>

      <!-- 消息区域 -->
      <div class="chat-messages" ref="messagesEl">
        <!-- 欢迎占位 -->
        <div v-if="messages.length === 0" class="chat-welcome">
          <div class="welcome-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73A2 2 0 0110 4a2 2 0 012-2z"/>
              <circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/>
            </svg>
          </div>
          <p class="welcome-title">你好，我是 AI 助手</p>
          <p class="welcome-sub">我是你的智能文档助手，可以回答系统功能、文档检索等问题</p>
          <div class="welcome-chips">
            <span class="chip" @click="setInput('帮我总结一下所有文档')">帮我总结一下所有文档</span>
            <span class="chip" @click="setInput('查找关于系统设置的内容')">查找关于系统设置的内容</span>
            <span class="chip" @click="setInput('这份文档的主要内容是什么')">这份文档的主要内容是什么</span>
          </div>
        </div>

        <!-- 消息列表 -->
        <template v-for="(msg, idx) in messages" :key="idx">
          <!-- 用户消息 -->
          <div v-if="msg.role === 'user'" class="msg msg-user">
            <div class="msg-bubble msg-bubble--user">{{ msg.content }}</div>
            <div class="msg-avatar msg-avatar--user">我</div>
          </div>
          <!-- AI 消息 -->
          <div v-else class="msg msg-ai">
            <div class="msg-avatar msg-avatar--ai">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73A2 2 0 0110 4a2 2 0 012-2z"/>
                <circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/>
              </svg>
            </div>
            <div class="msg-bubble msg-bubble--ai">
              <!-- 思考中 -->
              <span v-if="msg.loading && !msg.content" class="thinking-text">
                <span class="dot-pulse">思考中</span>
                <span class="ellipsis"><i>·</i><i>·</i><i>·</i></span>
              </span>
              <!-- 流式输出中（Markdown 渲染 + 光标） -->
              <div v-else class="markdown-body" :class="{ 'is-streaming': msg.streaming }">
                <div v-html="renderMarkdown(msg.content)"></div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 输入区 -->
      <div class="chat-input-area">
        <div class="chat-input-wrap">
          <textarea
            v-model="inputText"
            ref="inputEl"
            class="chat-input"
            :placeholder="useRag ? '基于私有文档提问，例如：这份制度里是怎么规定的？' : '输入消息，按 Enter 发送，Shift+Enter 换行...'"
            rows="1"
            @keydown.enter.exact.prevent="sendMessage"
            @input="autoResize"
          ></textarea>
          <button
            class="send-btn"
            :class="{ 'send-btn--active': inputText.trim() }"
            :disabled="!inputText.trim()"
            @click="sendMessage"
            title="发送"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p class="chat-hint">按 Enter 发送，Shift+Enter 换行</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { listModules } from '@/api/menu'
import http from '@/api/http'
import { renderMarkdown } from '@/utils/markdown'

// ===== 统计面板 =====
const menuCount = ref(0)
const visibleMenuCount = ref(0)
const docCount = ref(0)

async function fetchStats() {
  try {
    const menus = await listModules()
    menuCount.value = menus.length
    visibleMenuCount.value = menus.filter(m => m.isVisible).length
  } catch { /* ignore */ }
  try {
    const docs = await http.get('/docs', { params: { moduleId: 0 } }) || []
    docCount.value = Array.isArray(docs) ? docs.length : 0
  } catch { /* ignore */ }
}

// ===== 聊天核心 =====
const messages = ref([])
const inputText = ref('')
const messagesEl = ref(null)
const inputEl = ref(null)
const isThinking = ref(false)
const useRag = ref(false)    // 是否基于私有文档问答（RAG 模式）
let aiController = null      // fetch AbortController
let activeAiMsg = null       // 当前正在流式输出的 AI 消息对象
let typeTimer = null         // 打字机定时器
let pendingBuffer = ''       // 待逐字揭示的字符缓冲
let revealTarget = null      // 正在揭示的 AI 消息对象

/** SSE URL: 开发环境直连后端绕过代理缓冲，生产环境用相对路径 */
const sseBase = import.meta.env.DEV
  ? (import.meta.env.VITE_CHAT_SSE_BASE || 'http://localhost:8321')
  : ''

function setInput(text) {
  inputText.value = text
  inputEl.value?.focus()
}

/**
 * 发送消息 → fetch 流式读取（ReadableStream）→ 打字机逐字渲染
 */
async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isThinking.value) return

  // 用户消息上屏
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  nextTick(() => {
    if (inputEl.value) inputEl.value.style.height = 'auto'
    scrollToBottom()
  })

  // AI 消息占位（必须用 reactive，否则增量修改不触发视图更新 → 一次性刷出）
  const aiMsg = reactive({ role: 'ai', content: '', loading: true, streaming: true })
  messages.value.push(aiMsg)
  activeAiMsg = aiMsg
  isThinking.value = true
  scrollToBottom()

  aiController = new AbortController()
  pendingBuffer = ''

  try {
    let resp
    if (useRag.value) {
      // RAG 模式：POST /api/chat/rag，需携带登录凭证（按角色可见模块检索文档切片）
      const token = localStorage.getItem('helper-token')
      resp = await fetch(`${sseBase}/api/chat/rag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: text }),
        signal: aiController.signal
      })
    } else {
      // 普通模式：GET /api/chat/stream（已排除鉴权，无需凭证）
      const url = `${sseBase}/api/chat/stream?message=${encodeURIComponent(text)}`
      resp = await fetch(url, { signal: aiController.signal })
    }
    if (!resp.ok || !resp.body) {
      throw new Error('HTTP ' + resp.status)
    }
    const reader = resp.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buf = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })

      // 按 SSE 帧边界（空行）切分，逐帧解析
      let idx
      while ((idx = buf.indexOf('\n\n')) !== -1) {
        const frame = buf.slice(0, idx)
        buf = buf.slice(idx + 2)
        const payload = parseSseFrame(frame)
        if (payload === null) continue                 // 注释行 / 空帧
        if (payload === '[DONE]') { finishStream(); return }
        if (aiMsg.loading) aiMsg.loading = false
        pendingBuffer += payload                        // 入缓冲，由打字机揭示
        startTypewriter(aiMsg)
      }
    }
    // 流正常结束（未收到 [DONE]）
    finishStream()
  } catch (err) {
    if (err && err.name === 'AbortError') return        // 主动中断，忽略
    if (aiMsg.streaming || aiMsg.loading) {
      finishStream()
      if (!aiMsg.content) {
        aiMsg.content = useRag.value
          ? '抱歉，基于文档的问答失败（请确认已登录，且相关文档已索引）。'
          : '抱歉，连接出现异常，请稍后重试。'
      }
    }
  }
}

/**
 * 解析单个 SSE 帧，返回 data 内容；注释行 / 空帧返回 null
 */
function parseSseFrame(frame) {
  const lines = frame.split('\n')
  let data = ''
  let hasData = false
  for (const ln of lines) {
    if (ln.startsWith(':')) continue                    // 注释行（以 : 开头）
    if (ln.startsWith('data:')) {
      data += (hasData ? '\n' : '') + ln.slice(5).replace(/^ /, '')
      hasData = true
    }
  }
  return hasData ? data : null
}

/**
 * 打字机：把 pendingBuffer 中的字符以稳定节奏逐字揭示到消息内容
 */
function startTypewriter(msg) {
  revealTarget = msg
  if (typeTimer) return
  typeTimer = setInterval(() => {
    const t = revealTarget
    if (!t) { clearInterval(typeTimer); typeTimer = null; return }
    if (pendingBuffer.length === 0) {
      if (!t.streaming) {                               // 已结束且缓冲耗尽 → 自停
        clearInterval(typeTimer); typeTimer = null; revealTarget = null
      }
      return
    }
    // 自适应步长：缓冲越长揭得越快，保证长文本也能流畅收尾
    const step = Math.max(1, Math.min(3, Math.ceil(pendingBuffer.length / 30)))
    const piece = pendingBuffer.slice(0, step)
    pendingBuffer = pendingBuffer.slice(step)
    t.content += piece
    scrollToBottom()
  }, 24)
}

/** 结束当前流式输出（网络中止；光标由打字机在缓冲耗尽后关闭） */
function finishStream() {
  if (aiController) {
    try { aiController.abort() } catch {}
    aiController = null
  }
  if (activeAiMsg) {
    activeAiMsg.loading = false
    if (!typeTimer) activeAiMsg.streaming = false   // 无打字机运行时立即收尾
    activeAiMsg = null
  }
  isThinking.value = false
}

/** 清空对话 */
function clearMessages() {
  if (aiController) {
    try { aiController.abort() } catch {}
    aiController = null
  }
  if (typeTimer) { clearInterval(typeTimer); typeTimer = null }
  pendingBuffer = ''
  revealTarget = null
  activeAiMsg = null
  isThinking.value = false
  messages.value = []
}

/** 输入框自动撑高 */
function autoResize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

/** 滚到底部 */
function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
}

onMounted(fetchStats)
onBeforeUnmount(() => {
  if (aiController) { try { aiController.abort() } catch {} aiController = null }
  if (typeTimer) { clearInterval(typeTimer); typeTimer = null }
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 18px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all var(--transition);
}
.stat-card:hover {
  border-color: var(--border-color);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}
.stat-icon--menu { background: var(--accent-dim); color: var(--accent-hover); }
.stat-icon--doc { background: rgba(52,211,153,0.12); color: var(--success); }
.stat-icon--visible { background: rgba(96,165,250,0.12); color: var(--info); }

.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 24px; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
.stat-label { font-size: 12.5px; color: var(--text-muted); margin-top: 2px; }

/* ===== 聊天容器 ===== */
.chat-container {
  flex: 1;
  min-height: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}
.chat-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar {
  width: 36px; height: 36px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--accent), var(--accent-active));
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.chat-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
}
.chat-status {
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 1px;
}

/* 消息区 */
.chat-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-behavior: smooth;
}

/* 欢迎占位 */
.chat-welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  color: var(--text-muted);
  padding: 40px 0;
}
.welcome-icon {
  width: 72px; height: 72px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: var(--accent);
  margin-bottom: 8px;
}
.welcome-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
}
.welcome-sub {
  font-size: 13px;
  color: var(--text-muted);
  max-width: 360px;
  line-height: 1.6;
}
.welcome-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 8px;
}
.chip {
  padding: 6px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 12.5px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.chip:hover {
  background: var(--accent-dim);
  border-color: var(--accent);
  color: var(--accent-hover);
}

/* 消息气泡 */
.msg {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.msg-user {
  flex-direction: row-reverse;
}
.msg-ai {
  flex-direction: row;
}

.msg-avatar {
  width: 30px; height: 30px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600;
  flex-shrink: 0;
}
.msg-avatar--user {
  background: var(--accent-dim);
  color: var(--accent);
  border: 1px solid var(--accent-dim);
}
.msg-avatar--ai {
  background: linear-gradient(135deg, var(--accent), var(--accent-active));
  color: #fff;
}

.msg-bubble {
  max-width: 62%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}
.msg-bubble--user {
  background: linear-gradient(135deg, var(--accent), var(--accent-active));
  color: #fff;
  border-bottom-right-radius: 4px;
  white-space: pre-wrap;
}
.msg-bubble--ai {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-bottom-left-radius: 4px;
}

/* 打字动画（保留备用） */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 18px;
}
.typing-indicator span {
  width: 6px; height: 6px;
  background: var(--text-muted);
  border-radius: 50%;
  animation: bounce 1.2s infinite;
}
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-5px); opacity: 1; }
}

/* ===== 思考中 + 流式光标 ===== */

.thinking-text {
  display: flex;
  align-items: baseline;
  gap: 0;
  font-size: 13.5px;
  color: var(--text-muted);
}
.dot-pulse {
  animation: thinking-pulse 1.5s ease-in-out infinite;
}
.ellipsis i {
  font-style: normal;
  animation: ellipsis-blink 1.4s infinite;
  opacity: 0;
}
.ellipsis i:nth-child(1) { animation-delay: 0s; }
.ellipsis i:nth-child(2) { animation-delay: 0.2s; }
.ellipsis i:nth-child(3) { animation-delay: 0.4s; }
@keyframes thinking-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
@keyframes ellipsis-blink {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

/* 流式光标：跟随文本末尾（不换行） */
.markdown-body.is-streaming > div > :deep(:last-child)::after {
  content: '|';
  display: inline;
  margin-left: 1px;
  color: var(--accent);
  font-weight: 400;
  animation: cursor-blink 0.6s step-end infinite;
}
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ===== AI 气泡内 Markdown 渲染样式 ===== */
.markdown-body {
  line-height: 1.7;
  font-size: 14px;
  color: var(--text-primary);
  word-break: break-word;
  /* 保留模型原始空格与缩进：避免段落/代码文本因 white-space:normal 被折叠空格而改变原意 */
  white-space: pre-wrap;
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin: 16px 0 8px;
  line-height: 1.4;
  color: var(--text-primary);
}
/* 标题字号逐级递减，梯度明显 */
.markdown-body :deep(h1) { font-size: 22px; font-weight: 700; }
.markdown-body :deep(h2) {
  font-size: 19px; font-weight: 700;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border-color);
}
.markdown-body :deep(h3) { font-size: 16.5px; font-weight: 600; }
.markdown-body :deep(h4) { font-size: 14.5px; font-weight: 600; }
.markdown-body :deep(h5) { font-size: 13.5px; font-weight: 600; color: var(--text-secondary); }
.markdown-body :deep(h6) { font-size: 13px; font-weight: 600; color: var(--text-muted); }
.markdown-body :deep(p) { margin: 6px 0; }
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 6px 0;
  padding-left: 22px;
}
.markdown-body :deep(li) { margin: 3px 0; }
.markdown-body :deep(strong) { color: var(--text-primary); font-weight: 600; }
.markdown-body :deep(em) { color: var(--text-secondary); }
.markdown-body :deep(a) {
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid var(--accent-dim);
}
.markdown-body :deep(a:hover) { opacity: 0.85; }
.markdown-body :deep(blockquote) {
  margin: 8px 0;
  padding: 6px 12px;
  border-left: 3px solid var(--accent-dim);
  background: var(--bg-tertiary, rgba(0,0,0,0.03));
  color: var(--text-secondary);
  border-radius: 0 6px 6px 0;
}
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 12px 0;
}
.markdown-body :deep(code) {
  background: var(--bg-tertiary, rgba(0,0,0,0.06));
  padding: 1px 6px;
  border-radius: 4px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 12.5px;
  color: #c7254e;
}
.markdown-body :deep(pre) {
  margin: 8px 0;
  padding: 12px 14px;
  background: var(--bg-tertiary, #1e1e2e);
  border-radius: 8px;
  overflow-x: auto;
  white-space: pre;
}
.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #e6e6e6;
  font-size: 12.5px;
  line-height: 1.55;
  white-space: pre;
}
.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
  width: 100%;
  font-size: 13px;
}
.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--border-color);
  padding: 6px 10px;
  text-align: left;
}
.markdown-body :deep(th) {
  background: var(--bg-tertiary, rgba(0,0,0,0.04));
  font-weight: 600;
}
.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 6px;
}

/* ===== AI 在线状态指示 ===== */

.status-dot-ai {
  width: 7px; height: 7px;
  border-radius: 50%;
  display: inline-block;
  transition: all 0.3s;
}
.status-dot-ai.online {
  background: var(--success);
  box-shadow: 0 0 6px rgba(52,211,153,0.6);
}
.status-dot-ai.thinking {
  background: var(--accent);
  box-shadow: 0 0 6px var(--accent-dim);
  animation: thinking-glow 1s ease-in-out infinite;
}
@keyframes thinking-glow {
  0%, 100% { opacity: 0.5; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1); }
}

/* 输入区 —— 背景与容器(card)一致，输入框底色与 AI 气泡(secondary)呼应 */
.chat-input-area {
  padding: 2px 20px 3px;
  border-top: 1px solid var(--border-color);
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.chat-input-wrap {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 2px 10px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.chat-input-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}
.chat-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  font-size: 13.5px;
  line-height: 1.55;
  letter-spacing: 0.2px;
  caret-color: var(--accent);
  padding: 0;
  max-height: 80px;
  overflow-y: auto;
}
.chat-input::placeholder {
  color: var(--text-muted);
  font-size: 12.5px;
  letter-spacing: 0;
  opacity: 0.8;
}

.send-btn {
  width: 28px; height: 28px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--bg-secondary);
  color: var(--text-muted);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.send-btn--active {
  background: var(--accent);
  color: #fff;
}
.send-btn--active:hover {
  background: var(--accent-active);
  transform: scale(1.05);
}
.send-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* RAG 模式开关 */
.rag-switch {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  user-select: none;
  padding: 4px 6px;
  border-radius: var(--radius-md);
  transition: background 0.15s;
}
.rag-switch:hover {
  background: var(--bg-tertiary, rgba(0,0,0,0.04));
}
.rag-switch input {
  display: none;
}
.rag-switch-track {
  width: 34px;
  height: 18px;
  border-radius: 10px;
  background: var(--border-color);
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}
.rag-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.25);
  transition: transform 0.2s;
}
.rag-switch--on .rag-switch-track {
  background: var(--accent);
}
.rag-switch--on .rag-switch-knob {
  transform: translateX(16px);
}
.rag-switch-label {
  font-size: 12.5px;
  color: var(--text-muted);
  white-space: nowrap;
}
.rag-switch--on .rag-switch-label {
  color: var(--accent-hover);
}

.chat-hint {
  display: none;
}
</style>
