let clock;

window.addEventListener('load',
  function() {
    updateTimer()
    startClock();
});

// Used for the frontend to keep updating from the backend
function startClock() {
  clock = setInterval(updateTimer, 1000)
}

function reset() {
  // reset button
}

function sp() {
  // start/pause button
}

// Updates the timer variable every second and sends it to the renderer
function updateTimer() {
  ipcRenderer.send('timer')
  ipcRenderer.send('activity')
  ipcRenderer.send('running')
}
