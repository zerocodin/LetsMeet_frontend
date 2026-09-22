import React from "react";
import { MonitorUp, Crown } from "lucide-react";
import VideoTile from "./VideoTile";

/**
 * Full-screen layout used when someone is sharing their screen.
 *
 * @param {Object}   props.sharer         — { isSelf, name, username, profileImage, role, socketId }
 * @param {Array}    props.participants   — remote participants (excludes self)
 */
export default function ScreenShareView({
	sharer,
	sharerStream,
	localStream,
	myParticipant,
	remoteStreams,
	participants,
	activeSpeaker,
}) {
	// Build a thumbnail list = everyone EXCEPT the sharer
	const thumbs = [];

	// Add self if self isn't the sharer
	if (!sharer.isSelf) {
		thumbs.push({
			key: "self",
			stream: localStream,
			participant: { ...myParticipant, name: "You" },
			isLocal: true,
			isSpeaking: activeSpeaker === "self",
		});
	}

	// Add remote participants (excluding the sharer)
	participants.forEach((p) => {
		if (p.socketId === sharer.socketId) return; // skip sharer
		thumbs.push({
			key: p.socketId,
			stream: remoteStreams.get(p.socketId) || null,
			participant: p,
			isLocal: false,
			isSpeaking: activeSpeaker === p.socketId,
		});
	});

	const sharerName = sharer.isSelf ? "You" : sharer.name || "Guest";

	return (
		<div className="flex h-full w-full flex-col bg-gray-950">
			{/* Big screen-share tile */}
			<div className="relative flex-1 overflow-hidden">
				{/* Screen-share stream */}
				{sharerStream ? (
					<video
						autoPlay
						playsInline
						muted={sharer.isSelf}
						className="h-full w-full bg-black object-contain"
						ref={(el) => {
							if (el && el.srcObject !== sharerStream) {
								el.srcObject = sharerStream;
								el.play?.().catch(() => {});
							}
						}}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-gray-900 text-gray-500">
						Loading screen...
					</div>
				)}

				{/* Overlay badge */}
				<div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
					<MonitorUp className="h-3.5 w-3.5" />
					{sharerName} is sharing{sharer.isSelf ? "" : "'s screen"}
					{sharer.role === "HOST" && (
						<Crown className="ml-1 h-3.5 w-3.5 text-amber-200" />
					)}
				</div>
			</div>

			{/* Thumbnail strip */}
			{thumbs.length > 0 && (
				<div className="shrink-0 border-t border-white/5 bg-gray-900/95 p-2 backdrop-blur">
					<div className="flex gap-2 overflow-x-auto">
						{thumbs.map((t) => (
							<div
								key={t.key}
								className="aspect-video h-20 w-32 shrink-0 sm:h-24 sm:w-40"
							>
								<VideoTile
									stream={t.stream}
									participant={t.participant}
									isLocal={t.isLocal}
									isSpeaking={t.isSpeaking}
								/>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}