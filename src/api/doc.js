import http from './http'

// ======================== 文档 API ========================

export function uploadFile(file) {
  const fd = new FormData()
  fd.append('file', file)
  return http.post('/docs/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function listDocsByMenu(moduleId) {
  return http.get('/docs', { params: { moduleId } })
}

export function getDocByDocId(docId) {
  return http.get(`/docs/${docId}`)
}

export function listDocsByTag(tag) {
  return http.get('/docs/byTag', { params: { tag } })
}

export function searchDocs(keyword) {
  return http.get('/docs/search', { params: { keyword } })
}

export function createDoc(data) {
  return http.post('/docs', data)
}

export function updateDoc(docId, data) {
  return http.put(`/docs/${docId}`, data)
}

export function deleteDoc(docId) {
  return http.delete(`/docs/${docId}`)
}

export function getDocHistory(docId) {
  return http.get(`/docs/${docId}/history`)
}

export function getDownloadUrl(docId) {
  return `/api/docs/${docId}/download`
}

export function updateDocTags(docId, docTags) {
  return http.put(`/docs/${docId}/tags`, { docTags })
}
