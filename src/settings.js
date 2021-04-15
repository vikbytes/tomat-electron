// When our setting window loads catch the values from main
window.addEventListener("load", function () {
  ipcRenderer.send("load", "");
});

// When we update the settings, run this
function update() {
  // Send the updated values to main so it can update the variables
  ipcRenderer.send("update", {
    breakTimer: document.getElementById("breaklength").value,
    sessionTimer: document.getElementById("sessionlength").value,
    longBreakTimer: document.getElementById("longbreaklength").value,
  });
  // Update the settings interface
  document.getElementById("update").innerHTML = "Updated!";
  document.getElementById("update").classList.remove("btn-danger");
  document.getElementById("update").classList.add("btn-success");

  // Some pretty button flashing
  setTimeout(() => {
    document.getElementById("update").innerHTML = "Update";
    document.getElementById("update").classList.remove("btn-success");
    document.getElementById("update").classList.add("btn-danger");
  }, 1500);
}
