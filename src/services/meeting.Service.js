import axios from "axios";
import { meetingURL } from "../api/urlEndPoint";

const api = axios.create({
	baseURL: meetingURL,
	withCredentials: true,
});

const meetingService = {
	// Create a meeting
	createMeeting: async ({
		title,
		description,
		scheduledAt,
		duration,
		isPrivate,
		password,
		maxParticipants,
		waitingRoomEnabled,
		allowEarlyJoin,
	}) => {
		try {
			const { data } = await api.post("/", {
				title,
				description,
				scheduledAt,
				duration,
				isPrivate,
				password,
				maxParticipants,
				waitingRoomEnabled,
				allowEarlyJoin,
			});
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to create meeting" };
		}
	},

	// Join by code or meetingId
	joinMeeting: async ({ meetingCode, meetingId, password }) => {
		try {
			const { data } = await api.post("/join", {
				meetingCode,
				meetingId,
				password,
			});
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to join meeting" };
		}
	},

	// Poll status (waiting room)
	getMeetingStatus: async (meetingCode) => {
		try {
			const { data } = await api.get(`/${meetingCode}/status`);
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch status" };
		}
	},

	// My meetings (dashboard)
	getMyMeetings: async ({ status, page = 1, limit = 10 } = {}) => {
		try {
			const params = { page, limit };
			if (status) params.status = status;

			const { data } = await api.get("/my-meetings", { params });
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch meetings" };
		}
	},

	// Single meeting details
	getMeetingById: async (meetingId) => {
		try {
			const { data } = await api.get(`/${meetingId}`);
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch meeting" };
		}
	},

	// Update meeting (host)
	updateMeeting: async (meetingId, updates) => {
		try {
			const { data } = await api.patch(`/${meetingId}`, updates);
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to update meeting" };
		}
	},

	// Cancel meeting (host)
	cancelMeeting: async (meetingId) => {
		try {
			const { data } = await api.delete(`/${meetingId}`);
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to cancel meeting" };
		}
	},

	// Update my media state (persist to DB)
	updateMyState: async (meetingId, { isMuted, isCameraOff, isScreenSharing }) => {
		try {
			const { data } = await api.patch(`/${meetingId}/me/state`, {
				isMuted,
				isCameraOff,
				isScreenSharing,
			});
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to update state" };
		}
	},

	// Leave meeting
	leaveMeeting: async (meetingId) => {
		try {
			const { data } = await api.post(`/${meetingId}/leave`);
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to leave meeting" };
		}
	},

	// Participants list
	getParticipants: async (meetingId) => {
		try {
			const { data } = await api.get(`/${meetingId}/participants`);
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch participants" };
		}
	},

	// Host: mute / unmute participant 
	muteParticipant: async (meetingId, participantId) => {
		try {
			const { data } = await api.patch(
				`/${meetingId}/participants/${participantId}/mute`
			);
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to mute participant" };
		}
	},

	unmuteParticipant: async (meetingId, participantId) => {
		try {
			const { data } = await api.patch(
				`/${meetingId}/participants/${participantId}/unmute`
			);
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to unmute participant" };
		}
	},

	// Host: remove participant 
	removeParticipant: async (meetingId, participantId) => {
		try {
			const { data } = await api.delete(
				`/${meetingId}/participants/${participantId}`
			);
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to remove participant" };
		}
	},

	//  Host: promote / demote co-host
	promoteToCohost: async (meetingId, participantId) => {
		try {
			const { data } = await api.patch(
				`/${meetingId}/participants/${participantId}/promote`
			);
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to promote participant" };
		}
	},

	demoteFromCohost: async (meetingId, participantId) => {
		try {
			const { data } = await api.patch(
				`/${meetingId}/participants/${participantId}/demote`
			);
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to demote participant" };
		}
	},
};

export default meetingService;