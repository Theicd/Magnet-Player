const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const http = require('http')
const WebTorrent = require('webtorrent')

let win, client, currentFile, currentTorrent, server, serverPort

function ensureWindow () {
  win = new BrowserWindow({ width: 900, height: 600, webPreferences: { preload: path.join(__dirname, 'preload.js') } })
  win.loadFile('index.html')
  win.on('closed', () => { win = null })
}

function pickVideo (files) {
  return files.sort((a, b) => (b.length || 0) - (a.length || 0)).find(f => /\.(mp4|mkv|webm|mov|avi)$/i.test(f.name))
}

function createServer () {
  if (server) return
  server = http.createServer((req, res) => {
    if (!currentFile || req.url !== '/stream') { res.writeHead(404); return res.end() }
    const range = req.headers.range
    const size = currentFile.length
    const mime = currentFile.mime || 'video/mp4'
    if (!range) {
      res.writeHead(200, { 'Content-Length': size, 'Content-Type': mime })
      return currentFile.createReadStream().pipe(res)
    }
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-')
    const start = parseInt(startStr, 10)
    const end = endStr ? parseInt(endStr, 10) : size - 1
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': mime
    })
    currentFile.createReadStream({ start, end }).pipe(res)
  })
  server.listen(0, () => {
    serverPort = server.address().port
    if (win) win.webContents.send('server-port', serverPort)
  })
}

function loadMagnet (magnet) {
  if (!client) client = new WebTorrent()
  createServer()
  if (currentTorrent) {
    try { currentTorrent.destroy({ destroyStore: true }) } catch (_) {}
    currentTorrent = null
  }
  currentFile = null
  client.add(magnet, torrent => {
    currentTorrent = torrent
    const file = pickVideo(torrent.files)
    if (!file) return win && win.webContents.send('player-error', 'לא נמצא קובץ וידאו')
    currentFile = file
    const port = serverPort || (server?.address()?.port)
    win && win.webContents.send('player-ready', { name: file.name, port })
  })
}

ipcMain.on('add-magnet', (_e, magnet) => {
  if (/^magnet:/i.test(magnet)) loadMagnet(magnet)
  else win && win.webContents.send('player-error', 'המחרוזת אינה מגנט')
})

app.whenReady().then(ensureWindow)
app.on('window-all-closed', () => { if (server) server.close(); if (client) client.destroy(); app.quit() })
