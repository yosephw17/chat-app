// frontend/src/components/VideoCall.js
import React, { useState, useEffect, useRef } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";

const socket = io("http://localhost:5000"); // Replace with your backend server

const VideoCall = () => {
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [peer, setPeer] = useState(null);

  const userVideo = useRef();
  const partnerVideo = useRef();

  useEffect(() => {
    // Access the user's media devices
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }
      });

    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCallerSignal(data.signal);
    });
  }, []);

  const callUser = (id) => {
    const newPeer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    newPeer.on("signal", (data) => {
      socket.emit("callUser", { userToCall: id, signalData: data });
    });

    newPeer.on("stream", (remoteStream) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = remoteStream;
      }
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      newPeer.signal(signal);
    });

    setPeer(newPeer);
  };

  const acceptCall = () => {
    setCallAccepted(true);
    const newPeer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    newPeer.on("signal", (data) => {
      socket.emit("acceptCall", { signal: data });
    });

    newPeer.on("stream", (remoteStream) => {
      partnerVideo.current.srcObject = remoteStream;
    });

    newPeer.signal(callerSignal);
    setPeer(newPeer);
  };

  const leaveCall = () => {
    setCallEnded(true);
    peer.destroy();
  };

  return (
    <div>
      <h2>Video Call</h2>
      <div>
        <video
          playsInline
          muted
          ref={userVideo}
          autoPlay
          style={{ width: "300px" }}
        />
        <video
          playsInline
          ref={partnerVideo}
          autoPlay
          style={{ width: "300px" }}
        />
      </div>
      <div>
        {callAccepted && !callEnded ? (
          <button onClick={leaveCall}>End Call</button>
        ) : receivingCall ? (
          <button onClick={acceptCall}>Accept Call</button>
        ) : (
          <button onClick={() => callUser("partner-id")}>Call</button>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
