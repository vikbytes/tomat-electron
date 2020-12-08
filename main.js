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
    default: "30"
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
  },
  ignoreDnD: {
    type: 'string',
    default: 'disabled'
  },
  sessions: {
    type: 'string',
    default: '4'
  },
  openAtLogin: {
    type: 'string',
    default: 'disabled'
  }
};



// Setup electron store
const store = new Store({schema});

// Global state variables
let activity;
let tray; // For tray icon
let running; // If the clock is running
let timer; // For user interface, not internal time keeping
let clock; //Used for internal time keeping, not for user interface
let window; // Only window
let isWindowOpen = false;
let sessions; // number of sessions before a long break

// Setup timer defaults
resetTimer()

// Hide the dock icon on Mac OS
if (process.platform === 'darwin') {
  app.dock.hide()
}

function launchOption() {
  currentSetting = store.get('openAtLogin')
  if (currentSetting === 'disabled') {
    app.setLoginItemSettings({
      openAtLogin: true
    })
    store.set('openAtLogin', 'enabled')
  } else {
    app.setLoginItemSettings({
      openAtLogin: false
    })
    store.set('openAtLogin', 'disabled')
  }
}

// Opens the setting windows
function createWindow() {
  if(isWindowOpen === true) {
    window.focus()
  } else {
    window = new BrowserWindow({
      width: 640,
      height: 720,
      show: false,
      webPreferences: {
        nodeIntegration: true
      }
    })
    
  
    window.loadFile('index.html')
    isWindowOpen = true;
    window.once('ready-to-show', window.show)
    
    // Open new window urls in the user's browser instead of ELectron
    window.webContents.on('new-window', function(e, url) {
      e.preventDefault();
      shell.openExternal(url);
    })

    window.on('closed', (e) => {
      isWindowOpen = false;
    })
  }
}

// Renderer requests the stored information so we provide it
ipcMain.on('load', (event, arg) => {
  event.reply('load-reply', ({
    breakTimer: store.get('breakTimer'),
    longBreakTimer: store.get('longBreakTimer'),
    sessionTimer: store.get('sessionTimer'),
    startHour: store.get('startHour'),
    endHour: store.get('endHour'),
    ignoreDnD: store.get('ignoreDnD'),
    sessions: store.get('sessions'),
    openAtLogin: store.get('openAtLogin')
  }))
})

// Renderer starts/pauses the timer
ipcMain.on('sp', (event, arg) => {
  if(running === true) {
    pauseClock();
    updateIcon('pause', tray)
    pauseNotification()
  } else {
    startClock();
    updateIcon('start', tray)
    sessionNotification()
  }
  event.reply('sp-reply', {
    success: true
  })
})

ipcMain.on('reset', (event, arg) => {
  resetTimer();
  updateIcon('stop', tray)
  resetNotification()
  event.reply('reset-reply', {
    success: true
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
  resetTimer()
})

// Setup Notification functions

function breakNotification() {
  const not = {
    title: 'tomat',
    body: 'Take a short break.',
    sound: 'Blow'
  }
  new Notification(not).show()
}

function sessionNotification() {
  const not = {
    title: 'tomat',
    body: 'Session started.',
    sound: 'Blow'
  }
  new Notification(not).show()
}

function longBreakNotification() {
  const not = {
    title: 'tomat',
    body: 'Longer break.',
    sound: 'Ping'
  }
  new Notification(not).show()
}

function pauseNotification() {
  const not = {
    title: 'tomat',
    body: 'tomat paused.',
    sound: 'Glass'
  }
  new Notification(not).show()
}

function resetNotification() {
  const not = {
    title: 'tomat',
    body: 'tomat reset.',
    sound: 'Hero'
  }
  new Notification(not).show()
}

function updateIcon(event, tray) {
  if (event === 'start') {
    tray.setImage(nativeImage.createFromPath(activeIconPath))
  } else if (event === 'pause') {
    tray.setImage(nativeImage.createFromPath(breakIconPath))
  } else if (event === 'stop') {
    tray.setImage(nativeImage.createFromPath(inactiveIconPath))
  }
}

// Setup the app when it's loaded
app.on('ready', () => {
  // Tray image setup
  let image;
  image = nativeImage.createFromPath(inactiveIconPath)
  tray = new Tray(image)

  // Handle item menu interactions
  const handleClick = (menuItem, BrowserWindow, event) => {
    if (menuItem.label === 'Settings') {
      createWindow()
    } else if (menuItem.label === 'Start') {
      startClock()
      updateIcon('start', tray)
      sessionNotification()
    } else if (menuItem.label === 'Pause') {
      if(running === true) {
        pauseClock()
        updateIcon('pause', tray)
        pauseNotification()
      }
    } else if (menuItem.label === 'Reset') {
      resetTimer();
      updateIcon('stop', tray)
      resetNotification()
    }
    else {
      console.log(menuItem.label)
    }
  }

  // Tray menu template
  const contextMenu = Menu.buildFromTemplate([
    { label: 'tomat', type: 'normal', enabled: false},
    { label: 'Settings', type: 'normal', click: handleClick },
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
  // If we're not on MacOS, make left-clicking the icon open the settings window
  if (process.platform !== 'darwin') {
    tray.on('click', (e) => {
      createWindow();
    })
  }
  
})

// Prevents the app from quitting on Linux when closing the settings window
app.on('window-all-closed', (e) => {
    e.preventDefault()
})




function startClock() {
    clock = setInterval(updateTimer, 1000)
    running = true;
}

function pauseClock() {
    running = false
    clearInterval(clock);
}

// Updates the timer variable every second and sends it to the renderer
function updateTimer() {
    timer -= 1;
    if(timer < 0) {
            // A session has ran out, initiate a break
      if (activity === 'Session') {
        // check if we need to do a longer break
        sessions -= 1
        if (sessions === 0) {
          timer = parseInt(store.get('longBreakTimer')) * 60
          activity = 'Long Break'
          longBreakNotification()
        } else {
          timer = parseInt(store.get('breakTimer')) * 60
          activity = 'Break'
          breakNotification()
        }
        
      } // A break has ran out, initiate a session 
      else {
        if (sessions === 0) {
          sessions = parseInt(store.get('sessions'))
        }
        timer = parseInt(store.get('sessionTimer')) * 60
        activity = 'Session'
        sessionNotification()
      }
    }   
}

function resetTimer() {
  if(running === true) {
    resetNotification()
  }
  pauseClock();
  activity = 'Session'
  timer = parseInt(store.get('sessionTimer')) * 60
  sessions = parseInt(store.get('sessions'))
}


