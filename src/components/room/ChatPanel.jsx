import React, { useEffect, useRef, useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../hooks/useChat";

export default function ChatPanel({ meetingId }) {
	const { user } = useAuth();
	const { messages, sendMessage, openPanel } = useChat(meetingId);

	const [draft, setDraft] = useState("");
	const scrollRef = useRef(null);
	const inputRef = useRef(null);

	// Mark panel open (resets unread count) + focus input
	useEffect(() => {
		openPanel();
		inputRef.current?.focus();
	}, [openPanel]);

	// Auto-scroll to bottom on new message
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [messages.length]);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!draft.trim()) return;
		sendMessage(draft);
		setDraft("");
	};

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
				className="flex-1 overflow-y-auto p-3"
			>
				{messages.length === 0 ? (
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
					<div className="space-y-3">
						{messages.map((msg) => {
							const isMine = msg.from?.userId === user?._id;
							return (
								<ChatMessage key={msg._id} message={msg} isMine={isMine} />
							);
						})}
					</div>
				)}
			</div>

			{/* Input */}
			<form
				onSubmit={handleSubmit}
				className="border-t border-white/5 p-3"
			>
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
						maxLength={500}
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
function ChatMessage({ message, isMine }) {
	const time = new Date(message.sentAt).toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
	});

	if (isMine) {
		return (
			<div className="flex flex-col items-end">
				<div className="max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-500 px-3 py-2 text-sm text-white">
					{message.message}
				</div>
				<p className="mt-0.5 text-[10px] text-gray-500">You · {time}</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-start">
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
			<div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white/10 px-3 py-2 text-sm text-white">
				{message.message}
			</div>
			<p className="mt-0.5 text-[10px] text-gray-500">{time}</p>
		</div>
	);
}