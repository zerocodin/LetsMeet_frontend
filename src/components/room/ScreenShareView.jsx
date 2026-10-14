import React, { useRef, useState } from "react";
import { MonitorUp, Crown, ChevronDown, ChevronUp, Users } from "lucide-react";
import VideoTile from "./VideoTile";

export default function ScreenShareView({
	sharer,
	sharerStream,
	localStream,
	myParticipant,
	remoteStreams,
	participants,
	activeSpeaker,
}) {
	const [showThumbs, setShowThumbs] = useState(true);

	//    Zoom + pan state
	const [scale, setScale] = useState(1);
	const [offset, setOffset] = useState({ x: 0, y: 0 });

	const gestureRef = useRef({
		dist: 0,
		x: 0,
		y: 0,
	});
	const lastTapRef = useRef(0);

	//    Touch handlers (pinch + pan)
	const onTouchStart = (e) => {
		if (e.touches.length === 2) {
			const [a, b] = e.touches;
			gestureRef.current.dist = Math.hypot(
				b.clientX - a.clientX,
				b.clientY - a.clientY,
			);
		} else if (e.touches.length === 1) {
			gestureRef.current.x = e.touches[0].clientX;
			gestureRef.current.y = e.touches[0].clientY;
		}
	};

	const onTouchMove = (e) => {
		if (e.touches.length === 2) {
			e.preventDefault();
			const [a, b] = e.touches;
			const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
			const ratio = dist / (gestureRef.current.dist || dist);
			setScale((s) => Math.min(4, Math.max(1, s * ratio)));
			gestureRef.current.dist = dist;
		} else if (e.touches.length === 1 && scale > 1) {
			e.preventDefault();
			const dx = e.touches[0].clientX - gestureRef.current.x;
			const dy = e.touches[0].clientY - gestureRef.current.y;
			setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
			gestureRef.current.x = e.touches[0].clientX;
			gestureRef.current.y = e.touches[0].clientY;
		}
	};

	const onTouchEnd = () => {
		if (scale <= 1) {
			setScale(1);
			setOffset({ x: 0, y: 0 });
		}
	};

	// Double-tap to reset zoom
	const onDoubleTap = () => {
		const now = Date.now();
		if (now - lastTapRef.current < 300) {
			setScale(1);
			setOffset({ x: 0, y: 0 });
		}
		lastTapRef.current = now;
	};

	// Desktop: Ctrl + wheel to zoom (trackpad pinch maps to this)
	const onWheel = (e) => {
		if (!e.ctrlKey) return;
		e.preventDefault();
		const ratio = e.deltaY > 0 ? 0.95 : 1.05;
		setScale((s) => Math.min(4, Math.max(1, s * ratio)));
	};

	//    Thumbnail list (everyone except the sharer)
	const thumbs = [];

	if (!sharer.isSelf) {
		thumbs.push({
			key: "self",
			stream: localStream,
			participant: { ...myParticipant, name: "You" },
			isLocal: true,
			isSpeaking: activeSpeaker === "self",
		});
	}

	participants.forEach((p) => {
		if (p.socketId === sharer.socketId) return;
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
			<div
				className="relative flex-1 overflow-hidden touch-none"
				onTouchStart={onTouchStart}
				onTouchMove={onTouchMove}
				onTouchEnd={onTouchEnd}
				onClick={onDoubleTap}
				onWheel={onWheel}
			>
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
						style={{
							transform: `scale(${scale}) translate(${
								offset.x / scale
							}px, ${offset.y / scale}px)`,
							transition: scale === 1 ? "transform 0.2s ease-out" : "none",
							transformOrigin: "center center",
						}}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-gray-900 text-gray-500">
						Loading screen...
					</div>
				)}

				{/* Overlay badge (top-left) */}
				<div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-white">
					<MonitorUp className="h-3.5 w-3.5" />
					{sharerName} is sharing{sharer.isSelf ? "" : "'s screen"}
					{sharer.role === "HOST" && (
						<Crown className="ml-1 h-3.5 w-3.5 text-amber-200" />
					)}
				</div>

				{/* Hide/Show thumbnails toggle — TOP-RIGHT (fixed for tablet) */}
				{thumbs.length > 0 && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							setShowThumbs((v) => !v);
						}}
						className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-black"
						title={showThumbs ? "Hide participants" : "Show participants"}
					>
						<Users className="h-3.5 w-3.5" />
						{showThumbs ? (
							<>
								Hide <ChevronUp className="h-3.5 w-3.5" />
							</>
						) : (
							<>
								Show ({thumbs.length}) <ChevronDown className="h-3.5 w-3.5" />
							</>
						)}
					</button>
				)}

				{/* Zoom indicator — only shows when zoomed in */}
				{scale > 1 && (
					<div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-semibold text-white">
						{scale.toFixed(1)}x · double-tap to reset
					</div>
				)}
			</div>

			{/* Thumbnail strip — collapsible */}
			{showThumbs && thumbs.length > 0 && (
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
