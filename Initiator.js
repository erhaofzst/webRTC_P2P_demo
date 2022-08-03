"use strict";
/*
- 功能：
    - 能发送信令给信令服务器
    SDP-offer/ICE-
    - 能从信令服务器接收信令
    SDP-answer/ICE
    
    - 与另一个客户端对等连接
    - 与另一个客户端推拉流,video标签处理
*/

//先加入本地流再setSDP
const hangupButton = document.getElementById("hangup-button");

const remoteVideo = document.getElementById("remoteVideo");
const localVideo = document.getElementById("localVideo");

// 信令服务器
const signalServerIp = "127.0.0.1";
const signalServerPort = 7777;
let signalUrl = `wss://${signalServerIp}:${signalServerPort}`;
let local_candidate;
let peerConnection;
let localStream;
let socketid;
// 在socket.io在html中被引了
let socket = io(signalUrl); // 已经连上socket.io，后端的io.on("connection")

// 连接上server端的事件
socket.on("connect", () => {
  console.log("client connect");
});
// console.log("socket:",socket.id);

socket.on("get-socketid", (data) => {
  console.log("get-socketid:", data);
  if (data.type === "socketID") {
    socketid = data.socketid;
  }
});

async function handleNegotiationNeededEvent(socket) {
  // console.log("hhhhh");
  // const configuration = {
  //   iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  // };
  // peerConnection = new RTCPeerConnection(configuration);
  peerConnection = new RTCPeerConnection();




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

  console.log("会议发起人本地流:",localStream);

  localStream.getTracks().forEach((track) => {
    // recordEvent(`将本地track加入peer连接中 [${track.kind}]`)
    console.log("本地track", track);
    peerConnection.addTrack(track, localStream);
  });






  // 生成offer
  const offer = await peerConnection.createOffer();
  // 生成本地SDP描述
  await peerConnection.setLocalDescription(offer);
  // 发送 offer 给信令服务器
  socket.emit("message", {
    type: "offer",
    from: socketid,
    offer: offer,
  });

  // 监听answer应答，收到answer后在本地存储 answer信息，这样完成SDP交换
  socket.on("message", async (message) => {
    // console.log("asd2")
    if (message.answer) {
      console.log("收到answer:" + message.answer);
      const remoteDesc = new RTCSessionDescription(message.answer);
      await peerConnection.setRemoteDescription(remoteDesc);
    }
  });


  // Listen for local ICE candidates on the local RTCPeerConnection
  peerConnection.addEventListener("icecandidate", (event) => {
    console.log("开始找candidate");
    if (event.candidate) {
      console.log("addEventListener:", event.candidate);
      local_candidate = event.candidate;
      socket.emit("message", {
        type: "candidate",
        from: socketid,
        candidate: event.candidate,
      });
      // signalingChannel.send({ "new-ice-candidate": event.candidate });
    }
  });

  // Listen for remote ICE candidates and add them to the local RTCPeerConnection
  socket.on("message", async (message) => {
    // 信令服务器广播，所以判断一下与自己不同，用broadcast理论上是不会发过来这个的
    // if (message.iceCandidate != local_candidate) {
    if (message.candidate) {
      try {
        console.log("接收到icecandidate");
        console.log("from:" + message.from + ";;;;;localid:" + socketid, message.candidate);
        await peerConnection.addIceCandidate(message.candidate);
      } catch (e) {
        console.error("Error adding received ice candidate", e);
      }
      // }
    }
  });
  
  peerConnection.addEventListener("connectionstatechange", (event) => {
    if (peerConnection.connectionState === "connected") {
      console.log("Peers connected");
    }
  });


  peerConnection.addEventListener('track', async (event) => {
    // console.log("准备播放");
    console.log("准备播放远方流:",event.streams)
    const [remoteStream] = event.streams;
    remoteVideo.srcObject = remoteStream;
});

  // console.log("socketid:",socketid);
}

handleNegotiationNeededEvent(socket);
