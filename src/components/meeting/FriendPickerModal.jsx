import React, { useEffect, useState, useMemo } from "react";
import {
	Loader2,
	Search,
	UserPlus,
	Check,
	Users as UsersIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import Modal from "../ui/Modal";
import friendsService from "../../services/friends.Service";

/**
 * Pure friend selection modal — does NOT call any meeting API.
 * Parent decides what to do with the selected IDs.
 *
 * @param {boolean}         open
 * @param {Function}        onClose
 * @param {Set|Array}       initialSelected — pre-selected friend IDs
 * @param {Function}        onConfirm       — (selectedIdsArray) => void
 * @param {string}          [title]
 * @param {string}          [confirmLabel]
 */
export default function FriendPickerModal({
	open,
	onClose,
	initialSelected = [],
	onConfirm,
	title = "Invite friends",
	confirmLabel = "Confirm",
}) {
	const [friends, setFriends] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selected, setSelected] = useState(new Set(initialSelected));
	const [search, setSearch] = useState("");

	// Load friends list on open
	useEffect(() => {
		if (!open) return;

		let cancelled = false;
		setLoading(true);
		setSearch("");
		// Reset selection to whatever the parent gave us
		setSelected(new Set(initialSelected));

		friendsService
			.getFriends()
			.then((res) => {
				if (!cancelled) setFriends(res.data || []);
			})
			.catch((err) => {
				if (!cancelled) toast.error(err.message || "Failed to load friends");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	// Search filter
	const filtered = useMemo(() => {
		if (!search.trim()) return friends;
		const q = search.toLowerCase();
		return friends.filter(
			(f) =>
				f.name?.toLowerCase().includes(q) ||
				f.username?.toLowerCase().includes(q) ||
				f.email?.toLowerCase().includes(q)
		);
	}, [friends, search]);

	const toggle = (id) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const selectAll = () => setSelected(new Set(filtered.map((f) => f._id)));
	const clearAll = () => setSelected(new Set());

	const handleConfirm = () => {
		onConfirm?.([...selected]);
		onClose?.();
	};

	return (
		<Modal open={open} onClose={onClose} title={title} maxWidth="max-w-lg">
			<div className="space-y-4">
				{/* Search + select all */}
				<div className="flex items-center gap-2">
					<div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 focus-within:border-[#3e4bc4] focus-within:ring-2 focus-within:ring-[#3e4bc4]/20">
						<Search className="h-3.5 w-3.5 text-gray-400" />
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search friends..."
							className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
						/>
					</div>

					{filtered.length > 0 && (
						<button
							onClick={
								selected.size === filtered.length ? clearAll : selectAll
							}
							className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
						>
							{selected.size === filtered.length ? "Clear" : "Select all"}
						</button>
					)}
				</div>

				{/* Body */}
				{loading ? (
					<div className="flex justify-center py-10">
						<Loader2 className="h-5 w-5 animate-spin text-[#3e4bc4]" />
					</div>
				) : friends.length === 0 ? (
					<EmptyState
						icon={UsersIcon}
						title="No friends yet"
						subtitle="Add friends first from the Friends page."
					/>
				) : filtered.length === 0 ? (
					<EmptyState
						icon={Search}
						title="No matches"
						subtitle={`No friends match "${search}".`}
					/>
				) : (
					<ul className="max-h-80 space-y-1 overflow-y-auto pr-1">
						{filtered.map((f) => {
							const checked = selected.has(f._id);
							return (
								<li key={f._id}>
									<button
										type="button"
										onClick={() => toggle(f._id)}
										className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
											checked
												? "border-[#3e4bc4] bg-[#3e4bc4]/5"
												: "border-gray-100 bg-white hover:bg-gray-50"
										}`}
									>
										{f.profileImage ? (
											<img
												src={f.profileImage}
												alt={f.name}
												className="h-9 w-9 rounded-full object-cover"
											/>
										) : (
											<div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-xs font-bold text-white">
												{(f.name || "U").charAt(0).toUpperCase()}
											</div>
										)}

										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium text-gray-800">
												{f.name}
											</p>
											<p className="truncate text-xs text-gray-500">
												@{f.username}
											</p>
										</div>

										<div
											className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
												checked
													? "border-[#3e4bc4] bg-[#3e4bc4]"
													: "border-gray-300 bg-white"
											}`}
										>
											{checked && <Check className="h-3 w-3 text-white" />}
										</div>
									</button>
								</li>
							);
						})}
					</ul>
				)}

				{/* Footer */}
				<div className="flex items-center justify-between border-t border-gray-100 pt-4">
					<p className="text-xs text-gray-500">
						{selected.size > 0
							? `${selected.size} selected`
							: `${friends.length} available`}
					</p>

					<div className="flex gap-2">
						<button
							onClick={onClose}
							className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
						>
							Cancel
						</button>
						<button
							onClick={handleConfirm}
							disabled={selected.size === 0}
							className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
						>
							<UserPlus className="h-4 w-4" />
							{confirmLabel}
							{selected.size > 0 ? ` (${selected.size})` : ""}
						</button>
					</div>
				</div>
			</div>
		</Modal>
	);
}

function EmptyState({ icon: Icon, title, subtitle }) {
	return (
		<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10 text-center">
			<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
				<Icon className="h-5 w-5 text-[#3e4bc4]" />
			</div>
			<h3 className="text-sm font-bold text-gray-800">{title}</h3>
			<p className="mt-1 max-w-xs text-xs text-gray-500">{subtitle}</p>
		</div>
	);
}