const express = require('express');
const {main} = require('../main2.js');
const socketIO = require('socket.io');
const http = require('http')
const port = process.env.PORT || 5013
var app = express();
let server = http.createServer(app);
let io = socketIO(server);
var value = true

// make connection with user from server side

io.on('connection', (socket) => {
  console.log('New user connected');
  //emit message from server to user
  socket.emit('newMessage', {
    from: 'jen@mds',
    text: 'hepppp',
    createdAt: 123
  });

  // listen for message from user
  socket.on('createMessage', (newMessage) => {
    console.log('newMessage', newMessage);
  });

  // when server disconnects from user
  socket.on('disconnect', () => {
    value = false;
    console.log('disconnected from user');
  });
  socket.on('message', (event) => {
    if (event == 'restart') {

    }
    else if (event == 'exit') {
        main.app.isQuiting = true;
        process.kill(main.javaProcess.pid);
        main.app.quit();
    }
  });
});

server.listen(port);
