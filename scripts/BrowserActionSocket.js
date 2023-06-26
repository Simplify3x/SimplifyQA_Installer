const express = require('express');
const { main } = require('../main.js');
const socketIO = require('socket.io');
const http = require('http')
const port = process.env.PORT || 5013
var app;
let server;
let io = socketIO(server);
var value = true
var javaProcess;
var app;
const https = require('http');
const path = require('path');
var rootPath = require('electron-root-path').rootPath;
// const rootPath= path.join(app.getAppPath(), '..','..');

const fs = require('fs');
const { spawn } = require("child_process", 'spawn');
const windowsPath = "./jre_1.8/bin/java"
const { dialog } = require('electron')

var tcpPortUsed = require('tcp-port-used');
const { ipcRenderer } = require('electron');
tcpPortUsed.check(5013, 'localhost')
  .then(function (inUse) {
    if (inUse) {
      console.log('Port 5013 is being used');
    } else {
      server = http.createServer(app);
      app = express();
      app.use(express.json());

      try {

        app.listen(port, function (err) {
          if (err) {
            console.log("Error while starting server");
          }
          else {
            console.log("Server has been started at " + port);
          }
        });
      } catch (err) {
        console.log(err);
      }

      app.post('/browserapi', function (req, res) {
        if (req.body.data == "restart") {
          process.kill(global.sharedThing.process)
          setTimeout(() => {
            startAgent();
            global.sharedThing.process = javaProcess.pid;
          }, 1000);
          setTimeout(() => {
            console.log("---------------start RESTART notification for tray--------------------")
            https.get("http://localhost:4012/restartnotification");
          }, 10000);
        } else if (req.body.data == "exit") {
          console.log(global.sharedThing.process);
          console.log(global.sharedThing.app);
          process.kill(global.sharedThing.process);
          global.sharedThing.app.quit();
          global.sharedThing.app.isQuiting = true;
        }
      });

      app.get('/restartapp', function (req, res) {
        https.get("http://localhost:4012/restartnotification");
      });

    }



  }, function (err) {
    server = http.createServer(app);
    app == express();
    app.use(express.json());

    try {

      app.listen(port, function (err) {
        if (err) {
          console.log("Error while starting server");
        }
        else {
          console.log("Server has been started at " + port);
        }
      });
    } catch (err) {
      console.log(err);
    }

    app.post('/browserapi', function (req, res) {
      if (req.body.data == "restart") {
        process.kill(global.sharedThing.process);
        killProcess();
        setTimeout(() => {
          startAgent();
          global.sharedThing.process = javaProcess.pid;
        }, 1000);
        setTimeout(() => {
          console.log("---------------start RESTART notification for tray--------------------")
          https.get("http://localhost:4012/restartnotification");
        }, 10000);
      } else if (req.body.data == "exit") {
        console.log(global.sharedThing.process);
        console.log(global.sharedThing.app);
        process.kill(global.sharedThing.process);
        global.sharedThing.app.quit();
        killProcess();
        global.sharedThing.app.isQuiting = true;
      }
    });

    app.get('/restartapp', function (req, res) {
      https.get("http://localhost:4012/restartnotification");
    });



  });
function startAgent() {
  return new Promise((resolve, reject) => {
    try {
      var location = null;
      if (process.platform == 'darwin') {
        location = path.join(rootPath, '/Contents/Resources/com.simplifyQA.Agent.jar');
        javaProcess = spawn('java', ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml', '-jar', location,rootPath]);

      }
      else if (process.platform == 'win32') {
        rootPath = path.join(global.sharedThing.app.getAppPath(), '..', '..');
        var root = path.join(global.sharedThing.app.getAppPath(), '..', '..');
        location = path.join(root, 'com.simplifyQA.Agent.jar');
        var javapath = path.join(root, 'jre_1.8/bin/java')
        javaProcess = spawn(javapath, ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml', '-jar', location,rootPath]);

      }

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
  // fs.rm(location)
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

async function killProcess(rootPath) {
  return new Promise((resolve, reject) => {
    try {
      const chromedriver = spawn("Taskkill" ,["/IM", "chromedriver.exe", "/F"]);
      const adb = spawn("Taskkill" ,["/IM", "adb.exe", "/F"]);
    const runner = spawn("Taskkill" ,["/IM", "runner.exe", "/F"]);

      console.log(javaProcess.stdout);
      javaProcess.stdout.on('data', (data) => {
        logdata(data.toString(), rootPath);

        if (data.toString().includes("org.eclipse.jetty.server.Server - Started"))
          resolve(javaProcess.pid);
      })

    }
    catch (err) {
      logdata(err, rootPath);
      reject();
    }
  });


}

// server.listen(process.env.PORT || 5013, () => {
//   console.log(`Server started on port ${server.address().port} :)`);
// });

// server.listen(port);

