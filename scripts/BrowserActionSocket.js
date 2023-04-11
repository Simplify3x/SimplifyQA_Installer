const express = require('express');
const { main } = require('../main2.js');
const socketIO = require('socket.io');
const http = require('http')
const port = process.env.PORT || 5013
var app = express();
let server = http.createServer(app);
app.use(express.json());
let io = socketIO(server);
var value = true
var javaProcess;
var app;
const https = require('http');
const path = require('path');
const rootPath = require('electron-root-path').rootPath;
const fs = require('fs');
const { spawn } = require("child_process", 'spawn');
const macJavaPath="/Applications/SQA Agent.app/Contents/Resources/JRE_1.8/Contents/Home/bin/java"

function startAgent() {
  return new Promise((resolve, reject) => {
    try {
      var location = null;
      if (process.platform == 'darwin') {
        location = path.join(rootPath, '/Contents/Resources/com.simplifyQA.Agent.jar');
        javaProcess = spawn(macJavaPath, ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml', '-jar', location]);

      }
      else if (process.platform == 'win32') {
        location = path.join(rootPath, 'Resources/com.simplifyQA.Agent.jar');
        javaProcess = spawn('java', ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml','-jar', path.win32.normalize(currentPath.split("app.asar")[0] +'\\'+ 'resources\\'+'com.simplifyQA.Agent.jar')]);

      }
      // const location = path.join(rootPath, 'com.simplifyQA.Agent.jar');
      // logdata(location);
      // var currentPath = __dirname.toString();

       // javaProcess = spawn('java', ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml','-jar', path.win32.normalize(currentPath.split("app.asar")[0] +'\\'+ 'resources\\'+'com.simplifyQA.Agent.jar')]);
       // javaProcess = spawn('java', ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml', '-jar', location]);
      // javaProcess = spawn('java', ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml', '-jar', 'com.simplifyQA.Agent.jar']);

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

// server.listen(process.env.PORT || 5013, () => {
//   console.log(`Server started on port ${server.address().port} :)`);
// });

// server.listen(port);
app.listen(port, function (err) {
  if (err) {
    console.log("Error while starting server");
  }
  else {
    console.log("Server has been started at " + port);
  }
});

app.post('/browserapi', function (req, res) {
  if (req.body.data == "restart") {
    process.kill(global.sharedThing.process)
    setTimeout(() => {
      startAgent();
      global.sharedThing.process=javaProcess.pid;
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
