const { app, BrowserWindow, Menu, Tray, nativeImage, Notification, ipcMain, shell } = require('electron');
const path = require('path')
const Store = require('electron-store');

// Icon imports
const activeIconPath = path.join(__dirname, 'assets/tomat-active.png')
const inactiveIconPath = path.join(__dirname, 'assets/tomat-inactive.png')
const breakIconPath = path.join(__dirname, 'assets/tomat-break.png')

// Settings schema for the electron-store
const schema = {
  state: {
    type: 'string',
    default: 'disabled'
  },
  breakTimer: {
    type: 'string',
    default: "5"
  },
  longBreakTimer: {
    type: 'string',
    default: "15"
  },
  sessionTimer: {
    type: 'string',
    default: "25"
  },
  startHour: {
    type: 'string',
    default: "08:00"
  },
  endHour: {
    type: 'string',
    default: "17:00"
  }
};

// Setup electron store
const store = new Store({schema});

let state = store.get('state')
let activity;

// Hide the dock icon on Mac OS
//app.dock.hide()

// Global state variables
let tray; // For tray icon
let running; // If the clock is running
let timer; // For user interface, not internal time keeping
let clock; //Used for internal time keeping, not for user interface
let mainWindow; // Only window

// Test
resetTimer();

// Opens the setting windows
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 640,
    height: 720,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  })
  
  mainWindow.loadFile('index.html')
  mainWindow.once('ready-to-show', mainWindow.show)

  // Open new window urls in the user's browser instead of ELectron
  mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    shell.openExternal(url);
  })
}

ipcMain.on('load', (event, arg) => {
  event.reply('load-reply', ({
    breakTimer: store.get('breakTimer'),
    longBreakTimer: store.get('longBreakTimer'),
    sessionTimer: store.get('sessionTimer'),
    startHour: store.get('startHour'),
    endHour: store.get('endHour')
  }))
})

ipcMain.on('start', (event, arg) => {
  startClock();
  event.reply('start-reply', {
    //
  })
})

ipcMain.on('pause', (event, arg) => {
  pauseClock();
  event.reply('pause-reply', {
    //
  })
})

ipcMain.on('reset', (event, arg) => {
  resetTimer();
  event.reply('reset-reply', {
    //
  })
})

ipcMain.on('timer', (event, arg) => {
  event.reply('timer-reply', ({
    timer: timer
  }))
})

ipcMain.on('activity', (event, arg) => {
  event.reply('activity-reply', ({
    activity: activity
  }))
})

ipcMain.on('running', (event, arg) => {
  event.reply('running-reply', ({
    running: running
  }))
})

ipcMain.on('update', (event, arg) => {
  store.set('breakTimer', arg.breakTimer)
  store.set('longBreakTimer', arg.longBreakTimer)
  store.set('sessionTimer', arg.sessionTimer)
  store.set('startHour', arg.startHour)
  store.set('endHour', arg.endHour)
})

// Setup the app when it's loaded
app.on('ready', () => {
  // Tray image setup
  let image;
  image = nativeImage.createFromPath(inactiveIconPath)
  tray = new Tray(image)

  // Setup notifications
  const breakNotification = new Notification({
    title: 'tomat',
    body: 'Take a short break.',
    sound: 'Blow'
  });

  const startNotification = new Notification({
    title: 'tomat',
    body: 'Start a session.',
    sound: 'absolute/path/to/file.mp3'
  })

  const longBreakNotification = new Notification({
    title: 'tomat',
    body: 'Take a long break.',
    sound: 'Ping'
  })

  const disabledNotification = new Notification({
    title: 'tomat',
    body: 'tomat disabled.',
    sound: 'Glass'
  })

  const enabledNotification = new Notification({
    title: 'tomat',
    body: 'tomat enabled.',
    sound: 'Hero'
  })

  // Handle item menu interactions
  const handleClick = (menuItem, BrowserWindow, event) => {
    if (menuItem.label === 'Settings') {
      createWindow()
    } else if (menuItem.label === 'Start') {
      startClock()
      tray.setImage(nativeImage.createFromPath(activeIconPath))
    } else if (menuItem.label === 'Pause') {
      pauseClock()
      tray.setImage(nativeImage.createFromPath(breakIconPath))
    } else if (menuItem.label === 'Reset') {
      resetTimer();
      tray.setImage(nativeImage.createFromPath(inactiveIconPath))
    }
    else {
      console.log(menuItem.label)
    }
  }

  // Tray menu template
  const contextMenu = Menu.buildFromTemplate([
    { label: 'tomat', type: 'normal', enabled: false},
    { label: 'About', type: 'normal', role: 'about'},
    { label: 'Settings', type: 'normal', click: handleClick },
    //{ label: "sep", type: 'separator'},
    //{ label: 'Enabled', type: 'radio', click: handleClick, checked: (state === 'enabled') ? true : false },
    //{ label: 'Disabled', type: 'radio', click: handleClick, checked: (state === 'disabled') ? true : false },
    { label: "sep", type: 'separator'},
    { label: 'Start', type: 'normal', click: handleClick},
    { label: 'Pause', type: 'normal', click: handleClick},
    { label: 'Reset', type: 'normal', click: handleClick},
    { label: "sep", type: 'separator'},
    { label: "Quit", type: 'normal', role: 'quit'}
  ])

  // Setup tray
  tray.setToolTip('tomat')
  tray.setContextMenu(contextMenu)
})

// Make sure the app quits properly instead of remaining in memory on Mac OS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function startClock() {
    clock = setInterval(updateTimer, 1000)
    running = true
}

function pauseClock() {
  running = false
    clearInterval(clock);
}

// Updates the timer variable every second and sends it to the renderer
function updateTimer() {
    timer -= 1;
    if(timer <= 0) {
      // A session has ran out, initiate a break
      if (activity === 'Session') {
        timer = parseInt(store.get('breakTimer')) * 60
        activity = 'Break'
      } // A break has ran out, initiate a session 
      else if (activity === 'Break') {
        timer = parseInt(store.get('sessionTimer')) * 60
        activity = 'Session'
      }
    }   
}

function resetTimer() {
  running = false
    activity = 'Session'
    timer = parseInt(store.get('sessionTimer')) * 60
}