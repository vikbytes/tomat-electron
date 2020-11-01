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

const handleClick = (menuItem, BrowserWindow, event) => {
  if (menuItem.label === 'Enabled') {
    console.log("Enabled")
    tray.setImage('./assets/tomat-active.png')
  } else if (menuItem.label === 'Disabled') {
    console.log("Disabled")
    tray.setImage('./assets/tomat-inactive.png')
  } else if (menuItem.label === 'Quit') {
    app.quit()
  } 
  else {
    console.log(menuItem.label)
  }
  //console.log(menuItem + " clicked in " + BrowserWindow + " by " + event);
}

app.whenReady().then(() => {
  tray = new Tray('./assets/tomat-inactive.png')
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Enabled', type: 'radio', click: handleClick},
    { label: 'Disabled', type: 'radio', click: handleClick, checked: true},
    { label: "sep", type: 'separator'},
    { label: "Quit", type: 'normal', click: handleClick}
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

