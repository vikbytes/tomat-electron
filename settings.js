window.addEventListener('load',
  function() {
      ipcRenderer.send('load', '')
});

// When we update the settings, run this
function update() {
  console.log('update')
  ipcRenderer.send('update', {
    breakTimer: document.getElementById('breaklength').value,
    sessionTimer: document.getElementById('sessionlength').value,
    longBreakTimer: document.getElementById('longbreaklength').value,
    startHour: document.getElementById('starthour').value,
    endHour: document.getElementById('endhour').value
  })

  document.getElementById('update').innerHTML = "Updated!";
  document.getElementById('update').classList.remove('btn-danger')
  document.getElementById('update').classList.add('btn-success')

  setTimeout(() => {
    document.getElementById('update').innerHTML = "Update";
    document.getElementById('update').classList.remove('btn-success')
    document.getElementById('update').classList.add('btn-danger')
  }, 1500);
}