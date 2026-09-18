import React, { useState } from "react";
import { useMediaDevices } from "../hooks/useMediaDevices";
import { useMeeting } from "../context/MeetingContext";

export default function MediaTest() {
  const [videoEl, setVideoEl] = useState(null);

  const { isMuted, isCameraOff, toggleMute, toggleCamera } = useMeeting();

  const { localStreamRef, devices, switchCamera, setCameraEnabled, setMicEnabled } =
    useMediaDevices({
      startCamera: true,
      startMic: true,
      onStreamReady: (stream) => {
        if (videoEl) videoEl.srcObject = stream;
      },
    });

  React.useEffect(() => {
    if (videoEl && localStreamRef.current) {
      videoEl.srcObject = localStreamRef.current;
    }
  }, [videoEl, localStreamRef]);

  React.useEffect(() => { setMicEnabled(!isMuted); }, [isMuted, setMicEnabled]);
  React.useEffect(() => { setCameraEnabled(!isCameraOff); }, [isCameraOff, setCameraEnabled]);

  return (
    <div className="p-8">
      <video
        ref={setVideoEl}
        autoPlay
        muted
        playsInline
        className="w-96 rounded-xl bg-black"
      />

      <div className="mt-4 flex gap-2">
        <button onClick={toggleMute} className="rounded bg-gray-200 px-4 py-2">
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button onClick={toggleCamera} className="rounded bg-gray-200 px-4 py-2">
          {isCameraOff ? "Camera On" : "Camera Off"}
        </button>
      </div>

      <div className="mt-4">
        <h3 className="font-bold">Cameras</h3>
        {devices.cameras.map((c) => (
          <button
            key={c.deviceId}
            onClick={() => switchCamera(c.deviceId)}
            className="mr-2 rounded bg-blue-100 px-3 py-1 text-sm"
          >
            {c.label || "Camera"}
          </button>
        ))}
      </div>
    </div>
  );
}