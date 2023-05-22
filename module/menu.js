const {Menu} = require('electron');
const path = require('path');
const https = require('http');
const {newConfigWindow,closeWindow}=require("./env_window.js");
var kill = require('tree-kill');
const {startAgent}=require("./agentStart.js");


function contextMenu(app,path){
const context_menu=Menu.buildFromTemplate([
    {
      label: 'Version : 3.0.0', type: 'normal', click: () => {
      }
    }, {
      label: 'Release Notes', type: 'normal', click: () => {
        shell.openExternal('https://simplifyqa.app');
      }
    },
    {
      label: 'Restart', type: 'normal', click: () => {
        kill(global.sharedThing.process)
        setTimeout(() => {
          startAgent(path);
        }, 1000);
        setTimeout(() => {
          console.log("---------------start RESTART notification for tray--------------------")
          https.get("http://localhost:4012/restartnotification");
        }, 12000);
      }
    },
    {
      label: 'Quit', type: 'normal', click: () => {
        console.log("---------------start STOP notification for tray--------------------")
        https.get("http://localhost:4012/stopnotification");
        // setTimeout(() => {
        //   process.kill(pid);
        // }, 3000);
        app.isQuiting = true;
        process.kill(global.sharedThing.process);
        app.quit();
      }
    }, , {

      label: 'Change Environment', type: 'normal', click: () => {
        newConfigWindow(app);
      }

    }
  ])

  return context_menu;
}

module.exports = {contextMenu}; 