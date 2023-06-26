//dependency files
const { checkConfigFile, VerifyConfigFilePresent, readExecutionUrl } = require("./module/config.js");
const { newConfigWindow, closeWindow, disconnectConnectJenkins } = require("./module/env_window.js");
const { contextMenu } = require("./module/menu.js");
const { logdata, setRootPath, resetFile } = require("./module/logging.js");
const { agentupdate } = require("./module/autoUpdate.js");
const { browsersocket } = require("./scripts/BrowserActionSocket.js");
const { startAgent,killProcess } = require("./module/agentStart.js");
const { DataCopy, GetUpdatedData } = require("./module/backup.js");

const { app, Menu, Tray, ipcMain, protocol, dialog, BrowserWindow, MenuItem } = require('electron');
const fs = require('fs');

const https = require('http');
var kill = require('tree-kill');
const path = require('path');

let startFlag = false;
let tray = null;
var javaProcess;
const { spawn } = require("child_process", 'spawn');
// const rootPath = require('electron-root-path').rootPath;
const rootPath = path.join(app.getAppPath(), '..', '..');
const windowsPath = path.join(rootPath, 'jre_1.8/bin/java');
const gotTheLock = app.requestSingleInstanceLock();
const applicationPath = path.join(app.getAppPath(), '..', '..');

setRootPath(rootPath);
resetFile();


console.log(path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent'));
logdata("rootpath : " + rootPath);

//hiding the popup box
ipcMain.handle('cancel', async (event, ...args) => {
  closeWindow();
});

//saving the file
ipcMain.handle('save', async (event, ...args) => {

  // check for VALID url
  if (args[0].startsWith("http://") || args[0].startsWith("https://")) {
    console.log(args[0]);
    checkConfigFile(args);
    closeWindow();
  }

  // if not show error message
  else {
    closeWindow();
    dialog.showErrorBox('Error ', 'Enter A valid URL');


  }

})

logdata("application started", rootPath);
const { autoUpdater } = require('electron-updater');
autoUpdater.autoDownload = false;

app.removeAsDefaultProtocolClient('sqa');

app.setAsDefaultProtocolClient('sqa', path.join(applicationPath, 'SQA-Agent.exe'));

logdata("protocol added started", rootPath);

//agent update check
agentupdate(app);

function restartApp() {
  app.relaunch();
  app.quit();
}



function startNotification() {
  try {
    console.log("---------------START notification for tray--------------------")
    var a = https.get("http://localhost:4012/startnotification");
  }
  catch (err) {
    var b = err;
  }
}

app.on('open-url', (event, url) => {
  console.log("started");
});



if (!gotTheLock) {
  logdata("app is quiting", rootPath);

  app.quit();
}
else {
  app.whenReady().then(async () => {
    logdata("app is checking for updates", rootPath);
    global.sharedThing = {
      process: null,
      app: app,
      menu: null
    };
    logdata("app has checked for updates", rootPath);
    let pid = await startAgent(rootPath);
    logdata("app is started", rootPath);
    logdata("await added", rootPath);


    setTimeout(() => {
      startNotification();
    }, 5000);



    // logdata("tray : "+ rootPath + "/Contents/Resources/libs/images/loader_1.png")
    // tray = new Tray(path.join(rootPath, 'resources/libs/images/loader_2.png'))
    if (process.platform == 'darwin') {
      tray = new Tray(path.join(rootPath, '/Contents/Resources/libs/images/loader_2.png'))
    } else if (process.platform == 'win32') {
      logdata(path.join(rootPath, '/resources/libs/images/simplifylogo.ico'), rootPath);
      // tray = new Tray(path.join(rootPath, '/resources/libs/images/qa.png'))
      tray = new Tray(__dirname + '\\resources\\' + 'qa.png');
      logdata("Tray :" + tray, rootPath)
    }



    console.log("ROOT PATH :" + rootPath)
    tray.setToolTip('Simplify3x')
    tray.setContextMenu(contextMenu(app, rootPath))
    tray.focus();
    startFlag = true;
    autoUpdater.checkForUpdatesAndNotify();

    // logdata("Before readExecutionUrl");
    // readExecutionUrl(app);
    // logdata("After readExecutionUrl");
    GetUpdatedData(app);
    logdata("GetUpdatedData method done");
    disconnectConnectJenkins();
    // killProcess();

    try {
      tray.displayBalloon();
    }
    catch { }
  }
  );
}

