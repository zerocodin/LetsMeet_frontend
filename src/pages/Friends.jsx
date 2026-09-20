import React, { useEffect, useState, useCallback } from "react";
import {
	Loader2,
	UserPlus,
	Users as UsersIcon,
	Search,
	Check,
	X as XIcon,
	Trash2,
	Mail,
	UserCheck,
	Clock,
} from "lucide-react";
import toast from "react-hot-toast";

import AppLayout from "../components/layout/AppLayout";
import friendsService from "../services/friends.Service";

const TABS = [
	{ key: "friends", label: "Friends", icon: UsersIcon },
	{ key: "requests", label: "Requests", icon: Mail },
	{ key: "add", label: "Add friend", icon: UserPlus },
];

export default function Friends() {
	const [tab, setTab] = useState("friends");

	// Data
	const [friends, setFriends] = useState([]);
	const [incoming, setIncoming] = useState([]);
	const [outgoing, setOutgoing] = useState([]);
	const [loading, setLoading] = useState(true);

	// Badge count for tabs
	const requestCount = incoming.length;

	// Fetch all
	const refresh = useCallback(async () => {
		setLoading(true);
		try {
			const [f, r] = await Promise.all([
				friendsService.getFriends(),
				friendsService.getRequests(),
			]);
			setFriends(f.data || []);
			setIncoming(r.incoming || []);
			setOutgoing(r.outgoing || []);
		} catch (err) {
			toast.error(err.message || "Failed to load friends");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	// Actions
	const handleRespond = async (requestId, action) => {
		try {
			await friendsService.respond(requestId, action);
			toast.success(action === "accept" ? "Friend added" : "Request rejected");
			refresh();
		} catch (err) {
			toast.error(err.message || "Failed to respond");
		}
	};

	const handleRemove = async (friendId) => {
		if (!window.confirm("Remove this friend?")) return;
		try {
			await friendsService.removeFriend(friendId);
			toast.success("Friend removed");
			setFriends((prev) => prev.filter((f) => f._id !== friendId));
		} catch (err) {
			toast.error(err.message || "Failed to remove");
		}
	};

	return (
		<AppLayout className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
			{/* Header */}
			<div className="mb-6">
				<h1 className="text-3xl font-bold text-gray-800">Friends</h1>
				<p className="mt-1 text-sm text-gray-500">
					Manage your connections and invitations
				</p>
			</div>

			{/* Tabs */}
			<div className="mb-5 flex flex-wrap gap-2">
				{TABS.map((t) => {
					const Icon = t.icon;
					const badge =
						t.key === "requests" && requestCount > 0 ? requestCount : null;

					return (
						<button
							key={t.key}
							onClick={() => setTab(t.key)}
							className={`relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
								tab === t.key
									? "bg-[#3e4bc4] text-white shadow-md"
									: "bg-white/60 text-gray-600 hover:bg-white"
							}`}
						>
							<Icon className="h-4 w-4" />
							{t.label}
							{badge && (
								<span className="ml-1 rounded-md bg-red-500 px-1.5 text-[10px] font-bold text-white">
									{badge}
								</span>
							)}
						</button>
					);
				})}
			</div>

			{/* Content */}
			{loading ? (
				<div className="flex justify-center py-20">
					<Loader2 className="h-6 w-6 animate-spin text-[#3e4bc4]" />
				</div>
			) : tab === "friends" ? (
				<FriendsTab friends={friends} onRemove={handleRemove} />
			) : tab === "requests" ? (
				<RequestsTab
					incoming={incoming}
					outgoing={outgoing}
					onRespond={handleRespond}
				/>
			) : (
				<AddTab
					existingFriendIds={friends.map((f) => f._id)}
					onSent={refresh}
				/>
			)}
		</AppLayout>
	);
}

//  Tab: Friends list 
function FriendsTab({ friends, onRemove }) {
	if (friends.length === 0) {
		return (
			<EmptyState
				icon={UsersIcon}
				title="No friends yet"
				subtitle="Add people from the Add friend tab to start connecting."
			/>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
			{friends.map((f) => (
				<FriendCard key={f._id} friend={f} onRemove={onRemove} />
			))}
		</div>
	);
}

function FriendCard({ friend, onRemove }) {
	const initials = (friend.name || "U").charAt(0).toUpperCase();
	const since = friend.friendsSince
		? new Date(friend.friendsSince).toLocaleDateString(undefined, {
				month: "short",
				year: "numeric",
		  })
		: null;

	return (
		<div className="group rounded-2xl border border-white/60 bg-white/70 p-5 shadow-md backdrop-blur-lg transition-all hover:-translate-y-0.5 hover:shadow-lg">
			<div className="flex items-start gap-3">
				{friend.profileImage ? (
					<img
						src={friend.profileImage}
						alt={friend.name}
						className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow"
					/>
				) : (
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-base font-bold text-white shadow">
						{initials}
					</div>
				)}

				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-bold text-gray-800">
						{friend.name || "User"}
					</p>
					<p className="truncate text-xs text-gray-500">
						@{friend.username || "user"}
					</p>
					{friend.profession && (
						<p className="mt-1 truncate text-xs text-gray-500">
							{friend.profession}
						</p>
					)}
				</div>
			</div>

			{since && (
				<p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
					<UserCheck className="h-3 w-3" />
					Friends since {since}
				</p>
			)}

			<div className="mt-4 flex items-center gap-2">
				<button className="flex-1 rounded-lg bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.02]">
					Message
				</button>
				<button
					onClick={() => onRemove(friend._id)}
					className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
					title="Remove friend"
				>
					<Trash2 className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}

//  Tab: Requests 
function RequestsTab({ incoming, outgoing, onRespond }) {
	if (incoming.length === 0 && outgoing.length === 0) {
		return (
			<EmptyState
				icon={Mail}
				title="No pending requests"
				subtitle="When someone sends you a friend request, it will appear here."
			/>
		);
	}

	return (
		<div className="space-y-6">
			{/* Incoming */}
			{incoming.length > 0 && (
				<section>
					<h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">
						<Mail className="h-4 w-4" />
						Incoming ({incoming.length})
					</h3>
					<div className="space-y-2">
						{incoming.map((r) => (
							<RequestRow
								key={r._id}
								request={r}
								user={r.from}
								type="incoming"
								onAccept={() => onRespond(r._id, "accept")}
								onReject={() => onRespond(r._id, "reject")}
							/>
						))}
					</div>
				</section>
			)}

			{/* Outgoing */}
			{outgoing.length > 0 && (
				<section>
					<h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">
						<Clock className="h-4 w-4" />
						Sent ({outgoing.length})
					</h3>
					<div className="space-y-2">
						{outgoing.map((r) => (
							<RequestRow
								key={r._id}
								request={r}
								user={r.to}
								type="outgoing"
							/>
						))}
					</div>
				</section>
			)}
		</div>
	);
}

function RequestRow({ request, user, type, onAccept, onReject }) {
	const initials = (user?.name || "U").charAt(0).toUpperCase();

	return (
		<div className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/70 p-3 shadow-sm backdrop-blur">
			{user?.profileImage ? (
				<img
					src={user.profileImage}
					alt={user.name}
					className="h-10 w-10 rounded-full object-cover"
				/>
			) : (
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-sm font-bold text-white">
					{initials}
				</div>
			)}

			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium text-gray-800">
					{user?.name || "User"}
				</p>
				<p className="truncate text-xs text-gray-500">
					@{user?.username || "user"}
				</p>
				{request.message && (
					<p className="mt-1 truncate text-xs italic text-gray-500">
						"{request.message}"
					</p>
				)}
			</div>

			{type === "incoming" ? (
				<div className="flex items-center gap-2">
					<button
						onClick={onAccept}
						className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
					>
						<Check className="h-3 w-3" />
						Accept
					</button>
					<button
						onClick={onReject}
						className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
					>
						<XIcon className="h-3 w-3" />
						Reject
					</button>
				</div>
			) : (
				<span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
					Pending
				</span>
			)}
		</div>
	);
}

//  Tab: Add friend 
function AddTab({ existingFriendIds, onSent }) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState([]);
	const [searching, setSearching] = useState(false);
	const [sendingTo, setSendingTo] = useState(null);

	// Debounced search
	useEffect(() => {
		const q = query.trim();

		if (!q) {
			setResults([]);
			return;
		}

		setSearching(true);
		const id = setTimeout(async () => {
			try {
				const res = await friendsService.searchUsers(q);
				setResults(res.data || []);
			} catch (err) {
				// silent fail during typing
			} finally {
				setSearching(false);
			}
		}, 400);

		return () => clearTimeout(id);
	}, [query]);

	const handleSend = async (user) => {
		setSendingTo(user._id);
		try {
			await friendsService.sendRequest(user.username);
			toast.success(`Request sent to ${user.name}`);
			// Remove from results
			setResults((prev) => prev.filter((u) => u._id !== user._id));
			onSent?.();
		} catch (err) {
			toast.error(err.message || "Failed to send");
		} finally {
			setSendingTo(null);
		}
	};

	return (
		<div className="mx-auto max-w-2xl">
			{/* Search box */}
			<div className="mb-5 flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur focus-within:border-[#3e4bc4] focus-within:ring-2 focus-within:ring-[#3e4bc4]/20">
				<Search className="h-4 w-4 text-gray-400" />
				<input
					autoFocus
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search by name, username or email..."
					className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
				/>
				{searching && (
					<Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
				)}
			</div>

			{/* Results */}
			{!query.trim() ? (
				<EmptyState
					icon={UserPlus}
					title="Find people to add"
					subtitle="Type a name, username or email to search."
				/>
			) : results.length === 0 && !searching ? (
				<EmptyState
					icon={Search}
					title="No users found"
					subtitle={`No one matches "${query}"`}
				/>
			) : (
				<ul className="space-y-2">
					{results.map((u) => {
						const isFriend = existingFriendIds.includes(u._id);
						const isSending = sendingTo === u._id;

						return (
							<li
								key={u._id}
								className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/70 p-3 shadow-sm backdrop-blur"
							>
								{u.profileImage ? (
									<img
										src={u.profileImage}
										alt={u.name}
										className="h-10 w-10 rounded-full object-cover"
									/>
								) : (
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-sm font-bold text-white">
										{(u.name || "U").charAt(0).toUpperCase()}
									</div>
								)}

								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-gray-800">
										{u.name}
									</p>
									<p className="truncate text-xs text-gray-500">
										@{u.username}
									</p>
								</div>

								{isFriend ? (
									<span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">
										Already friends
									</span>
								) : (
									<button
										onClick={() => handleSend(u)}
										disabled={isSending}
										className="flex items-center gap-1.5 rounded-lg bg-[#3e4bc4] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3540a8] disabled:opacity-60"
									>
										{isSending ? (
											<>
												<Loader2 className="h-3 w-3 animate-spin" />
												Sending
											</>
										) : (
											<>
												<UserPlus className="h-3 w-3" />
												Add
											</>
										)}
									</button>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}

//  Empty state 
function EmptyState({ icon: Icon, title, subtitle }) {
	return (
		<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/50 py-16 text-center backdrop-blur">
			<div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
				<Icon className="h-6 w-6 text-[#3e4bc4]" />
			</div>
			<h3 className="text-base font-bold text-gray-800">{title}</h3>
			<p className="mt-1 max-w-xs text-sm text-gray-500">{subtitle}</p>
		</div>
	);
}