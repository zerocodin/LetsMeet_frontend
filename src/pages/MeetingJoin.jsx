import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { useMeeting } from "../context/MeetingContext";
import JoinPasswordPrompt from "../components/meeting/JoinPasswordPrompt";
import WaitingRoom from "../components/meeting/WaitingRoom";
import JoinError from "../components/meeting/JoinError";
import meetingService from "../services/meeting.Service";

/**
 * Route: /meeting/:meetingCode
 */
export default function MeetingJoin() {
	const { user } = useAuth();

	const { meetingCode } = useParams();
	const navigate = useNavigate();
	const { joinByCode } = useMeeting();

	// view: "loading" | "password" | "waiting" | "error"
	const [view, setView] = useState("loading");
	const [meeting, setMeeting] = useState(null);
	const [startsIn, setStartsIn] = useState(0);
	const [error, setError] = useState(null); // { code, message }
	const [submitting, setSubmitting] = useState(false);

	// Prevent double-attempt on React strict-mode double-mount
	const attemptedRef = useRef(false);

	//  Classify server errors into UI-friendly codes
	const classifyError = (err) => {
		const msg = err?.message || "";
		if (/not found/i.test(msg)) return { code: "NOT_FOUND", message: msg };
		if (/cancelled/i.test(msg)) return { code: "CANCELLED", message: msg };
		if (/ended|completed/i.test(msg))
			return { code: "COMPLETED", message: msg };
		if (/private|invited/i.test(msg)) return { code: "PRIVATE", message: msg };
		if (/full/i.test(msg)) return { code: "FULL", message: msg };
		return { code: "UNKNOWN", message: msg || "Failed to join meeting" };
	};

	// Attempt to join
	const attemptJoin = useCallback(
		async (password) => {
			setSubmitting(true);
			try {
				const res = await joinByCode({ meetingCode, password });

				if (res.status === "JOINED") {
					// Success → MeetingContext has state set; navigate to room
					navigate(`/room/${res.data.meeting._id}`, { replace: true });
					return;
				}

				if (res.status === "WAITING") {
					setMeeting(res.data.meeting);
					setStartsIn(res.data.startsIn ?? 0);
					setView("waiting");
					return;
				}

				// Any other status → treat as error
				setError({ code: "UNKNOWN", message: "Unexpected server response" });
				setView("error");
			} catch (err) {
				// Password required?
				if (err?.requiresPassword) {
					setMeeting(err.meeting || meeting);
					setError({ code: "PASSWORD", message: err.message });
					setView("password");
					return;
				}

				// General error
				setError(classifyError(err));
				setView("error");
			} finally {
				setSubmitting(false);
			}
		},
		[meetingCode, joinByCode, navigate, meeting],
	);

	// Initial attempt on mount
	useEffect(() => {
		if (attemptedRef.current) return;
		attemptedRef.current = true;
		attemptJoin();
	}, [attemptJoin]);

	// Handlers
	const handlePasswordSubmit = async (password) => {
		setSubmitting(true);
		try {
			const res = await joinByCode({ meetingCode, password });

			if (res.status === "JOINED") {
				navigate(`/room/${res.data.meeting._id}`, { replace: true });
			} else if (res.status === "WAITING") {
				setMeeting(res.data.meeting);
				setStartsIn(res.data.startsIn ?? 0);
				setView("waiting");
			}
		} catch (err) {
			setError({
				code: "PASSWORD",
				message: err.message || "Incorrect password",
			});
		} finally {
			setSubmitting(false);
		}
	};

	const handleWaitRetry = async () => {
		setSubmitting(true);
		try {
			const res = await joinByCode({ meetingCode });
			if (res.status === "JOINED") {
				navigate(`/room/${res.data.meeting._id}`, { replace: true });
			} else if (res.status === "WAITING") {
				setStartsIn(res.data.startsIn ?? 0);
			}
		} catch (err) {
			// If it now requires password, fall back
			if (err?.requiresPassword) {
				setView("password");
			} else {
				setError(classifyError(err));
				setView("error");
			}
		} finally {
			setSubmitting(false);
		}
	};

	const handleStartNow = async () => {
		setSubmitting(true);
		try {
			const meetingId = meeting?._id;
			if (!meetingId) throw new Error("Meeting ID missing");

			await meetingService.startNow(meetingId);
			toast.success("Meeting started");

			// Immediately attempt to join (bypasses waiting now)
			const res = await joinByCode({ meetingCode });
			if (res.status === "JOINED") {
				navigate(`/room/${res.data.meeting._id}`, { replace: true });
			} else {
				setStartsIn(res.data.startsIn ?? 0);
			}
		} catch (err) {
			toast.error(err.message || "Failed to start meeting");
		} finally {
			setSubmitting(false);
		}
	};

	// Render
	if (view === "loading") {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
				<Loader2 className="h-6 w-6 animate-spin text-[#3e4bc4]" />
				<p className="text-sm text-gray-500">Joining meeting...</p>
			</div>
		);
	}

	if (view === "password") {
		return (
			<JoinPasswordPrompt
				meeting={{ meetingCode, title: null }}
				loading={submitting}
				error={error?.message}
				onSubmit={handlePasswordSubmit}
				onBack={() => navigate("/home")}
			/>
		);
	}

	if (view === "waiting") {
		const isHost =
			meeting?.host && user?._id && String(meeting.host) === String(user._id);

		return (
			<WaitingRoom
				meeting={meeting}
				startsIn={startsIn}
				retrying={submitting}
				onRetry={handleWaitRetry}
				onBack={() => navigate("/home")}
				isHost={isHost}
				onStartNow={handleStartNow}
			/>
		);
	}

	if (view === "error") {
		return <JoinError code={error?.code} message={error?.message} />;
	}

	return null;
}
