const { Menu, MenuItem ,BrowserWindow,Notification} = require('electron');
const path = require('path');
const https = require('http');
const { newConfigWindow, closeWindow } = require("./env_window.js");
var kill = require('tree-kill');
const { startAgent, killProcess } = require("./agentStart.js");
// const { logdata, setRootPath, resetFile } = require("./logging.js");
const fs = require('fs');
const http = require('https');
const axios = require('axios');
const ProgressBar = require('progress');
const { exec } = require('child_process');
const log =require('logger');
const {getPatchVersion,getCurrentVersion}=require("./updateProcess.js")

const { spawn } = require("child_process", 'spawn');
const fileUrl = 'https://s3.ap-south-1.amazonaws.com/agent.simplifyqa.app/prod/windows/3.0.10/patch.txt';
const savePath = path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent', 'patch.txt');
const downloadPath=path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent');

const updateURL = "https://s3.ap-south-1.amazonaws.com/agent.simplifyqa.app/prod/windows";
const LocalPath = path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent');

var sizeOfUpdate=0;

module.exports={
  sizeOfUpdate:sizeOfUpdate
};

function contextMenu(app, path, BrowserWindow,logger,sqaAgent,version) {
  const context_menu = Menu.buildFromTemplate([
    {
      label: 'Version : '+version, type: 'normal', click: () => {
      }
    }, {
      label: 'Release Notes', type: 'normal', click: () => {
        shell.openExternal('https://simplifyqa.app');
      }
    },
    {
      label: 'Restart', type: 'normal', click: () => {
        kill(global.sharedThing.process);
      //  resetFile();
        killProcess();
        setTimeout(() => {
          startAgent(path,sqaAgent);
        }, 1000);
        setTimeout(() => {
          console.log("---------------start RESTART notification for tray--------------------")
          https.get("http://localhost:4012/restartnotification");
        }, 12000);
      }
    },
    {
      label: 'Quit', type: 'normal', click: () => {
        killProcess(sqaAgent);
        console.log("---------------start STOP notification for tray--------------------")
        https.get("http://localhost:4012/stopnotification");
        app.isQuiting = true;
        process.kill(global.sharedThing.process);
        app.quit();
      }
    }, {

      label: 'Change Environment', type: 'normal', click: () => {
        newConfigWindow(app);
      }
    }
    // ,{
    //   label: 'Update', type: 'normal', click: () => {
    //     getPatchVersion('3.0.10',BrowserWindow,app,logger,Notification);
    //   }
    // }
    
  ]);


  global.sharedThing.menu = context_menu;
  return context_menu;
}


module.exports = { contextMenu }; 