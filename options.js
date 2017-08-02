// Saves options to chrome.storage
function save_options() {
  var saveInServer = document.getElementById('saveInServer').checked;
  chrome.storage.sync.set({
    saveInServer: saveInServer
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value saveInServer = false.
  chrome.storage.sync.get({
    saveInServer: false 
  }, function(items) {
    document.getElementById('saveInServer').checked = items.saveInServer;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',save_options);
