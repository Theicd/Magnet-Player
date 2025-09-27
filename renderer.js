const magnetInput = document.getElementById('magnet')
const playBtn = document.getElementById('play')
const statusEl = document.getElementById('status')
const videoEl = document.getElementById('video')

let streamUrl = ''

window.magnetPlayer.onReady(({ name, port }) => {
  statusEl.textContent = `מנגן: ${name}`
  if (!port) {
    statusEl.textContent = 'שרת הזרמה לא זמין'
    return
  }
  streamUrl = `http://127.0.0.1:${port}/stream`
  videoEl.src = streamUrl
  videoEl.play().catch(() => {})
})

window.magnetPlayer.onError(msg => {
  statusEl.textContent = msg || 'שגיאה בניגון'
})

window.magnetPlayer.onPort(port => {
  if (currentFileReady()) {
    streamUrl = `http://127.0.0.1:${port}/stream`
    videoEl.src = streamUrl
  }
})

function currentFileReady () {
  return videoEl.src && videoEl.src.startsWith('http://127.0.0.1')
}

playBtn.addEventListener('click', () => {
  const magnet = (magnetInput.value || '').trim()
  if (!/^magnet:/i.test(magnet)) {
    statusEl.textContent = 'נא להזין קישור מגנט תקין'
    return
  }
  statusEl.textContent = 'טוען טורנט...'
  window.magnetPlayer.addMagnet(magnet)
})
