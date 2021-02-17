const { app, BrowserWindow, Menu, Tray, nativeImage, Notification, ipcMain, shell } = require('electron');
const path = require('path')
const Store = require('electron-store');
const { env } = require('process');

// Icon imports
const activeIconPath = path.join(__dirname, 'assets/tomat-active.png')
const inactiveIconPath = path.join(__dirname, 'assets/tomat-inactive.png')
const breakIconPath = path.join(__dirname, 'assets/tomat-break.png')
const pausedIconPath = path.join(__dirname, 'assets/tomat-paused.png')

// Settings schema for the electron-store
// Used to save settings when app is closed
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

// Hide the dock icon on Mac OS so it lives in the tray only
if (process.platform === 'darwin') {
  app.dock.hide()
}

// Opens the setting windows
function createWindow() {
  if(isWindowOpen === true) {
    window.focus()
  } else {
    window = new BrowserWindow({
      width: 640,
      height: 640,
      maxHeight: 640,
      maxWidth:640,
      show: false,
      frame:false, // Removes the OS border
      webPreferences: {
        nodeIntegration: true
      }
    })
    
  
    window.loadFile('index.html')
    isWindowOpen = true;
    
    /*
    win.webContents.openDevTools()
    IF ENVIRONMENT IS DEV
    */

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

// Renderer resets the timer
ipcMain.on('reset', (event, arg) => {
  resetTimer();
  updateIcon('inactive', tray)
  resetNotification()
  event.reply('reset-reply', {
    success: true
  })
})

// Renderer requests the timer value
ipcMain.on('timer', (event, arg) => {
  event.reply('timer-reply', ({
    timer: timer
  }))
})

// Renderer requests the current activity
ipcMain.on('activity', (event, arg) => {
  event.reply('activity-reply', ({
    activity: activity
  }))
})

// Renderer requests the current running state
ipcMain.on('running', (event, arg) => {
  event.reply('running-reply', ({
    running: running
  }))
})

// Renderer requests an update on the timers
ipcMain.on('update', (event, arg) => {
  store.set('breakTimer', arg.breakTimer)
  store.set('longBreakTimer', arg.longBreakTimer)
  store.set('sessionTimer', arg.sessionTimer)
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
    body: 'Take a long break.',
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
    body: 'tomat inactive.',
    sound: 'Hero'
  }
  new Notification(not).show()
}

// Used to update the tray icon depending on which activity we are currently in
function updateIcon(event, tray) {
  if (event === 'start') {
    tray.setImage(nativeImage.createFromPath(activeIconPath))
  } else if (event === 'pause') {
    tray.setImage(nativeImage.createFromPath(pausedIconPath))
  } else if (event === 'break') {
    tray.setImage(nativeImage.createFromPath(breakIconPath))
  } else if (event === 'inactive') {
    tray.setImage(nativeImage.createFromPath(inactiveIconPath))
  }
}

// Setup the app when it's loaded
app.on('ready', () => {
  // Tray image setup
  let image;
  image = nativeImage.createFromPath(inactiveIconPath)
  tray = new Tray(image)
  let check;
  // If we got saved openAtLogin setting extract it here
  if (app.getLoginItemSettings().openAtLogin === undefined) {
    check = false
  } else if (app.getLoginItemSettings().openAtLogin === false) {
    check = false
  } else {
    check = true
  }
  // Handle item menu interactions
  // TODO: Make control checks so you can't click stuff for states that are currently the active one
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
      updateIcon('inactive', tray)
      resetNotification()
    } else if (menuItem.label === 'Start on login') {
      // Enable or disable start on login
      if (menuItem.checked === false) {
        app.setLoginItemSettings({
          openAtLogin: false
        })
      } else {
        app.setLoginItemSettings({
          openAtLogin: true
        })
      }
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
    { label: 'Start on login', type: 'checkbox', click: handleClick, checked: check},
    { label: "Quit", type: 'normal', role: 'quit'}
  ])

  // Setup tray
  tray.setToolTip('tomat')
  tray.setContextMenu(contextMenu)
  // If we're not on MacOS, make left-clicking the icon open the settings window
  // as this would be the expected behaviour on Linux and Windows
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
          updateIcon('break', tray)
          timer = parseInt(store.get('longBreakTimer')) * 60
          activity = 'Long Break'
          longBreakNotification()
        } else {
          updateIcon('break', tray)
          timer = parseInt(store.get('breakTimer')) * 60
          activity = 'Break'
          breakNotification()
        }
        
      } // A break has ran out, initiate a session 
      else {
        updateIcon('start', tray)
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