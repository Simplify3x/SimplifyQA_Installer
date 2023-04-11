const { app, Menu, Tray, ipcMain,dialog} = require('electron');
const { browsersocket } = require("./scripts/BrowserActionSocket.js")
const fs = require('fs');
const https = require('http');
var kill = require('tree-kill');
const path = require('path');
const { shell } = require('electron')
let startFlag = false;
let tray = null
var javaProcess;
const { spawn } = require("child_process", 'spawn');
// const rootPath = require('electron-root-path').rootPath;
const rootPath = "/Applications/SQA-Agent.app";
const os = require('os');
const macJavaPath="/Applications/SQA-Agent.app/Contents/Resources/JRE_1.8/Contents/Home/bin/java"
const gotTheLock = app.requestSingleInstanceLock()
console.log(process.execPath)

const URL="https://simplifyqa.app"
// const URL="https://demo.simplifyqa.app"


//for creating config file
if (!fs.existsSync(path.join(os.homedir()+ "/.config.properties"))) {
fs.writeFile(path.join(os.homedir() + '/.config.properties'), 'url='+URL, function (err) {
  if (err) throw err;
  console.log('File is created successfully.');
});
}

app.setAsDefaultProtocolClient("sqa","/Applications/SQA-Agent.app//Contents/MacOS/SQA-Agent");

const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
log.transports.file.level = 'info';
log.transports.file.resolvePathFn = () => path.join(rootPath, '/update.log');


const cacheDir = app.getPath('userData') + '/Caches/SQA-Agent';
if (fs.existsSync(cacheDir)) {
  // Delete the cache directory
  try {
    fs.rmdirSync(cacheDir, { recursive: true });
    console.log(`Cache directory ${cacheDir} deleted`);
  } catch (err) {
    console.error(`Error deleting cache directory: ${err}`);
  }
}

autoUpdater.setFeedURL('https://s3.ap-south-1.amazonaws.com/agent.simplifyqa.app/mac');


autoUpdater.on('update-downloaded', function(event, releaseNotes, releaseName) {
 // Show a dialog box asking the user if they want to install the update
 dialog.showMessageBox({
 type: 'question',
 buttons: ['Install and Relaunch', 'Later'],
 defaultId: 0,
 message: `A new version of ${app.getName()} has been downloaded.`,
 detail: `It will be installed the next time you restart the application.`
}, function(response) {
 if (response === 0) {
 // Quit and install the update
 autoUpdater.quitAndInstall();
 }
 });
});

autoUpdater.on('error', function(error) {
  log.info(error);

});

// Listen for update checking event
autoUpdater.on('checking-for-update', function() {
  log.info('Checking for update...');
  // dialog.showErrorBox('UPDATE AVAILABLE: ');
});

// Listen for update available event
autoUpdater.on('update-available', function() {
  log.info('update found');

  // dialog.showErrorBox('UPDATE AVAILABLE 2: ');
});


// Listen for update not available event
autoUpdater.on('update-not-available', function() {
  log.info('Update not found');

  // dialog.showErrorBox('UPDATE NOT AVAILABLE: ');
});

// Listen for download progress event
autoUpdater.on('download-progress', function(progressObj) {
  log.info('download in  progress');
  // dialog.showErrorBox('UPDATE IN PROGRESS: ');
 let log_message = "Download speed: " + progressObj.bytesPerSecond + ' - Downloaded ' + progressObj.percent + '%';
// logdata("download in progress");
});

// Listen for update downloaded event
autoUpdater.on('update-downloaded', function(event, releaseNotes, releaseName) {
  log.info('update downloaded');
  // dialog.showErrorBox('UPDATE DOWNLOADED ');
});


function startAgent() {
  return new Promise((resolve, reject) => {
    try {
      var location = null;
      if (process.platform == 'darwin') {
        logdata("started");
        location = path.join(rootPath, '/Contents/Resources/com.simplifyQA.Agent.jar');
        javaProcess = spawn(macJavaPath, ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml', '-jar', location]);

      }
      else if (process.platform == 'win32') {
        location = path.join(rootPath, '/Resources/com.simplifyQA.Agent.jar');
        javaProcess = spawn('java', ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml','-jar', path.win32.normalize(currentPath.split("app.asar")[0] +'\\'+ 'resources\\'+'com.simplifyQA.Agent.jar')]);

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
  const location = path.join(rootPath, 'SqaAgent.log');
  // Create appDataDir if not exist
  if (!fs.existsSync(rootPath)) {
    fs.mkdirSync(rootPath);
  }

  const appDataFilePath = path.join(rootPath, 'SqaAgent.log');
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


function getAppDataPath() {
  switch (process.platform) {
    case "darwin": {
      return path.join(process.env.HOME);
    }
    case "win32": {
      return path.join(process.env.APPDATA, "Your app name");
    }
    case "linux": {
      return path.join(process.env.HOME, ".Your app name");
    }
    default: {
      console.log("Unsupported platform!");
      process.exit(1);
    }
  }
}


function Process() {
  const process = require('child_process');
  var ls = process.spawn('script.bat');
  ls.stdout.on('data', function (data) {
    console.log(data);
  });
  ls.stderr.on('data', function (data) {
    console.log(data);
  });
  ls.on('close', function (code) {
    if (code == 0)
      console.log('Stop');
    else
      console.log('Start');
  });
};
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

  autoUpdater.checkForUpdatesAndNotify();
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
  // tray = new Tray(__dirname + '\\resources\\'+'simplify logo.png')
  // logdata("tray : "+ rootPath + "/Contents/Resources/libs/images/loader_1.png")
  // tray = new Tray(path.join(rootPath, 'loader_2.png'))
  if (process.platform == 'darwin') {
  tray = new Tray(path.join(rootPath, '/Contents/Resources/libs/images/loader_2.png'))
  }else if(process.platform=='win32'){
    tray = new Tray(path.join(rootPath, '/Resources/libs/images/loader_2.png'))
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
  // browsersocket.startserver();
  try {
    tray.displayBalloon();
  }
  catch { }
}
);