const { app, Menu, Tray, ipcMain } = require('electron');
const { browsersocket } = require("./scripts/BrowserActionSocket.js")
const fs = require('fs');
const fs1 = require('fs-extra');
const https = require('http');
var kill = require('tree-kill');
const path = require('path');
const { shell } = require('electron')
let startFlag = false;
let tray = null
var javaProcess;
const { spawn } = require("child_process", 'spawn');
const rootPath = require('electron-root-path').rootPath;

function startAgent() {
  return new Promise((resolve, reject) => {
    try {
      var location = null;
      if (process.platform == 'darwin') {
        logdata("started");
        location = path.join(rootPath, '/Contents/Resources/com.simplifyQA.Agent.jar');
        javaProcess = spawn('java', ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml', '-jar', location]);

      }
      else if (process.platform == 'win32') {
        location = path.join(rootPath, '/resources/com.simplifyQA.Agent.jar');
        // javaProcess = spawn('java', ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml','-jar', path.win32.normalize(currentPath.split("app.asar")[0] +'\\'+ 'resources\\'+'com.simplifyQA.Agent.jar')]);
        javaProcess = spawn('java', ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml','-jar', 'com.simplifyQA.Agent.jar']);

      }


      // const location = path.join(rootPath, 'com.simplifyQA.Agent.jar');
      // logdata(location);
      // var currentPath = __dirname.toString();

      // javaProcess = spawn('java', ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml','-jar', path.win32.normalize(currentPath.split("app.asar")[0] +'\\'+ 'resources\\'+'com.simplifyQA.Agent.jar')]);
      // javaProcess = spawn('java', ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml', '-jar', location]);
      // javaProcess = spawn('java', ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml','-jar','com.simplifyQA.Agent.jar']);

      console.log(javaProcess.stdout);
      javaProcess.stdout.on('data', (data) => {
        logdata(data.toString());

        if (data.toString().includes("org.eclipse.jetty.server.Server - Started"))
          resolve(javaProcess.pid);
      })
    }
    catch (err) {
      logdata(err);
      reject();
    }
  });
}

function logdata(content) {
  const location = path.join(rootPath, 'SqaAgent2.log');
  // Create appDataDir if not exist
  if (!fs.existsSync(rootPath)) {
    fs.mkdirSync(rootPath);
  }

  const appDataFilePath = path.join(rootPath, 'SqaAgent2.log');
  content = JSON.stringify(content);

  fs.appendFile(appDataFilePath, "\n" + content, (err) => {
    if (err) {
      console.log("There was a problem saving data!");
      // console.log(err);
    } else {
      console.log("Data saved correctly!");
    }
  });
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


app.whenReady().then(async () => {
  let pid = await startAgent();
  logdata("await added");
  setTimeout(() => {
    startNotification();
  }, 5000);
  /*
    setInterval(() => {
      startNotification();
    }, 500);
    */

    global.sharedThing = {
      process: javaProcess.pid,
      app: app,
    };
  
  // logdata("tray : "+ rootPath + "/Contents/Resources/libs/images/loader_1.png")
  // tray = new Tray(path.join(rootPath, 'resources/libs/images/loader_2.png'))
  if (process.platform == 'darwin') {
  tray = new Tray(path.join(rootPath, '/Contents/Resources/libs/images/loader_2.png'))
  }else if(process.platform=='win32'){
    logdata(path.join(rootPath, '/resources/libs/images/simplifylogo.ico'));
    // tray = new Tray(path.join(rootPath, '/resources/libs/images/qa.png'))
    tray = new Tray(__dirname + '\\resources\\'+'qa.png');
    logdata("Tray :" + tray)
  }

  const contextMenu = Menu.buildFromTemplate([
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
          startAgent();
          global.sharedThing.process=javaProcess.pid;
        }, 1000);
        setTimeout(() => {
          console.log("---------------start RESTART notification for tray--------------------")
          https.get("http://localhost:4012/restartnotification");
        }, 10000);
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
    },
  ])
  tray.setToolTip('Simplify3x')
  tray.setContextMenu(contextMenu)
  tray.focus();
  startFlag = true;

  try {
    tray.displayBalloon();
  }
  catch { }
}
);

