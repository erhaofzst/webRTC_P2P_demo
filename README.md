环境搭建：
- npm install 根据package.json安装依赖
实现了简单的webrtc的p2p视频通话
整体流程：
- sdp交换
- ice交换
- 建立连接
运行方法：
- 将Initiator.html与client.html运行在http-server上
- server.js充当信令服务器，运行在后端
