"use strict";
// client 实现完全对等的两个客户端
/*
- 功能：
    - 能接收信令从信令服务器
    SDP-offer/ICE-
    - 能通过信令服务器发送信令
    SDP-answer/ICE-
    
    - 与另一个客户端对等连接
    - 与另一个客户端推拉流,video标签处理
*/
const hangupButton = document.getElementById("hangup-button");

const remoteVideo = document.getElementById("remoteVideo");
const localVideo = document.getElementById("localVideo");

// 信令服务器
const signalServerIp = "127.0.0.1";
const signalServerPort = 7777;
let signalUrl = `wss://${signalServerIp}:${signalServerPort}`;
let local_answer;
let local_candidate;
let peerConnection;
let socketid;
let localStream;

// 在socket.io在html中被引了
let socket = io(signalUrl); // 已经连上socket.io，后端的io.on("connection")
// console.log(socket);

// client端连接上server端的事件
socket.on("connect", () => {
  console.log("client connect");
});

socket.on("get-socketid", (data) => {
  console.log("get-socketid:", data);
  if (data.type === "socketID") {
    socketid = data.socketid;
  }
});


async function handleVideoOfferMsg(socket) {
  // const configuration = {
  //   iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  // };
  // peerConnection = new RTCPeerConnection(configuration);
  peerConnection = new RTCPeerConnection();
  //   console.log("eee")







///// 获取本地流
let constraints = {
  audio: false,
  video: {
    width: 1000,
    height: 600,
  },
};

localStream = await navigator.mediaDevices.getUserMedia(constraints);
localVideo.srcObject = localStream;

console.log("客户端本地流:",localStream);

localStream.getTracks().forEach((track) => {
  // recordEvent(`将本地track加入peer连接中 [${track.kind}]`)
  console.log("本地track", track);
  peerConnection.addTrack(track, localStream);
});











  //监听信令服务器的message，当接到SDP的offer时，拿offer setRemoteDescription
  socket.on("message", async (message) => {
    // console.log("eee")
    if (message.offer) {
      console.log("收到 offer:" + message.offer);

      peerConnection.setRemoteDescription(
        new RTCSessionDescription(message.offer)
      );
      // 设置本地SDP，向信令服务器发SDP answer
      local_answer = await peerConnection.createAnswer();
      console.log('local_answer:', local_answer);
      await peerConnection.setLocalDescription(local_answer);
      socket.emit("message", {
        type: "answer",
        from: socketid,
        answer: local_answer,
      });
      //   signalingChannel.send({ answer: answer });
    }
    // 别的answer
    if (message.answer) {
      console.log("收到 answer:" + message.answer);
      peerConnection.setRemoteDescription(
        new RTCSessionDescription(message.answer)
      );
    }
  });




  // Listen for local ICE candidates on the local RTCPeerConnection
  peerConnection.addEventListener("icecandidate", (event) => {
    if (event.candidate) {
      local_candidate = event.candidate;
      console.log('local_candidate:',local_candidate)
      socket.emit("message", {
        type: "candidate",
        from: socketid,
        candidate: event.candidate,
      });
      // signalingChannel.send({ "new-ice-candidate": event.candidate });
    }
  });
  peerConnection.addEventListener("connectionstatechange", (event) => {
    if (peerConnection.connectionState === "connected") {
      console.log("Peers connected");
    }
  });

  // Listen for remote ICE candidates and add them to the local RTCPeerConnection
  // (接收时写个判断，排除自己的)，不用了，broadcast可以不往自己那里发
  socket.on("message", async (message) => {
    // 信令服务器广播，所以判断一下与自己不同
    try {
      await peerConnection.addIceCandidate(message.iceCandidate);
      console.log("接收到icecandidate");
    } catch (e) {
      console.error("Error adding received ice candidate", e);
    }
  });

  peerConnection.addEventListener('track', async (event) => {
    // console.log("准备播放");
    console.log("准备播放远方流:",event.streams)
    const [remoteStream] = event.streams;
    remoteVideo.srcObject = remoteStream;
});


}

handleVideoOfferMsg(socket);
