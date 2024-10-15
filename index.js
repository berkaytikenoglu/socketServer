const Express = require('express');
const App = Express();
const Server = require('http').createServer(App);
const IO = require('socket.io')(Server, {
  pingInterval: 1000,
  pingTimeout: 10000,
  cors: { origin: '*' },
});
const { AppConstants } = require('./constants/app');
const { SocketEvents } = require('./constants/socket_events');
IO.on('connection', (socket) => {
  console.log(`Bir kullanıcı sockete bağlandı socket ID: '${socket.id}'`);



  socket.on(SocketEvents.register, ({ name, clientId }) => {
   

    if (name && clientId) {
      socket.name = name;
      socket.clientId = clientId;
      console.log(`Kullanıcı kaydedildi: ${name} (ID: ${clientId})`);
    } else {
      console.log('Kullanıcı adı veya Client ID eksik.');
    }
  });
 

  socket.on(SocketEvents.streamData, async (data, callback) => {
    IO.sockets.sockets.forEach((connectedSocket) => {
      if (connectedSocket?.name === data.to) {
        connectedSocket.emit(SocketEvents.streamData, data.bytes);
        callback();
      }
    });
  });

  socket.on(SocketEvents.callUser, (name) => {
    IO.sockets.sockets.forEach((connectedSocket) => {
      if (connectedSocket?.name === name) {
        connectedSocket.emit(SocketEvents.incomingCall, socket.name);
      }
    });
  });


  socket.on(SocketEvents.closeCall, (name) => {
    IO.sockets.sockets.forEach((connectedSocket) => {
      if (connectedSocket?.name === name) {
        connectedSocket.emit(SocketEvents.callClosed);
      }
    });
  });

  socket.on(SocketEvents.acceptCall, (name) => {
    IO.sockets.sockets.forEach((connectedSocket) => {
      if (connectedSocket?.name === name) {
        connectedSocket.emit(SocketEvents.callAccepted, socket.name);
      }
    });
  });

  socket.on('USER_LIST', (callback) => {
    const users = [];
    IO.sockets.sockets.forEach((connectedSocket) => {
      if (connectedSocket?.name) {
        users.push({
          id: connectedSocket.id,
          name: connectedSocket.name,
          clientId: connectedSocket.clientId,
        });
      }
    });
    
    // Kullanıcı listesi geri döndürülüyor
    // callback(JSON.stringify(users));

    IO.emit('USER_LIST', JSON.stringify(users));
    console.log(`User List Message is ${JSON.stringify(users)}`);
  });

  socket.on('chat', (message) => {
    console.log(`Mesajlaşma | Socket ID: '${socket.id}' socket.name '${socket.name}' Mesaj : ${message}`);
    IO.emit('chat', message);
  });

  socket.on('disconnect', (message) => {
    console.log(`Bir kullanıcı socketten ayrıldı. SOCKET ID :'${socket.id}'. Mesaj: ${message}`);
  });

  
});

Server.listen(AppConstants.serverPort, () => {
  console.log(`Sunucu Başladı ${AppConstants.serverPort} port.`);
});
