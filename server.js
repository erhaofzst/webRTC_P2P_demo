/*
message通道内，加上from信息，广播时不广播from来的那个socketid
*/

const http = require("http");
const https = require("https");
const fs = require("fs");
const express = require("express");
const SocketIOServer = require("socket.io");
// const { Socket } = require("dgram");
const port = 7777;

// express可正常作为http服务器
let app = express();
let socketID = [];
// app.get('/client', (req, res) => {
//     // res.send("dsad");
//     res.sendFile(__dirname+'/client.html')
// })

// let server = http.createServer(app)

let server = https.createServer(
  {
    key: fs.readFileSync("./ssl/server.key"),
    cert: fs.readFileSync("./ssl/server.crt"),
  },
  app
);

// 解决跨域问题
let io = new SocketIOServer.Server(server, {
  cors: {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },
});

io.on("connection", (socket) => {
  // console.log("有人连进来了");

  socketID.push(socket.id);
  console.log(socketID);

  socket.on("disconnect", () => { // 监听名为“disconnect”，事件，就是离开页面，断开socket连接
    console.log(socket.id, "user disconnected");
    socketID.splice(socketID.indexOf(socket.id), 1);
    // console.log(socketID);
  });

  // 发送 该socket.id给客户端，单向发送，不广播
  socket.emit("get-socketid", {
    type: "socketID",
    socketid: socket.id,
  });

  // 交换信令信息
  socket.on("message", (message) => {
    // console.log(message.type);
    switch (message.type) {
      case "offer":
        // console.log("offer event");
        //向出自己外所有连接广播信息
        socket.broadcast.emit("message", message);

        // socketID.forEach(item => {
        //   if (item != message.from) {
        //     socket.to(item).emit("message", message);
        //   }
        // })
        // socket.broadcast.emit("message", message);
        break;
      case "answer":
        // console.log("answer event");
        socket.broadcast.emit("message", message);

        // socketID.forEach(item => {
        //   if (item != message.from) {
        //     console.log("item:", item);
        //     console.log("message from:", message.from)
        //     socket.to(item).emit("message", message);
        //   }
        // })
        // socket.broadcast.emit("message", {
        //   type: "answer",
        //   answer: message.answer,
        // });
        break;
      case "candidate":
        // console.log("candidate event");
        // socketID.forEach(item => {
        //   if (item != message.from) {
        //     console.log("item:", item);
        //     console.log("message from:", message.from)
        //     socket.to(item).emit("message", message);
        //   }
        // })
        socket.broadcast.emit("message", message);
        // socket.broadcast.emit("message", {
        //   type: "candidate",
        //   candidate: message.candidate,
        // });
        break;
    }
  });
});

server.listen(port, () => {
  console.log("正在监听 127.0.0.1:7777 端口，作为 websocket 应用");
});
