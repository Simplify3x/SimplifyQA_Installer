const path = require('path');
const {logdata}=require("./logging.js");
const { spawn } = require("child_process", 'spawn');


var javaProcess;

async function startAgent(rootPath) {
    return new Promise((resolve, reject) => {
      try {
        var location = null;
        if (process.platform == 'darwin') {
          logdata("started",rootPath);
          location = path.join(rootPath, '/Contents/Resources/com.simplifyQA.Agent.jar');
          javaProcess = spawn('java', ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml', '-jar', location,rootPath]);
          global.sharedThing.process=javaProcess.pid;

  
        }
        else if (process.platform == 'win32') {
          const windowsPath = path.join(rootPath, 'jre_1.8/bin/java');
          location = path.join(rootPath, 'com.simplifyQA.Agent.jar');
          // javaProcess = spawn('java', ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml','-jar', path.win32.normalize(currentPath.split("app.asar")[0] +'\\'+ 'resources\\'+'com.simplifyQA.Agent.jar')]);
          javaProcess = spawn(windowsPath, ['-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:5009', '-Dlogback.configurationFile=./libs/logback.xml', '-jar', location,rootPath]);
          global.sharedThing.process=javaProcess.pid;

  
        }
  
  
  
        console.log(javaProcess.stdout);
        javaProcess.stdout.on('data', (data) => {
          logdata(data.toString(),rootPath);
  
          if (data.toString().includes("org.eclipse.jetty.server.Server - Started"))
            resolve(javaProcess.pid);
        })

      }
      catch (err) {
        logdata(err,rootPath);
        reject();
      }
    });


  }

  module.exports = {startAgent}; 
