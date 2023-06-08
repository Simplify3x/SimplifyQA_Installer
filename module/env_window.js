var window;
const { BrowserWindow } = require('electron');
const path = require('path');
var request = require('request');


function newConfigWindow(app) {
  console.log("NEW CONFIG WINDOW : " + app.getAppPath());
  const rootPath = path.join(app.getAppPath(), '..', '..');

  var htmlPath = path.join(rootPath, "resources", "index.html");

  window = new BrowserWindow({
    width: 410,
    height: 180,
    resizable: true,
    frame: false,
    modal: true,
    focusable: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false

    },
  });
  window.loadFile(htmlPath);

}

function closeWindow() {
  window.hide();
}

function disconnectConnectJenkins() {
var myJSONObject = { "type": "connnectdisconnect" };
request({
    url: "http://localhost:4012/v1/registerjenkin",
    method: "POST",
    json: true,
    body: myJSONObject
}, function (error, response, body){
    console.log(response);
});

}

module.exports = { newConfigWindow, closeWindow,disconnectConnectJenkins } 
