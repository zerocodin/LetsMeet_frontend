import React, { useEffect, useRef, useState } from "react";
import { Send, MessageSquare, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../hooks/useChat";
import { useMeeting } from "../../context/MeetingContext";

export default function ChatPanel({ meetingId }) {
	const { user } = useAuth();
	const { myParticipant } = useMeeting();

	const {
		messages,
		loading,
		hasMore,
		loadingMore,
		loadMore,
		sendMessage,
		deleteMessage,
		openPanel,
	} = useChat(meetingId);

	const [draft, setDraft] = useState("");
	const scrollRef = useRef(null);
	const inputRef = useRef(null);
	const stickToBottomRef = useRef(true);

	const isHost = myParticipant?.role === "HOST";

	// Mark panel open (resets unread) + focus input
	useEffect(() => {
		openPanel();
		inputRef.current?.focus();
	}, [openPanel]);

	// Auto-scroll when new messages arrive
	useEffect(() => {
		if (!stickToBottomRef.current) return;
		const el = scrollRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [messages.length]);

	// Detect if user scrolled up (so we don't force-scroll)
	const handleScroll = () => {
		const el = scrollRef.current;
		if (!el) return;
		const distanceFromBottom =
			el.scrollHeight - el.scrollTop - el.clientHeight;
		stickToBottomRef.current = distanceFromBottom < 80;
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!draft.trim()) return;
		sendMessage(draft);
		setDraft("");
		stickToBottomRef.current = true; // force scroll after sending
	};

	// Group consecutive messages by date
	const grouped = groupByDate(messages);

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
				<h3 className="flex items-center gap-2 text-sm font-semibold text-white">
					<MessageSquare className="h-4 w-4" />
					Chat
				</h3>
				<span className="text-xs text-gray-500">{messages.length}</span>
			</div>

			{/* Message list */}
			<div
				ref={scrollRef}
				onScroll={handleScroll}
				className="flex-1 overflow-y-auto p-3"
			>
				{/* Load older */}
				{hasMore && (
					<div className="mb-3 flex justify-center">
						<button
							onClick={loadMore}
							disabled={loadingMore}
							className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 disabled:opacity-50"
						>
							{loadingMore ? (
								<>
									<Loader2 className="h-3 w-3 animate-spin" />
									Loading...
								</>
							) : (
								"Load older messages"
							)}
						</button>
					</div>
				)}

				{/* Initial load */}
				{loading ? (
					<div className="flex h-full items-center justify-center">
						<Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
					</div>
				) : messages.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
						<MessageSquare className="h-8 w-8 text-gray-700" />
						<p className="text-sm font-medium text-gray-400">
							No messages yet
						</p>
						<p className="text-xs text-gray-600">
							Say hi to everyone in the meeting
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{grouped.map(({ date, items }) => (
							<div key={date}>
								{/* Date separator */}
								<div className="mb-3 flex items-center gap-2">
									<div className="h-px flex-1 bg-white/10" />
									<span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
										{formatDateLabel(date)}
									</span>
									<div className="h-px flex-1 bg-white/10" />
								</div>

								{/* Messages for this date */}
								<div className="space-y-3">
									{items.map((msg) => {
										const isMine = msg.from?.userId === user?._id;
										const canDelete = isMine || isHost;

										return (
											<ChatMessage
												key={msg._id}
												message={msg}
												isMine={isMine}
												canDelete={canDelete}
												onDelete={() => deleteMessage(msg._id)}
											/>
										);
									})}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Input */}
			<form onSubmit={handleSubmit} className="border-t border-white/5 p-3">
				<div className="flex items-end gap-2 rounded-xl bg-white/5 p-2">
					<textarea
						ref={inputRef}
						rows={1}
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								handleSubmit(e);
							}
						}}
						placeholder="Type a message..."
						maxLength={1000}
						className="max-h-24 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-white outline-none placeholder:text-gray-500"
					/>
					<button
						type="submit"
						disabled={!draft.trim()}
						className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
					>
						<Send className="h-4 w-4" />
					</button>
				</div>
				<p className="mt-1 text-[10px] text-gray-600">
					Enter to send · Shift+Enter for newline
				</p>
			</form>
		</div>
	);
}

// Single message bubble 
function ChatMessage({ message, isMine, canDelete, onDelete }) {
	const time = new Date(message.sentAt).toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
	});

	// System message (not used yet, but styled for future)
	if (message.type === "SYSTEM") {
		return (
			<div className="flex justify-center">
				<span className="rounded-full bg-white/5 px-3 py-1 text-[10px] text-gray-400">
					{message.message}
				</span>
			</div>
		);
	}

	if (isMine) {
		return (
			<div className="group flex flex-col items-end">
				<div className="flex items-end gap-1.5">
					{canDelete && (
						<button
							onClick={onDelete}
							className="mb-1 rounded p-0.5 text-gray-500 opacity-0 transition-opacity hover:bg-white/10 hover:text-red-400 group-hover:opacity-100"
							title="Delete message"
						>
							<Trash2 className="h-3 w-3" />
						</button>
					)}
					<div className="max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-500 px-3 py-2 text-sm text-white">
						{message.message}
					</div>
				</div>
				<p className="mt-0.5 text-[10px] text-gray-500">You · {time}</p>
			</div>
		);
	}

	return (
		<div className="group flex flex-col items-start">
			<div className="mb-0.5 flex items-center gap-1.5">
				{message.from?.profileImage ? (
					<img
						src={message.from.profileImage}
						alt={message.from.name}
						className="h-4 w-4 rounded-full object-cover"
					/>
				) : (
					<div className="flex h-4 w-4 items-center justify-center rounded-full bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-[8px] font-bold text-white">
						{(message.from?.name || "?").charAt(0).toUpperCase()}
					</div>
				)}
				<span className="text-[11px] font-medium text-gray-400">
					{message.from?.name || "Guest"}
				</span>
			</div>
			<div className="flex items-end gap-1.5">
				<div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white/10 px-3 py-2 text-sm text-white">
					{message.message}
				</div>
				{canDelete && (
					<button
						onClick={onDelete}
						className="mb-1 rounded p-0.5 text-gray-500 opacity-0 transition-opacity hover:bg-white/10 hover:text-red-400 group-hover:opacity-100"
						title="Delete message"
					>
						<Trash2 className="h-3 w-3" />
					</button>
				)}
			</div>
			<p className="mt-0.5 text-[10px] text-gray-500">{time}</p>
		</div>
	);
}

// Helpers
function groupByDate(messages) {
	const groups = new Map();

	messages.forEach((m) => {
		const date = new Date(m.sentAt).toDateString();
		if (!groups.has(date)) groups.set(date, []);
		groups.get(date).push(m);
	});

	return Array.from(groups.entries()).map(([date, items]) => ({
		date,
		items,
	}));
}

function formatDateLabel(dateStr) {
	const date = new Date(dateStr);
	const today = new Date();
	const yesterday = new Date();
	yesterday.setDate(today.getDate() - 1);

	if (date.toDateString() === today.toDateString()) return "Today";
	if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
	});
}