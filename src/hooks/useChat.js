import { useMeeting } from "../context/MeetingContext";

/**
 * The real chat state lives in MeetingContext.
 */
export const useChat = (_meetingId) => {
	const {
		messages,
		chatLoading,
		chatHasMore,
		chatLoadingMore,
		unreadChatCount,
		isChatPanelOpen,
		loadOlderMessages,
		sendChatMessage,
		deleteChatMessageById,
		openChatPanel,
		closeChatPanel,
	} = useMeeting();

	return {
		messages,
		loading: chatLoading,
		hasMore: chatHasMore,
		loadingMore: chatLoadingMore,
		unreadCount: unreadChatCount,
		isPanelOpen: isChatPanelOpen,
		loadMore: loadOlderMessages,
		sendMessage: sendChatMessage,
		deleteMessage: deleteChatMessageById,
		openPanel: openChatPanel,
		closePanel: closeChatPanel,
	};
};