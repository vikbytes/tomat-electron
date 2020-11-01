const { app, BrowserWindow, Menu, Tray, nativeImage } = require('electron');
const path = require('path')

const activeIconPath = path.join(__dirname, 'assets/tomat-active.png')
const inactiveIconPath = path.join(__dirname, 'assets/tomat-inactive.png')
const breakIconPath = path.join(__dirname, 'assets/tomat-break.png')

const Store = require('electron-store');
const store = new Store();

try {
  require('electron-reloader')(module)
} catch (_) {}

app.dock.hide()
let tray = null

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 640,
    height: 480,
    show: false
  })

  mainWindow.loadFile('index.html')
  mainWindow.once('ready-to-show', mainWindow.show)
}

const handleClick = (menuItem, BrowserWindow, event) => {
  if (menuItem.label === 'Enabled') {
    tray.setImage(nativeImage.createFromPath(activeIconPath))
    store.set('state', 'enabled');
  } else if (menuItem.label === 'Disabled') {
    tray.setImage(nativeImage.createFromPath(inactiveIconPath))
    store.set('state', 'disabled')
  } else if (menuItem.label === 'Settings') {
    createWindow()
  }
  else {
    console.log(menuItem.label)
  }
}

app.on('ready', () => {
  let state = store.get('state')
  let image;
  if (state === 'enabled') {
    image = nativeImage.createFromPath(activeIconPath)
  } else if (state === 'disabled') {
    image = nativeImage.createFromPath(inactiveIconPath) 
  } else {
    image = nativeImage.createFromPath(inactiveIconPath)
  }
  tray = new Tray(image)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Tomat', type: 'normal', enabled: false},
    { label: 'About', type: 'normal', role: 'about'},
    { label: 'Settings', type: 'normal', click: handleClick },
    { label: "sep", type: 'separator'},
    { label: 'Enabled', type: 'radio', click: handleClick, checked: false},
    { label: 'Disabled', type: 'radio', click: handleClick, checked: true},
    { label: "sep", type: 'separator'},
    { label: "Quit", type: 'normal', role: 'quit'}
  ])
  tray.setToolTip('tomat')
  tray.setContextMenu(contextMenu)
  //createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    //createWindow()
  }
})

