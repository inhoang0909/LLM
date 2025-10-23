import { ref, onMounted, onUnmounted } from 'vue'

export function useSessionTimeout(timeoutMinutes = 15) {
  const warningShown = ref(false)
  const timeoutMs = timeoutMinutes * 60 * 1000
  let timeoutId = null
  let events = ['mousemove', 'keydown', 'click', 'scroll']
  const onTimeout = ref(null) 

  function resetTimer() {
    localStorage.setItem('lastActivity', Date.now())
    warningShown.value = false
    clearTimeout(timeoutId)
    startTimer()
  }

  function startTimer() {
    timeoutId = setTimeout(() => {
      const last = Number(localStorage.getItem('lastActivity'))
      const diff = Date.now() - last

      if (diff >= timeoutMs) {
        warningShown.value = true
        if (onTimeout.value) onTimeout.value()
      } else {
        startTimer() // vẫn trong hạn, tiếp tục theo dõi
      }
    }, 60 * 1000) // kiểm tra mỗi phút
  }

  onMounted(() => {
    // reset khi có hoạt động
    events.forEach(e => window.addEventListener(e, resetTimer))
    resetTimer()
  })

  onUnmounted(() => {
    clearTimeout(timeoutId)
    events.forEach(e => window.removeEventListener(e, resetTimer))
  })

  return { warningShown, onTimeout }
}
