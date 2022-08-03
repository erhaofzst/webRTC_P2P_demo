### ICE(interactive Connectivity Establishment)交互式连接设施
- ICE 是一个允许你的浏览器和对端浏览器建立连接的**协议框架**
- 实际网络中有很多因素导致A端到B端的直连不能实现
  - （需要绕过防火墙）
  - 一般没有固定的公网IP（给设备分配一个唯一可见的地址）
  - 路由器不允许直连（还需要通过一台服务器转发）
- ICE通过一下几种技术来完成上述工作
#### STUN（Session Traversal Utilities for NAT）NAT的会话穿越功能
- 是一个允许位于 NAT 后的客户端找出自己的公网地址，判断出路由器阻止直连的限制方法的协议
  - 客户端通过给公网的 STUN 服务器发送请求获得自己的公网地址信息
  - 是否能够被（穿过路由器）访问

​	![image-20220729114455925](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20220729114455925.png)

- 一些路由器严格地限定了部分私网设备的对外连接。这种情况下，即使 STUN 服务器识别了该私网设备的公网 IP 和端口的映射，依然无法和这个私网设备建立连接。这种情况下就需要转向 TURN 协议。

#### TURN（Traversal Using Relays around NAT）NAT的中继穿越方式

- 需要在 TURN 服务器上创建一个连接，然后告诉所有对端设备发包到服务器上，TURN 服务器再把包转发给你。很显然这种方式是开销很大的，所以只有在没得选择的情况下采用。
- ![image-20220729114955295](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20220729114955295.png)

#### SDP（Session Description Protocol）

- 是一个描述多媒体连接内容的协议，如分辨率，格式，编码，加密算法等
- 这些描述内容的元数据并不是媒体流本身
- 技术上，SDP并不是一个真正的协议，而是一种**数据格式**，用于描述在设备之间**共享媒体的连接**
- 由一个**会话级部分**组成后跟着零个或多个**媒体级部分**。

![image-20220729172956930](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20220729172956930.png)

```
// sdp版本号为0
v=0

// o=<username> <session-id> <session-version> <nettype> <addrtype> <unicast-address>
// 用户ID或者企业标识，如果不需要写成‘-’，会话id是8100750360520823155，当前会话版本是2，（后面如果有类似改变编码的操作，session-version加1），地址类型为IP4，地址为127.0.0.1（这里可以忽略）
o=- 6413499524467085832 2 IN IP4 127.0.0.1
// 会话名可以不用设置， 使用‘-’代替
s=-
// 会话的起始时间，都为0表示没有限制，即时通讯 基本都是0
t=0 0
a=ice-lite
// 音频、视频的传输的传输采取多路复用，通过同一个RTP通道传输音频、视频，如果后续还有其他的媒体，这里可以增加
// 例如 group:BUNDLE 1 2 3 分别 表示 音 视频 数据通道，老版本这里 可能是 audio video datachannal
// 可以参考 https://tools.ietf.org/html/draft-ietf-mmusic-sdp-bundle-negotiation-54
a=group:BUNDLE 0 1 2

// WMS是WebRTC Media Stram的缩写，这里给Media Stream定义了一个唯一的标识符。一个Media Stream可以有多个track（video track、audio track），这些track就是通过这个唯一标识符关联起来的，具体见下面的媒体行(m=)以及它对应的附加属性(a=ssrc:)
// 可以参考这里 http://tools.ietf.org/html/draft-ietf-mmusic-msid
a=msid-semantic:  WMS ARDAMS
// m=<media> <port> <proto> <fmt> ...
// 本次会话有音频，端口为9（可忽略，端口9为Discard Protocol专用）9是一个特殊端口（1024以下的端口由系统控制），表示不使用本端口发送数据；采用UDP传输经过TLS加密的RTP包，并使用基于SRTCP的音视频反馈机制来提升传输质量SAVPF中s是safe的含义av是audio/video，p是protocol，f是family；111(一般是opus)、103、104等是audio可能采用的编码（参见前面m=的说明）  
m=audio 9 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 126

// 音频发送者的IP4地址，WebRTC采用ICE，这里的 0.0.0.0 可直接忽略
c=IN IP4 0.0.0.0
// RTCP传输需要采用的端口、IP地址（可忽略）
a=rtcp:9 IN IP4 0.0.0.0

// 用于ice链路检查的时候对链路的有效性进行验证，通过交换后进行双方验证， ice-ufrag、ice-pwd 分别为ICE协商用到的认证信息
a=ice-ufrag:58142170598604946
a=ice-pwd:71696ad0528c4adb02bb40e1
// 以前使用ICE进行端口收集需要在sdp交换之前完成，这种方式需要等待，trickle表示sdp交换的时候不进行收集， 是在setlocaldes 发送完sdp之后进行收集,没发送一个进行ice连同检测，以提高效率；
a=ice-options:trickle
// DTLS协商过程的指纹信息
a=fingerprint:sha-256 7F:98:08:AC:17:6A:34:DB:CF:3B:EC:93:ED:57:3F:5A:9E:1F:4A:F3:DB:D5:BF:66:EE:17:58:E0:57:EC:1B:19

// 当前客户端在DTLS协商过程中，既可以作为客户端，也可以作为服务端 是可选的，具体可参考 RFC4572
a=setup:actpass

// 当前媒体行的标识符（在a=group:BUNDLE 0 1 这行里面用到，这里0表示audio）
a=mid:0

// RTP允许扩展首部，这里表示采用了RFC6464定义的针对audio的扩展首部，用来调节音量，比如在大型会议中，有多个音频流，就可以用这个来调整音频混流的策略
// 这里没有vad=1，表示不启用这个音量控制
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
// 告诉对方我这里既可以发送音频，也可以接收音频；
a=sendrecv
// 接下来都是 rtcp相关的
// 表示启用多路复用，RTP、RTCP共用同个通道
a=rtcp-mux
// 下面几行都是对audio媒体行的补充说明（针对111），包括rtpmap、rtcp-fb、fmtp
// rtpmap：编解码器为opus，采样率是48000，2声道
a=rtpmap:111 opus/48000/2

// rtcp-fb：基于RTCP的反馈控制机制，可以参考 https://tools.ietf.org/html/rfc5124、https://webrtc.org/experiments/rtp-hdrext/transport-wide-cc-02/
a=rtcp-fb:111 transport-cc
a=rtcp-fb:111 nack

// minptime 最小的音频打包时间 
 // useinbandfec 指定解码器具有利用Opus带内FEC的能力
 // stereo 指定解码器接收立体声信号还是单声道信号,其中1表示首选立体声信号，0表示仅首选单声道信号
 // sprop-stereo sprop-stereo	指定发送方是否可能产生立体声音频。其中1指定可能发送立体声信号，0指定发送方可能仅发送单声道
 // maxaveragebitrate 指定会话的最大平均平均接收比特率，以每秒比特数（b/s）
a=fmtp:111 minptime=10;useinbandfec=1;stereo=1; sprop-stereo=1;maxaveragebitrate = 8000
a=rtpmap:103 ISAC/16000
a=rtpmap:104 ISAC/32000
a=rtpmap:9 G722/8000
a=rtpmap:102 ILBC/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:106 CN/32000
a=rtpmap:105 CN/16000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:112 telephone-event/32000
a=rtpmap:113 telephone-event/16000
a=rtpmap:126 telephone-event/8000
// 跟前面的rtpmap类似
a=rtpmap:126 telephone-event/8000

// ssrc用来对媒体进行描述，格式为a=ssrc:<ssrc-id> <attribute>:<value>，具体可参考 RFC5576
// cname用来唯一标识媒体的数据源 ,一般和ssrc对应，这里came是为了防止ssrc重复
a=ssrc:3111117364 cname:yf5j55RzgCyvZVkp
// msid后面带两个id，第一个是MediaStream的id，第二个是audio track的id（跟后面的mslabel、label对应）
a=ssrc:3111117364 msid:ARDAMS ARDAMSa0
a=ssrc:3111117364 mslabel:ARDAMS
a=ssrc:3111117364 label:ARDAMSa0
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 127 123 125 122 124 107 108
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:c0UT
a=ice-pwd:lttpyY+EYi08FyK76ZuKX9eA
a=ice-options:trickle renomination
a=fingerprint:sha-256 96:CA:48:3B:8F:7C:F7:48:F7:08:DF:02:3D:A0:08:BD:F7:27:40:44:7A:15:BF:DC:82:AA:E6:C9:F2:E0:E5:4A
a=setup:actpass
a=mid:2
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset
a=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:4 urn:3gpp:video-orientation
a=extmap:2 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/video-timing
a=extmap:9 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07
a=extmap:10 http://www.webrtc.org/experiments/rtp-hdrext/color-space
a=sendrecv
a=rtcp-mux
//rtcp消息是否可以减少， 表示对方只定时发送丢失的包数据
a=rtcp-rsize
// 对paload type的补充说明
a=rtpmap:96 H264/90000
// 接收端带宽评估；
a=rtcp-fb:96 goog-remb
// 发送端带宽评估，有些浏览器可能不支持
a=rtcp-fb:96 transport-cc
// 编码控制 codec control message。可以发送一个完整的内部帧请求；当对方缺少包，可以发送rtcp是fir类型的，这时候发送端可以发送一个i帧
a=rtcp-fb:96 ccm fir
a=rtcp-fb:96 nack
// pli 丢失一个帧，可以重新请求
a=rtcp-fb:96 nack pli
// h264 编码的补充，其中通过profile-level-id可以知道使用h264的版本级别等信息；
// 后面几个是限制 视频传输的最大，最小带宽，以及开始带宽(浮动的时候不大于最最大值，不小于最小值)
a=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f;x-google-max-bitrate=655;x-google-min-bitrate=120;x-google-start-bitrate=492
// 表示用于h264（96）重传的包,rtx 有自己的ssrc通常和对应的编码的
a=rtpmap:97 rtx/90000
// 这里表示 97 是 96 关联的，也就是说97是96的重传包；
a=fmtp:97 apt=96
a=rtpmap:98 H264/90000
a=rtcp-fb:98 goog-remb
a=rtcp-fb:98 transport-cc
a=rtcp-fb:98 ccm fir
a=rtcp-fb:98 nack
a=rtcp-fb:98 nack pli
a=fmtp:98 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e02a
a=rtpmap:99 rtx/90000
a=fmtp:99 apt=98
a=rtpmap:100 VP8/90000
a=rtcp-fb:100 goog-remb
a=rtcp-fb:100 transport-cc
a=rtcp-fb:100 ccm fir
a=rtcp-fb:100 nack
a=rtcp-fb:100 nack pli
a=rtpmap:101 rtx/90000
a=fmtp:101 apt=100
a=rtpmap:127 VP9/90000
a=rtcp-fb:127 goog-remb
a=rtcp-fb:127 transport-cc
a=rtcp-fb:127 ccm fir
a=rtcp-fb:127 nack
a=rtcp-fb:127 nack pli
a=rtpmap:123 rtx/90000
a=fmtp:123 apt=127
a=rtpmap:125 H265/90000
a=rtcp-fb:125 goog-remb
a=rtcp-fb:125 transport-cc
a=rtcp-fb:125 ccm fir
a=rtcp-fb:125 nack
a=rtcp-fb:125 nack pli
a=rtpmap:122 rtx/90000
a=fmtp:122 apt=125
// red表示 需要数据包可以有冗余数据，如果发生丢包，可以通过冗余包尝试找回数据；
a=rtpmap:124 red/90000
a=rtpmap:107 rtx/90000
a=fmtp:107 apt=124
// fec的增强版本
a=rtpmap:108 ulpfec/90000
// 这个表示有联播， 71691508 1172020434 3648770906 三个ssrc分别表示三路编码的流
a=ssrc-group:SIM 71691508 1172020434 3648770906
// 表示这两个是一组，也就是RTX和关联的编码
a=ssrc-group:FID 71691508 3328952084
a=ssrc-group:FID 1172020434 2049989829
a=ssrc-group:FID 3648770906 1147330493
// cname channel name。表示传输通道的名字，webrtc是通道复用的，所以在这个sdp中能看到不管是音频的ssrc、视频的ssrc，还是rtx的ssrc、联播的ssrc都是一个cname
a=ssrc:71691508 cname:yf5j55RzgCyvZVkp
// media track ID 表示ARDAMSv0这个视频是在ARDAMS流
a=ssrc:71691508 msid:ARDAMS ARDAMSv0
a=ssrc:71691508 mslabel:ARDAMS
a=ssrc:71691508 label:ARDAMSv0
a=ssrc:1172020434 cname:yf5j55RzgCyvZVkp
a=ssrc:1172020434 msid:ARDAMS ARDAMSv0
a=ssrc:1172020434 mslabel:ARDAMS
a=ssrc:1172020434 label:ARDAMSv0
a=ssrc:3648770906 cname:yf5j55RzgCyvZVkp
a=ssrc:3648770906 msid:ARDAMS ARDAMSv0
a=ssrc:3648770906 mslabel:ARDAMS
a=ssrc:3648770906 label:ARDAMSv0
a=ssrc:3328952084 cname:yf5j55RzgCyvZVkp
a=ssrc:3328952084 msid:ARDAMS ARDAMSv0
a=ssrc:3328952084 mslabel:ARDAMS
a=ssrc:3328952084 label:ARDAMSv0
a=ssrc:2049989829 cname:yf5j55RzgCyvZVkp
a=ssrc:2049989829 msid:ARDAMS ARDAMSv0
a=ssrc:2049989829 mslabel:ARDAMS
a=ssrc:2049989829 label:ARDAMSv0
a=ssrc:1147330493 cname:yf5j55RzgCyvZVkp
a=ssrc:1147330493 msid:ARDAMS ARDAMSv0
a=ssrc:1147330493 mslabel:ARDAMS
a=ssrc:1147330493 label:ARDAMSv0

```

