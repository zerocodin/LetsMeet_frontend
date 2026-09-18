import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useWebRTC } from "../hooks/useWebRTC";
import { useMediaDevices } from "../hooks/useMediaDevices";
import { getSocket, connectSocket } from "../lib/socket";

export default function WebRTCTest() {
  const [params] = useSearchParams();
  const meetingId = params.get("m");
  const peerConnections = useRef(new Map());
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [mySocketId, setMySocketId] = useState("");

  const { localStreamRef, screenStreamRef } = useMediaDevices({});

  const { callPeer } = useWebRTC({
    localStreamRef,
    screenStreamRef,
    peerConnections,
    onRemoteStream: (id, stream) => {
      setRemoteStreams((prev) => new Map(prev).set(id, stream));
    },
    onRemoteStreamRemoved: (id) => {
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    },
  });

  useEffect(() => {
    if (!meetingId) return;
    const socket = connectSocket();

    socket.on("connect", () => {
      setMySocketId(socket.id);
      socket.emit("join-meeting", { meetingId }, (ack) => {
        if (!ack?.success) {
          console.error("Join failed:", ack);
          return;
        }
        // For the SECOND joiner: they get existing participants here
        // and can initiate calls to them (Pattern B)
        // But we're using Pattern A (existing calls joiner), so nothing to do.
      });
    });

    // For test purposes: log any offer/answer events
    socket.on("webrtc-offer", (d) => console.log("Got offer from", d.fromSocketId));
    socket.on("webrtc-answer", (d) => console.log("Got answer from", d.fromSocketId));

    return () => {
      socket.emit("leave-meeting");
    };
  }, [meetingId]);

  return (
    <div className="p-8">
      <h1>Socket: {mySocketId || "connecting..."}</h1>

      <h2 className="mt-4 font-bold">Local</h2>
      <video
        autoPlay muted playsInline
        className="w-64 rounded bg-black"
        ref={(el) => { if (el && localStreamRef.current) el.srcObject = localStreamRef.current; }}
      />

      <h2 className="mt-4 font-bold">Remote ({remoteStreams.size})</h2>
      <div className="flex gap-2">
        {[...remoteStreams.entries()].map(([id, stream]) => (
          <video
            key={id}
            autoPlay playsInline
            className="w-64 rounded bg-black"
            ref={(el) => { if (el) el.srcObject = stream; }}
          />
        ))}
      </div>
    </div>
  );
}