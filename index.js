const { ipcRenderer } = require('electron');
const CHANNEL_NAME = 'cancel';

// const cancelButton = document.getElementById('cancel');
// cancelButton.addaddEventListener('click', () => {
//     console.log("event triggered");
//     const reply = ipc.sendSync('sync-message-incoming', 'Sync hi from renderer process');
//     console.log(reply);
// });


function cancelButton() {
    ipcRenderer.invoke('cancel', "hello").then((result) => {
        // ...
    });
}


function saveUrl() {

    var a = document.getElementById("serverurl");
    if (a.value != '') {
        ipcRenderer.invoke('save', a.value).then((result) => {
        });
    }
}

module.exports = { saveUrl } 
