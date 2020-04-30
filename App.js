/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Fragment, Component } from "react";
import {
  TouchableOpacity,
  Alert,
  Button,
  StyleSheet,
  View,
  Text,
} from "react-native";

import { Janus } from "./janus.js";

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
} from "react-native-webrtc";

import { Dimensions } from "react-native";

// also support setRemoteDescription, createAnswer, addIceCandidate, onnegotiationneeded, oniceconnectionstatechange, onsignalingstatechange, onaddstream

const dimensions = Dimensions.get("window");

const configuration = { iceServers: [{ url: "stun:stun.l.google.com:19302" }] };
const pc = new RTCPeerConnection(configuration);
let isFront = false;

//export default
class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = { streamUrl: null };
  }

  componentDidMount() {
    console.log("componentDidMount");

    mediaDevices.enumerateDevices().then((sourceInfos) => {
      console.log("cek source info", sourceInfos);
      let videoSourceId;
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (sourceInfo.kind == "audioinput") {
          videoSourceId = sourceInfo.deviceId;
        }
      }

      mediaDevices
        .getUserMedia({
          audio: true,
          video: false,
          // video: {
          //   mandatory: {
          //     minWidth: 500, // Provide your own width, height and frame rate here
          //     minHeight: 1200,
          //     minFrameRate: 60,
          //   },
          //   facingMode: isFront ? "user" : "environment",
          //   optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
          // },
        })
        .then((stream) => {
          // Got stream!
          // this.state.stream = stream;
          this.setState((previousState) => ({ streamUrl: stream.toURL() }));
          console.log("Got stream !");
          console.log("Stream ID: " + this.state.streamUrl);
        })
        .catch((error) => {
          // Log error
        });
    });
  }

  render() {
    return (
      <View>
        {
          <RTCView
            streamURL={this.state.streamUrl}
            style={{ width: 350, height: 600 }}
          />
        }
      </View>
    );
  }
}

pc.createOffer().then((desc) => {
  pc.setLocalDescription(desc).then(() => {
    // Send pc.localDescription to peer
  });
});

pc.onicecandidate = function(event) {
  // send event.candidate to peer
};

var sfutest = null;
let host = "34.87.78.38";
let server = "http://" + host + ":8088/janus";
let backHost = "http://" + host + ":3000/stream";
let opaque = "RANDOM_EVENT_HANDLER_ID";
let pin = null;
let myroom = null;
let myid = null;
let janus = null;
let sessionId = null;
let audioBridgeId = null;
let videoBridgeId = null;
let audioSession = null;

Janus.init({
  debug: "all",
  // callback: function() {
  //   if (started) return;
  //   started = true;
  // },
});

export default class JanusReactNative extends Component {
  constructor(props) {
    super(props);
    this.state = {
      info: "Initializing",
      status: "init",
      roomID: "",
      isFront: true,
      selfViewSrc: null,
      selfViewSrcKey: null,
      remoteList: {},
      remoteListPluginHandle: {},
      textRoomConnected: false,
      textRoomData: [],
      textRoomValue: "",
      publish: false,
      speaker: false,
      audioMute: false,
      videoMute: false,
      visible: false,
      buttonText: "Start for Janus !!!",
    };
    this.janusStart.bind(this);
    this.onPressButton.bind(this);
  }

  componentDidMount() {}

  janusStart = () => {
    console.log("janus startt");
    this.setState({ visible: true });
    janus = new Janus({
      server: server,
      sessionId: sessionId,
      success: () => {
        janus.attach({
          plugin: "janus.plugin.audiobridge",
          opaqueId: opaque,
          success: (pluginHandle) => {
            sfutest = pluginHandle;
            this.requestStart().then(this.registerUsername);
            // let register = { "request": "join", "room": 1234, "ptype": "publisher", "display": "yanhao", "id": 5035925950 };
            // sfutest.send({ "message": register });
          },
          error: (error) => {
            Alert.alert("  -- Error attaching plugin...", error);
          },
          consentDialog: (on) => {},
          mediaState: (medium, on) => {},
          webrtcState: (on) => {},
          onmessage: (msg, jsep) => {
            console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", msg["id"]);
            var event = msg["audiobridge"];
            if (event != undefined && event != null) {
              console.log("???????????????????????????", event);
              if (event === "joined") {
                console.log("********************");
                if (msg["id"]) {
                  console.log("%%%%%%%%%%%%%%%%%%", msg["id"]);
                  myid = msg["id"];
                  this.publishOwnFeed(true);
                }

                if (
                  msg["participants"] !== undefined &&
                  msg["participants"] !== null
                ) {
                  var list = msg["participants"];
                  for (var f in list) {
                    var id = list[f]["id"];
                    var display = list[f]["display"];
                    var setup = list[f]["setup"];
                    var muted = list[f]["muted"];
                  }
                }
              } else if (event === "roomchanged") {
              } else if (event === "destroyed") {
              } else if (event === "event") {
                console.log("!!!!!event");

                if (
                  msg["participant"] !== undefined &&
                  msg["participant"] !== null
                ) {
                  var list = msg["participant"];
                  for (var f in list) {
                    let id = list[f]["id"];
                    let display = list[f]["display"];
                    // this.newRemoteFeed(id, display)
                  }
                } else if (
                  msg["leaving"] !== undefined &&
                  msg["leaving"] !== null
                ) {
                  var leaving = msg["leaving"];
                  var remoteFeed = null;
                  let numLeaving = parseInt(msg["leaving"]);
                  if (this.state.remoteList.hasOwnProperty(numLeaving)) {
                    delete this.state.remoteList.numLeaving;
                    this.setState({ remoteList: this.state.remoteList });
                    this.state.remoteListPluginHandle[numLeaving].detach();
                    delete this.state.remoteListPluginHandle.numLeaving;
                  }
                } else if (
                  msg["unpublished"] !== undefined &&
                  msg["unpublished"] !== null
                ) {
                  var unpublished = msg["unpublished"];
                  if (unpublished === "ok") {
                    sfutest.hangup();
                    return;
                  }
                  let numLeaving = parseInt(msg["unpublished"]);
                  if ("numLeaving" in this.state.remoteList) {
                    delete this.state.remoteList.numLeaving;
                    this.setState({ remoteList: this.state.remoteList });
                    this.state.remoteListPluginHandle[numLeaving].detach();
                    delete this.state.remoteListPluginHandle.numLeaving;
                  }
                } else if (
                  msg["error"] !== undefined &&
                  msg["error"] !== null
                ) {
                }
              }
            }
            if (jsep !== undefined && jsep !== null) {
              console.log("handling jsep");
              sfutest.handleRemoteJsep({ jsep: jsep });
            }
          },
          // onmessage: (msg, jsep) => {
          //   var event = msg["audiobridge"];
          //   if (event != undefined && event != null) {
          //     if (event === "joined") {
          //       myid = msg["id"];
          //       this.publishOwnFeed(true);
          //       this.setState({ visible: false });
          //       if (
          //         msg["publishers"] !== undefined &&
          //         msg["publishers"] !== null
          //       ) {
          //         var list = msg["publishers"];
          //         for (var f in list) {
          //           var id = list[f]["id"];
          //           var display = list[f]["display"];
          //           // this.newRemoteFeed(id, display)
          //         }
          //       }
          //     } else if (event === "destroyed") {
          //     } else if (event === "event") {
          //       if (
          //         msg["publishers"] !== undefined &&
          //         msg["publishers"] !== null
          //       ) {
          //         var list = msg["publishers"];
          //         for (var f in list) {
          //           let id = list[f]["id"];
          //           let display = list[f]["display"];
          //           // this.newRemoteFeed(id, display)
          //         }
          //       } else if (
          //         msg["leaving"] !== undefined &&
          //         msg["leaving"] !== null
          //       ) {
          //         var leaving = msg["leaving"];
          //         var remoteFeed = null;
          //         let numLeaving = parseInt(msg["leaving"]);
          //         if (this.state.remoteList.hasOwnProperty(numLeaving)) {
          //           delete this.state.remoteList.numLeaving;
          //           this.setState({ remoteList: this.state.remoteList });
          //           this.state.remoteListPluginHandle[numLeaving].detach();
          //           delete this.state.remoteListPluginHandle.numLeaving;
          //         }
          //       } else if (
          //         msg["unpublished"] !== undefined &&
          //         msg["unpublished"] !== null
          //       ) {
          //         var unpublished = msg["unpublished"];
          //         if (unpublished === "ok") {
          //           sfutest.hangup();
          //           return;
          //         }
          //         let numLeaving = parseInt(msg["unpublished"]);
          //         if ("numLeaving" in this.state.remoteList) {
          //           delete this.state.remoteList.numLeaving;
          //           this.setState({ remoteList: this.state.remoteList });
          //           this.state.remoteListPluginHandle[numLeaving].detach();
          //           delete this.state.remoteListPluginHandle.numLeaving;
          //         }
          //       } else if (
          //         msg["error"] !== undefined &&
          //         msg["error"] !== null
          //       ) {
          //       }
          //     }
          //   }
          //   if (jsep !== undefined && jsep !== null) {
          //     sfutest.handleRemoteJsep({ jsep: jsep });
          //   }
          // },
          onlocalstream: (stream) => {
            // console.log("##################################");
            // this.setState({ selfViewSrc: stream.toURL() });
            // this.setState({ selfViewSrcKey: Math.floor(Math.random() * 1000) });
            // this.setState({
            //   status: "ready",
            //   info: "Please enter or create room ID",
            // });
          },
          onremotestream: (stream) => {},
          oncleanup: () => {
            mystream = null;
          },
        });
      },
      error: (error) => {
        Alert.alert("  Janus Error", error);
      },
      destroyed: () => {
        // Alert.alert("  Success for End Call ");
        this.setState({ publish: false });
      },
    });
  };

  async registerUsername() {
    console.log("register user name");
    var username = "vasha-mobile";

    var register = {
      request: "join",
      room: myroom,
      display: username,
      // pin: pin,
      // id: myid,
    };
    sfutest.send({ message: register });
  }

  publishOwnFeed(useAudio) {
    if (!this.state.publish) {
      this.setState({ publish: true, buttonText: "Stop" });

      sfutest.createOffer({
        media: {
          audio: true,
          video: false,
        },
        success: function(jsep) {
          console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@", jsep);
          var publish = {
            request: "configure",
            muted: false,
          };
          sfutest.send({ message: publish, jsep: jsep });
        },
        error: function(error) {
          console.log("eror nich");
          if (useAudio) {
            publishOwnFeed(false);
          } else {
          }
        },
      });
    }
  }

  // publishOwnFeed(useAudio) {
  //   if (!this.state.publish) {
  //     this.setState({ publish: true, buttonText: "Stop" });

  //     sfutest.createOffer({
  //       media: {
  //         audioRecv: true,
  //         videoRecv: false,
  //         audioSend: useAudio,
  //         videoSend: false,
  //       },
  //       success: (jsep) => {
  //         console.log("Create offer : success \n");
  //         var publish = {
  //           request: "configure",
  //           audio: useAudio,
  //           video: false,
  //           // bitrate: 5000 * 1024,
  //         };
  //         sfutest.send({ message: publish, jsep: jsep });
  //       },
  //       error: (error) => {
  //         Alert.alert("WebRTC error:", error);
  //         if (useAudio) {
  //           // publishOwnFeed(false);
  //         } else {
  //         }
  //       },
  //     });
  //   } else {
  //     // this.setState({ publish: false });
  //     // let unpublish = { "request": "unpublish" };
  //     // sfutest.send({"message": unpublish});
  //   }
  // }

  async requestStart() {
    console.log("request start");
    myroom = 1234;
    pin = audioSession;
    myid = sessionId;
    // await fetch(backHost, {
    //   cache: "no-cache",
    //   credentials: "omit",
    //   headers: {
    //     Accept: "application/json, text/plain, */*",
    //     "Content-Type": "application/json",
    //   },
    //   method: "POST",
    //   body: JSON.stringify({
    //     login: "yanhao",
    //     passwd: "1234",
    //     roomid: 5555,
    //     request: "publish",
    //   }),
    // })
    //   .then((response) => {
    //     console.log("cekkkkkkk", JSON.stringify(response));
    //     return response.json();
    //   })
    //   .then((data) => {
    //     console.log("parse response");
    //     console.log("data niii", data);
    //     if (data.status === "success") {
    //       myroom = data.key.room;
    //       pin = data.key.pin;
    //       myid = data.key.id;
    //     }
    //   });
  }

  // unpublishOwnFeed() {
  //   if (this.state.publish) {
  //     this.setState({buttonText: "Start for Janus !!!"})
  //     let unpublish = {request: "unpublish"}
  //     sfutest.send({})
  //   }
  // }

  unpublishOwnFeed() {
    if (this.state.publish) {
      this.setState({ buttonText: "Start for Janus !!!" });
      let unpublish = { request: "unpublish" };
      sfutest.send({ message: unpublish });
      janus.destroy();
      this.setState({ selfViewSrc: null });
    }
  }

  async getSessionID() {
    console.log("get session");
    const url = "http://34.87.78.38:8088/janus";
    const payload = {
      janus: "create",
      transaction: "TRANSACTION_ID",
    };
    await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(payload),
    }).then(async (response) => {
      const resJson = await response.json();
      sessionId = resJson.data.id;
      console.log(sessionId);
    });
  }

  async getAudioBridge() {
    console.log("get audio bridge");
    const url = "http://cquran.my.id:8088/janus/" + sessionId;
    const payload = {
      janus: "attach",
      plugin: "janus.plugin.audiobridge",
      opaque_id: opaque,
      transaction: "TRANSACTION_ID",
    };
    await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(payload),
    }).then(async (response) => {
      const resJson = await response.json();
      console.log(resJson);
      audioBridgeId = resJson.data.id;
    });
  }

  async videoChannel() {
    const url =
      "http://cquran.my.id:8088/janus/" + sessionId + "/" + audioBridgeId;
    const payload = {
      janus: "message",
      body: {
        request: "join",
        room: 1234,
        ptype: "publisher",
        display: "Abdan",
      },
      transaction: "TRANSACTION_ID",
    };
    await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(payload),
    }).then(async (response) => {
      const resJson = await response.json();
      console.log(resJson);
      videoBridgeId = resJson.session_id;
      console.log("===============================");
    });
  }

  async requestJoinChannel() {
    console.log("request join");
    const url =
      "http://cquran.my.id:8088/janus/" + sessionId + "/" + audioBridgeId;
    console.log(url);
    const payload = {
      janus: "message",
      body: {
        request: "join",
        room: 1234,
        display: "vasha-mobile",
      },
      transaction: "TRANSACTION_ID",
    };
    await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(payload),
    }).then(async (response) => {
      const resJson = await response.json();
      console.log(resJson);
      audioSession = resJson.session_id;
      console.log("===============================");
    });
  }

  onPressButton = () => {
    console.log("Button OnPress");
    if (!this.state.publish) {
      this.janusStart();
    } else {
      this.unpublishOwnFeed();
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this.onPressButton} underlayColor="white">
          <View style={styles.button}>
            <Text style={styles.buttonText}>{this.state.buttonText}</Text>
          </View>
          <Button
            onPress={
              this.getSessionID
              // .then(this.requestJoinChannel)
            }
            title="Join Channel"
          />
          <Button onPress={this.getAudioBridge} title="get audio bridge" />
          <Button onPress={this.requestJoinChannel} title="join channel" />
        </TouchableOpacity>

        {this.state.selfViewSrc && (
          <RTCView
            key={this.state.selfViewSrcKey}
            streamURL={this.state.selfViewSrc}
            style={{ width: 350, height: 600 }}
          />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    alignItems: "center",
  },
  button: {
    marginBottom: 30,
    width: 260,
    alignItems: "center",
    backgroundColor: "#2196F3",
  },
  buttonText: {
    padding: 20,
    color: "white",
  },
});
