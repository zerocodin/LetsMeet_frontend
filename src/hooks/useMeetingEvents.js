import { useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { getSocket, connectSocket } from "../lib/socket";
import { useMeeting } from "../context/MeetingContext";

/**
 * Listens for socket events targeted at the current user:
 *  - force-muted : host muted me → disable my mic
 *  - kicked      : host removed me → leave room
 *  - meeting-ended : host ended meeting → leave room
 *
 * Must be used inside MeetingRoom (needs MeetingContext access).
 */
export const useMeetingEvents = () => {
	const {
		isMuted,
		toggleMute,
		handleRemoteEnd,
	} = useMeeting();

	// Use a ref so the listener doesn't need to be re-bound when isMuted changes
	const isMutedRef = { current: isMuted };
	isMutedRef.current = isMuted;

	useEffect(() => {
		const socket = connectSocket();
		if (!socket) return;

		// Host force-muted us
		const onForceMuted = () => {
			// Only flip if we're not already muted (avoids double toasts)
			if (!isMutedRef.current) {
				toggleMute();  // this flips local track + broadcasts back + persists
			}
			toast("Host muted you", { icon: "🔇", duration: 2500 });
		};

		// Host kicked us 
		const onKicked = () => {
			toast.error("You were removed from the meeting");
			handleRemoteEnd();  // navigates home + cleans up
		};

		// Host ended the meeting
		const onMeetingEnded = () => {
			toast("Host ended the meeting", { icon: "📞" });
			handleRemoteEnd();
		};

		socket.on("force-muted", onForceMuted);
		socket.on("kicked", onKicked);
		socket.on("meeting-ended", onMeetingEnded);

		return () => {
			socket.off("force-muted", onForceMuted);
			socket.off("kicked", onKicked);
			socket.off("meeting-ended", onMeetingEnded);
		};
	}, [toggleMute, handleRemoteEnd]);
};