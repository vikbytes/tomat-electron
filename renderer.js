const {ipcRenderer} = require('electron');

let clock;


window.addEventListener('load',
  function() {
    updateTimer()
    startClock();
    console.log('success')
});

// Used for the frontend to keep updating from the backend
function startClock() {
  updateTimer();
  clock = setInterval(updateTimer, 17)
}

function reset() {
  ipcRenderer.send('reset')
}

function sp() {
  ipcRenderer.send('sp')
}

// Updates the timer variable every second and sends it to the renderer
function updateTimer() {
  ipcRenderer.send('timer')
  ipcRenderer.send('activity')
  ipcRenderer.send('running')
}

ipcRenderer.on('load-reply', (event, arg) => {
  document.getElementById('breaklength').value = arg.breakTimer;
  document.getElementById('sessionlength').value = arg.sessionTimer;
  document.getElementById('longbreaklength').value = arg.longBreakTimer;
  document.getElementById('starthour').value = arg.startHour;
  document.getElementById('endhour').value = arg.endHour;
})

ipcRenderer.on('timer-reply', (event, arg) => {
  let res = parseInt(Number(arg.timer))
  let min = String(parseInt(res/60));
  let sec = String(((String(parseInt(res%60)).length === 1) ? "0" : "") + String(parseInt(res%60)));
  document.getElementById('timer').innerHTML = `${min}:${sec}`;
})

ipcRenderer.on('activity-reply', (event, arg) => {
  document.getElementById('activity').innerHTML = arg.activity;
})

ipcRenderer.on('running-reply', (event, arg) => {
  console.log(arg.running)
  if(arg.running === true) {
    document.getElementById('ss').innerHTML = 'Pause'
    document.getElementById('spbutton').classList.remove('btn-primary')
    document.getElementById('spbutton').classList.add('btn-danger')
  } else {
    document.getElementById('ss').innerHTML = 'Start'
    document.getElementById('spbutton').classList.remove('btn-danger')
    document.getElementById('spbutton').classList.add('btn-primary')
  }
})

ipcRenderer.on('sp-reply', (event, arg) => {
  if(arg.success === true) {
    console.log('successful sp command executed')
  } else {
    console.log('unsucessful sp command')
  }
})

ipcRenderer.on('reset-reply', (event, arg) => {
  if(arg.success === true) {
    console.log('successful reset command executed')
  } else {
    console.log('unsucessful reset command')
  }
})
