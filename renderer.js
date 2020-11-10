const {ipcRenderer} = require('electron');

ipcRenderer.on('load-reply', (event, arg) => {
  console.log('load-reply')
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

ipcRenderer.on('reset-reply', (event, arg) => {
  //
})

ipcRenderer.on('start-reply', (event, arg) => {

})

ipcRenderer.on('pause-reply', (event, arg) => {

})