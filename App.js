/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Fragment, Component } from 'react';
import {
  TouchableOpacity,
  Alert, Button,
  StyleSheet,
  View,
  Text,

} from 'react-native';


import { Janus } from './janus.js';

import {
  RTCView,
  mediaDevices
} from 'react-native-webrtc';

//export default 
class App extends React.Component {



  constructor(props) {
    super(props);

    this.state = { streamUrl: null };
  };


  componentDidMount() {
    console.log('componentDidMount');

    mediaDevices.enumerateDevices().then(sourceInfos => {
      console.log(sourceInfos);
      mediaDevices.getUserMedia({
        audio: true,
        video: false
      }).then(stream => {
        this.setState(previousState => (
          { streamUrl: stream.toURL() }
        ))
        console.log("Got stream !")
        console.log("Stream ID: " + this.state.streamUrl)
      }).catch(error => {
        // Log error
      });
    });
  }
  render() {
    return (
      <View>
        {<RTCView streamURL={this.state.streamUrl}/>}
      </View>
    );
  }

}

var mixertest = null;
var server = "http://34.87.78.38:8088/janus";
let myid = null;
let janus = null;


Janus.init({
  debug: "all", callback: function () {
    if (started)
      return;
    started = true;
  }
});

export default class JanusReactNative extends Component {

  constructor(props) {
    super(props);
    this.state = {
      info: 'Initializing',
      selfViewSrc: null,
      selfViewSrcKey: null,
      buttonText: "Start for Janus !!!"
    };
    this.janusStart.bind(this);
    this.onPressButton.bind(this);
  }



  componentDidMount() {
  }

  janusStart = () => {
	Janus.init({debug: "all", callback: function() {
		if(!Janus.isWebrtcSupported()) {
            console.log("No WebRTC support... ");
            return;
        }
        // Create session
        janus = new Janus(
            {
                server: server,
                success: function() {
                    janus.attach(
                        {
                            plugin: "janus.plugin.audiobridge",
                            opaqueId: "audiobridgetest-"+Janus.randomString(12),
                            success: function(pluginHandle) {
                                mixertest = pluginHandle;
                                registerUsername;
                            },
                            error: function(error) {
                                Janus.error("  -- Error attaching plugin...", error);
                            },
                            consentDialog: function(on) {
                            },
                            onmessage: function(msg, jsep) {
                                Janus.debug(" ::: Got a message :::");
                                Janus.debug(msg);
                                var event = msg["audiobridge"];
                                Janus.debug("Event: " + event);
                                if(event != undefined && event != null) {
                                    if(event === "joined") {
                                        if(msg["id"]) {
                                            myid = msg["id"];
                                            Janus.log("Successfully joined room " + msg["room"] + " with ID " + myid);
                                            if(!webrtcUp) {
                                                webrtcUp = true;
                                                mixertest.createOffer(
                                                    {
                                                        media: { video: false},	// This is an audio only room
                                                        success: function(jsep) {
                                                            Janus.debug("Got SDP!");
                                                            Janus.debug(jsep);
                                                            var publish = { "request": "configure", "muted": false };
                                                            mixertest.send({"message": publish, "jsep": jsep});
                                                        },
                                                        error: function(error) {
                                                            Janus.error("WebRTC error:", error);
                                                        }
                                                    });
                                            }
                                        }
                                        if(msg["participants"] !== undefined && msg["participants"] !== null) {
                                            var list = msg["participants"];
                                            Janus.debug("Got a list of participants:");
                                            Janus.debug(list);
                                            for(var f in list) {
                                                var id = list[f]["id"];
                                                var display = list[f]["display"];
                                                var setup = list[f]["setup"];
                                                var muted = list[f]["muted"];
                                                Janus.debug("  >> [" + id + "] " + display + " (setup=" + setup + ", muted=" + muted + ")");
                                            }
                                        }
                                    } else if(event === "roomchanged") {
                                        myid = msg["id"];
                                        if(msg["participants"] !== undefined && msg["participants"] !== null) {
                                            var list = msg["participants"];
                                            for(var f in list) {
                                                var id = list[f]["id"];
                                                var display = list[f]["display"];
                                                var setup = list[f]["setup"];
                                                var muted = list[f]["muted"];
                                                Janus.debug("  >> [" + id + "] " + display + " (setup=" + setup + ", muted=" + muted + ")");
                                            }
                                        }
                                    } else if(event === "destroyed") {
                                        Janus.warn("The room has been destroyed!");
                                    } else if(event === "event") {
                                        if(msg["participants"] !== undefined && msg["participants"] !== null) {
                                            var list = msg["participants"];
                                            Janus.debug("Got a list of participants:");
                                            Janus.debug(list);
                                            for(var f in list) {
                                                var id = list[f]["id"];
                                                var display = list[f]["display"];
                                                var setup = list[f]["setup"];
                                                var muted = list[f]["muted"];
                                                Janus.debug("  >> [" + id + "] " + display + " (setup=" + setup + ", muted=" + muted + ")");
                                            }
                                        } else if(msg["error"] !== undefined && msg["error"] !== null) {
                                            if(msg["error_code"] === 485) {
                                                // This is a "no such room" error: give a more meaningful description
                                            }
                                            return;
                                        }
                                        if(msg["leaving"] !== undefined && msg["leaving"] !== null) {
                                            var leaving = msg["leaving"];
                                            Janus.log("Participant left: " + leaving + " (we have " + $('#rp'+leaving).length + " elements with ID #rp" +leaving + ")");
                                        }
                                    }
                                }
                                if(jsep !== undefined && jsep !== null) {
                                    Janus.debug("Handling SDP as well...");
                                    Janus.debug(jsep);
                                    mixertest.handleRemoteJsep({jsep: jsep});
                                }
                            },
                            onlocalstream: function(stream) {
                                console.log("MASUK LOKAL");
                                this.setState({ selfViewSrc: stream.toURL() });
                                this.setState({ selfViewSrcKey: Math.floor(Math.random() * 1000) });
                            },
                            onremotestream: function(stream) {
                                console.log("MASUK NON LOKAL");
                                // Janus.attachMediaStream($('#roomaudio').get(0), stream);
                            },
                            oncleanup: function() {
                                webrtcUp = false;
                                Janus.log(" ::: Got a cleanup notification :::");
                            }
                        });
                },
                error: function(error) {
                    Janus.error(error);
                },
                destroyed: function() {
                    window.location.reload();
                }
            });
	}});
  }

  async registerUsername() {
		var register = { "request": "join", "room": 1234, "display": "yokbisayok" };
		myusername = username;
		mixertest.send({"message": register});
  }

  onPressButton = () => {
    this.janusStart();
  }


  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this.onPressButton} underlayColor="white">
          <View style={styles.button}>
            <Text style={styles.buttonText}>{this.state.buttonText}</Text>
          </View>
        </TouchableOpacity>

        {this.state.selfViewSrc &&
          <RTCView 
            key={this.state.selfViewSrcKey}
            streamURL={this.state.selfViewSrc}
            style={{ width: 350, height: 600 }} />}

      </View>


    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    alignItems: 'center'
  },
  button: {
    marginBottom: 30,
    width: 260,
    alignItems: 'center',
    backgroundColor: '#2196F3'
  },
  buttonText: {
    padding: 20,
    color: 'white'
  }
});
