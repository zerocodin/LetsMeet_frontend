import React, { useState } from "react";
import { Video, CalendarPlus } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import CreateMeetingForm from "./CreateMeetingForm";
import CredentialsCard from "./CredentialsCard";
import FriendPickerModal from "./FriendPickerModal";
import { useMeeting } from "../../context/MeetingContext";
import meetingService from "../../services/meeting.Service";

export default function CreateMeetingModal({ open, onClose, initialMode }) {
	const [step, setStep] = useState(initialMode || "pick");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [credentials, setCredentials] = useState(null);

	// pending friend picks (pre-create)
	const [invitedFriends, setInvitedFriends] = useState([]);
	const [pickerOpen, setPickerOpen] = useState(false);

	//    post-create invite picker
	const [postCreatePickerOpen, setPostCreatePickerOpen] = useState(false);

	const { createMeeting } = useMeeting();

	const reset = () => {
		setStep(initialMode || "pick");
		setCredentials(null);
		setIsSubmitting(false);
		setInvitedFriends([]);
		setPickerOpen(false);
		setPostCreatePickerOpen(false);
	};

	const handleClose = () => {
		if (isSubmitting) return;
		reset();
		onClose?.();
	};

	const handleSubmit = async (payload) => {
		setIsSubmitting(true);
		try {
			//  The payload now includes `invitedUsers: [...ids]`
			const res = await createMeeting(payload);
			setCredentials({
				...res.data,
				title: payload.title,
				scheduledAt: payload.scheduledAt,
			});
			setStep("done");
		} catch (err) {
			toast.error(err.message || "Failed to create meeting");
		} finally {
			setIsSubmitting(false);
		}
	};

	//  Post-create: invite the selected friends to the newly created meeting
	const handlePostCreateInvite = async (selectedIds) => {
		if (!credentials?.meetingId && !credentials?.id) {
			// Fallback: we don't know the meeting ID from the create response.
			// We need the backend to return `_id`. See note below.
			toast.error("Meeting ID not available");
			return;
		}

		const meetingId = credentials.meetingId || credentials.id;
		try {
			const res = await meetingService.inviteUsers(meetingId, selectedIds);
			toast.success(res.message || "Invitations sent");
		} catch (err) {
			toast.error(err.message || "Failed to send invites");
		}
	};

	const titles = {
		pick: "Create a meeting",
		now: "Start an instant meeting",
		schedule: "Schedule a meeting",
		done: "Meeting ready to share",
	};

	return (
		<>
			<Modal
				open={open}
				onClose={handleClose}
				title={titles[step]}
				maxWidth="max-w-md"
			>
				{/* Step: pick mode */}
				{step === "pick" && (
					<div className="space-y-3">
						<button
							onClick={() => setStep("now")}
							className="flex w-full items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 text-left transition-all hover:border-[#3e4bc4]/30 hover:bg-[#3e4bc4]/5"
						>
							<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-white">
								<Video className="h-5 w-5" />
							</div>
							<div>
								<p className="text-sm font-semibold text-gray-800">Start now</p>
								<p className="text-xs text-gray-500">
									Jump straight into a meeting
								</p>
							</div>
						</button>

						<button
							onClick={() => setStep("schedule")}
							className="flex w-full items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 text-left transition-all hover:border-[#3e4bc4]/30 hover:bg-[#3e4bc4]/5"
						>
							<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 text-white">
								<CalendarPlus className="h-5 w-5" />
							</div>
							<div>
								<p className="text-sm font-semibold text-gray-800">
									Schedule for later
								</p>
								<p className="text-xs text-gray-500">
									Pick a date, time, and duration
								</p>
							</div>
						</button>
					</div>
				)}

				{/* Step: instant */}
				{step === "now" && (
					<CreateMeetingForm
						mode="now"
						isSubmitting={isSubmitting}
						onSubmit={handleSubmit}
					/>
				)}

				{/* Step: schedule */}
				{step === "schedule" && (
					<CreateMeetingForm
						mode="schedule"
						isSubmitting={isSubmitting}
						onSubmit={handleSubmit}
						invitedFriends={invitedFriends}
						onOpenFriendPicker={() => setPickerOpen(true)}
					/>
				)}

				{/* Step: credentials */}
				{step === "done" && credentials && (
					<CredentialsCard
						credentials={credentials}
						onClose={handleClose}
						onInviteNow={() => setPostCreatePickerOpen(true)}
					/>
				)}
			</Modal>

			
		</>
	);
}
