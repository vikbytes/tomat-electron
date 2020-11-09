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

// Extract data from the electron store
let state = store.get('state')
let breakTimer = store.get('breakTimer')
let longBreakTimer = store.get('longBreakTimer')
let sessionTimer = store.get('sessionTimer')
let startHour = store.get('startHour')
let endHour = store.get('endHour')

// Hide the dock icon on Mac OS
app.dock.hide()

// Global state variables
let tray = null

let mainWindow;

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
  event.reply('load', ({
    breakTimer: breakTimer,
    longBreakTimer: longBreakTimer,
    sessionTimer: sessionTimer,
    startHour: startHour,
    endHour: endHour
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
  if (state === 'enabled') {
    image = nativeImage.createFromPath(activeIconPath)
  } else if (state === 'disabled') {
    image = nativeImage.createFromPath(inactiveIconPath) 
  } else {
    image = nativeImage.createFromPath(inactiveIconPath)
  }
  tray = new Tray(image)

  // Setup notifications
  const breakNotification = new Notification({
    title: 'Break',
    body: 'test',
    sound: 'absolute/path/to/file.mp3'
  });

  const startNotification = new Notification({
    title: 'Start',
    body: 'test',
    sound: 'absolute/path/to/file.mp3'
  })

  const longBreakNotification = new Notification({
    title: 'Long Break',
    body: 'test',
    sound: 'absolute/path/to/file.mp3'
  })

  const disabledNotification = new Notification({
    title: 'Disabled',
    body: 'test',
    sound: 'absolute/path/to/file.mp3'
  })

  const enabledNotification = new Notification({
    title: 'Enabled',
    body: 'test',
    sound: 'absolute/path/to/file.mp3'
  })

  // Handle item menu interactions
  const handleClick = (menuItem, BrowserWindow, event) => {
    if (menuItem.label === 'Enabled') {
      tray.setImage(nativeImage.createFromPath(activeIconPath))
      store.set('state', 'enabled');
      enabledNotification.show();
    } else if (menuItem.label === 'Disabled') {
      tray.setImage(nativeImage.createFromPath(inactiveIconPath))
      store.set('state', 'disabled')
      disabledNotification.show();
    } else if (menuItem.label === 'Settings') {
      createWindow()
    }
    else {
      console.log(menuItem.label)
    }
  }

  // Tray menu template
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Tomat', type: 'normal', enabled: false},
    { label: 'About', type: 'normal', role: 'about'},
    { label: 'Settings', type: 'normal', click: handleClick },
    { label: "sep", type: 'separator'},
    { label: 'Enabled', type: 'radio', click: handleClick, checked: (state === 'enabled') ? true : false },
    { label: 'Disabled', type: 'radio', click: handleClick, checked: (state === 'disabled') ? true : false },
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

// Local variables
let running = false
let sessionStarted = false
let breakStarted = false

// Counting variables
let breakseconds;
let sessionseconds;

function update() {
    breakTimer = document.getElementById("breaklength").value;
    store.set('breakTimer', breakTimer)
    longBreakTimer = document.getElementById("longbreaklength").value;
    store.set('longBreakTimer', longBreakTimer)
    sessionTimer = document.getElementById("sessionlength").value;
    store.set('sessionTimer', sessionTimer)
    startHour = document.getElementById("starthour").value;
    store.set('startHour', startHour)
    endHour = document.getElementById("endhour").value;
    store.set('endHour', endHour)

    console.log("Heya")
}

function convertTimers() {
    breakseconds = breaklength * 60;
    sessionseconds = sessionlength * 60;
}

let clock;

// Used when the user interacts with elements in settings
function processInput(input) {
    if (input === 'bd') {
        breakDecrement();
    } else if (input === 'bi') {
        breakIncrement();
    } else if (input === 'sd') {
        sessionDecrement();
        if (sessionStarted !== true) {
            timeCounter = sessionLength * 60
            convertTime();
        }
    } else if (input === 'si') {
        sessionIncrement();
        if (sessionStarted !== true) {
            timeCounter = sessionLength * 60
            convertTime();
        }
    } else if (input === 'r') {
        stopAudio();
        resetCounters();
    } else if (input === 'ss') {
        if ((sessionStarted === true) || (breakStarted === true)) {
            if (running === true) {
                pauseTimer();
            } else {
                startTimer();
            }
        } else {
            initializeSessionCounter();
            startTimer();
        }
    }
    updateDisplay();
}

// Port this out of here
function updateDisplay() {
    document.getElementById('break-length').textContent = breakLength
    document.getElementById('session-length').textContent = sessionLength
    document.getElementById('time-left').textContent = time
}

function initializeSessionCounter() {
    timeCounter = sessionLength * 60
    sessionStarted = true
    document.getElementById('timer-label').textContent = "Session"
    convertTime();
    manageTimer();
    updateDisplay();
}

function manageTimer() {
    if (timeCounter == 0) {
        playAudio();
    } else if(timeCounter == -1) {
        if (sessionStarted === true) {
            timeCounter = breakLength * 60
            breakStarted = true
            sessionStarted = false
            document.getElementById('timer-label').textContent = "Break"
        } else if (breakStarted === true) {
            timeCounter = sessionLength * 60
            breakStarted = false
            sessionStarted = true
            document.getElementById('timer-label').textContent = "Session"
        }
        convertTime();
        updateDisplay();
    }   
}

function startTimer() {
    clock = setInterval(updateTimer, 1000)
    running = true
}

function pauseTimer() {
    clearInterval(clock);
    running = false
}

function updateTimer() {
    timeCounter -= 1;
    convertTime();
    updateDisplay();
    manageTimer();
}

function resetCounters() {
    breakLength = 5
    sessionLength = 25
    timeCounter = 1500
    convertTime();
    clearInterval(clock);
    running = false
    sessionStarted = false
    breakStarted = false
    document.getElementById('timer-label').textContent = "Session"
}

function convertTime() {
    let min = Math.floor(timeCounter / 60)
    let sec = Math.floor(timeCounter % 60)
    strMin = ""
    strSec = ""
    if (min < 10) {
        strMin = String("0"+min)
    } else {
        strMin = String(min)
    }
    if (sec < 10) {
        strSec = String("0"+sec)
    } else {
        strSec = String(sec)
    }
    time = strMin + ":" + strSec
    console.log(time)
}

function playAudio() {
    document.getElementById("beep").play()
}

function stopAudio() {
    document.getElementById("beep").pause()
    document.getElementById("beep").currentTime = 0;
}

function breakDecrement() {
    if (breakLength <= 1) {
        breakLength = 1
    } else {
        breakLength -= 1
    }
}

function breakIncrement() {
    if (breakLength >= 59) {
        breakLength = 60
    } else {
        breakLength += 1
    }
}

function sessionDecrement() {
    if (sessionLength <= 1) {
        sessionLength = 1
    } else {
        sessionLength -= 1
    }
}

function sessionIncrement() {
    if (sessionLength >= 59) {
        sessionLength = 60
    } else {
        sessionLength += 1
    }
}