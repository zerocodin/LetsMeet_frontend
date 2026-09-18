import React from "react";
import VideoTile from "./VideoTile";

/**
 * @param {Object} props
 * @param {MediaStream|null} props.localStream
 * @param {Object} props.myParticipant  — { name, role, isMuted, isCameraOff, isScreenSharing, profileImage }
 * @param {Map} props.remoteStreams     — socketId → MediaStream
 * @param {Array} props.participants    — [{ socketId, name, role, isMuted, isCameraOff, isScreenSharing, profileImage }]
 */
export default function VideoGrid({
	localStream,
	myParticipant,
	remoteStreams,
	participants,
	activeSpeaker
}) {
	// Build a unified list of tiles
	const remoteTiles = participants.map((p) => ({
		key: p.socketId,
		stream: remoteStreams.get(p.socketId) || null,
		participant: p,
		isLocal: false,
	}));

	const totalCount = remoteTiles.length + 1; // +1 for local

	// Choose grid columns based on total count
	const gridCols =
		totalCount === 1
			? "grid-cols-1"
			: totalCount === 2
			? "grid-cols-1 md:grid-cols-2"
			: totalCount <= 4
			? "grid-cols-2"
			: totalCount <= 6
			? "grid-cols-2 lg:grid-cols-3"
			: totalCount <= 9
			? "grid-cols-2 md:grid-cols-3"
			: "grid-cols-2 md:grid-cols-3 xl:grid-cols-4";

	// Screen share takes the whole area (coming later)
	// For now, keep everything in a uniform grid.

	return (
				<div className={`grid h-full w-full gap-3 p-3 ${gridCols} auto-rows-fr`}>
			<VideoTile
				stream={localStream}
				participant={{ ...myParticipant, name: "You" }}
				isLocal
				isSpeaking={activeSpeaker === "self"}
			/>

			{remoteTiles.map((t) => (
				<VideoTile
					key={t.key}
					stream={t.stream}
					participant={t.participant}
					isLocal={false}
					isSpeaking={activeSpeaker === t.key}
				/>
			))}
		</div>
	);
}