import MarkdownIt from 'markdown-it'

// 统一 Markdown 渲染：关闭原始 HTML 注入（html:false），模型输出中的标签会被转义，避免 XSS
const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
  typographer: false,
})

/**
 * 标题兼容预处理：
 * CommonMark 要求 `#` 后必须跟空格才识别为标题。本地 qwen 模型在中文场景下
 * 常输出 `##测试文案`（缺空格），导致被当作普通文本、无标题样式。
 * 这里对「行首 1~6 个 # 后紧跟非空格非 # 字符」的情况自动补一个空格，
 * 但跳过围栏代码块（``` ... ```）内部内容，避免误改代码。
 */
function normalizeHeadings(src) {
  if (!src) return ''
  const lines = src.split('\n')
  let inFence = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // 切换围栏代码块状态（``` 或 ~~~）
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    // 行首 # 后缺空格 → 补空格（层级 1~6）
    lines[i] = line.replace(/^(\s{0,3}#{1,6})([^#\s])/, '$1 $2')
  }
  return lines.join('\n')
}

export function renderMarkdown(src) {
  if (!src) return ''
  return md.render(normalizeHeadings(src))
}

export default renderMarkdown
