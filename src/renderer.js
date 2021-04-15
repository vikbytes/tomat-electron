const { ipcRenderer } = require("electron");

// The variable for the running clock
let clock;

// When the window loads we update our variables to we got current info
window.addEventListener("load", function () {
  updateTimer();
  startClock();
});

// Used for the frontend to keep updating from the backend
// Uses the (approximate) timing of one frame (on 60 Hz monitors)
// As the update interval to always display an accurate time and not
// be far behind the main thread
function startClock() {
  updateTimer();
  clock = setInterval(updateTimer, 17);
}

// Fires a reset command to main
function reset() {
  ipcRenderer.send("reset");
}

// Fires a start/pause command to main
function sp() {
  ipcRenderer.send("sp");
}

// Updates the timer variable every second and sends it to the renderer
function updateTimer() {
  ipcRenderer.send("timer");
  ipcRenderer.send("activity");
  ipcRenderer.send("running");
}

// We got a reply from main with the default timer values and update our elements
ipcRenderer.on("load-reply", (event, arg) => {
  document.getElementById("breaklength").value = arg.breakTimer;
  document.getElementById("sessionlength").value = arg.sessionTimer;
  document.getElementById("longbreaklength").value = arg.longBreakTimer;
});

// We got a reply from main with the timer value and update our element
ipcRenderer.on("timer-reply", (event, arg) => {
  let res = parseInt(Number(arg.timer));
  let min = String(parseInt(res / 60));
  let sec = String(
    (String(parseInt(res % 60)).length === 1 ? "0" : "") +
      String(parseInt(res % 60))
  );
  document.getElementById("timer").innerHTML = `${min}:${sec}`;
});

// We got a reply from main with the activity value and update our element
ipcRenderer.on("activity-reply", (event, arg) => {
  document.getElementById("activity").innerHTML = arg.activity;
});

// We got a reply from main if we are running or not
// and update the interface accordingly
ipcRenderer.on("running-reply", (event, arg) => {
  if (arg.running === true) {
    document.getElementById("ss").innerHTML = "Pause";
    document.getElementById("spbutton").classList.remove("btn-primary");
    document.getElementById("spbutton").classList.add("btn-danger");
  } else {
    document.getElementById("ss").innerHTML = "Start";
    document.getElementById("spbutton").classList.remove("btn-danger");
    document.getElementById("spbutton").classList.add("btn-primary");
  }
});

// We got a response from start/pause command
ipcRenderer.on("sp-reply", (event, arg) => {
  if (arg.success === true) {
    //
  }
});

// we got a response from reset command
ipcRenderer.on("reset-reply", (event, arg) => {
  if (arg.success === true) {
    //
  }
});
