import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";

const App = () => {
  const [myId, setMyId] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const [status, setStatus] = useState("Idle");
  const [debugInfo, setDebugInfo] = useState([]);
  const [connectionStats, setConnectionStats] = useState({});
  const [incomingData, setIncomingData] = useState([]);
  const localAudioRef = useRef();
  const remoteAudioRef = useRef();
  const peerRef = useRef();
  const currentCall = useRef();
  const localStreamRef = useRef();

  useEffect(() => {
    const peer = new Peer(undefined, {
      host: window.location.hostname,
      port: 3001,
      path: "/peerjs",
    });

    peer.on("open", (id) => {
      setMyId(id);
      logDebug(`Connected with ID: ${id}`);
    });

    peer.on("call", (call) => {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        localStreamRef.current = stream;
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.play();
        call.answer(stream);
        currentCall.current = call;

        call.on("stream", (remoteStream) => {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play();
          setStatus("In Call");
          logDebug("Received remote stream");
        });

        call.on("close", () => {
          setStatus("Idle");
          logDebug("Remote call ended");
        });
      });
    });

    peerRef.current = peer;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          const settings = audioTrack.getSettings();
          setConnectionStats({
            ...settings,
            readyState: audioTrack.readyState,
            muted: audioTrack.muted,
            enabled: audioTrack.enabled,
            label: audioTrack.label,
            kind: audioTrack.kind,
            sampleRate: settings.sampleRate || "Unknown",
            latency: audioTrack.latency || "Unknown",
          });
          setIncomingData((prev) => [...prev.slice(-20), `SampleRate: ${settings.sampleRate}, Latency: ${audioTrack.latency}`]);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const callPeer = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      localStreamRef.current = stream;
      localAudioRef.current.srcObject = stream;
      localAudioRef.current.play();

      const call = peerRef.current.call(remoteId, stream);
      currentCall.current = call;

      call.on("stream", (remoteStream) => {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play();
        setStatus("In Call");
        logDebug("Call connected and remote stream received");
      });

      call.on("close", () => {
        setStatus("Idle");
        logDebug("Call ended by peer");
      });
    });
  };

  const endCall = () => {
    if (currentCall.current) {
      currentCall.current.close();
      setStatus("Idle");
      logDebug("Call ended");
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      logDebug("Local stream tracks stopped");
    }
  };

  const logDebug = (msg) => {
    setDebugInfo((prev) => [...prev.slice(-100), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Local WebRTC Voice Chat</h1>
      <div>
        <p><strong>Your ID:</strong> {myId}</p>
        <input
          className="border p-2 rounded w-full"
          placeholder="Enter peer ID to call"
          value={remoteId}
          onChange={(e) => setRemoteId(e.target.value)}
        />
        <div className="space-x-2 mt-2">
          <button
            onClick={callPeer}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Call
          </button>
          <button
            onClick={endCall}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            End Call
          </button>
        </div>
      </div>
      <div>
        <p><strong>Status:</strong> {status}</p>
        <p className="text-sm text-gray-600">Track Ready: {connectionStats.readyState || "N/A"}</p>
        <p className="text-sm text-gray-600">Muted: {String(connectionStats.muted)}</p>
        <p className="text-sm text-gray-600">Enabled: {String(connectionStats.enabled)}</p>
        <p className="text-sm text-gray-600">Label: {connectionStats.label}</p>
        <p className="text-sm text-gray-600">Kind: {connectionStats.kind}</p>
        <p className="text-sm text-gray-600">Sample Rate: {connectionStats.sampleRate}</p>
        <p className="text-sm text-gray-600">Latency: {connectionStats.latency}</p>
      </div>
      <div className="bg-gray-100 p-2 rounded mt-4">
        <h2 className="font-semibold">Debug Info</h2>
        <pre className="text-sm overflow-auto h-40">{debugInfo.join("\n")}</pre>
      </div>
      <div className="bg-gray-100 p-2 rounded mt-4">
        <h2 className="font-semibold">Incoming Data</h2>
        <pre className="text-sm overflow-auto h-32">{incomingData.join("\n")}</pre>
      </div>
      <audio ref={localAudioRef} hidden></audio>
      <audio ref={remoteAudioRef} hidden></audio>
    </div>
  );
};

export default App;