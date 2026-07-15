import { ref } from 'vue'

const toasts = ref([])
let _id = 0

export function showToast(message, type = 'success', duration = 2500) {
  const id = ++_id
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

export function useToast() {
  return {
    toasts,
    success(msg) { showToast(msg, 'success') },
    error(msg) { showToast(msg, 'error', 3500) }
  }
}
