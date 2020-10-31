const { app, BrowserWindow, Menu, Tray } = require('electron');

try {
  require('electron-reloader')(module)
} catch (_) {}

let tray = null

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    backgroundColor: '#222222'
  })

  mainWindow.loadFile('index.html')
  mainWindow.once('ready-to-show', mainWindow.show)
}

app.whenReady().then(() => {
  tray = new Tray('./tomat-inactive.png')
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Item1', type: 'radio'},
    { label: 'Item2', type: 'radio', checked: true}
  ])
  tray.setToolTip('Tomat')
  tray.setContextMenu(contextMenu)
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

