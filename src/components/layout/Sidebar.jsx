import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
	Home,
	User,
	Settings,
	LogOut,
	Users,
	Bell,
	UserGroup,
	Menu,
	X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useFriendsBadge } from "../../hooks/useFriendsBadge";
import { useNotifications } from "../../context/NotificationContext";

const links = [
	{ to: "/", label: "Home", icon: Home, end: true },
	{ to: "/meet", label: "Meet", icon: UserGroup },
	{ to: "/friends", label: "Friends", icon: Users },
	{ to: "/notifications", label: "Notifications", icon: Bell },
	{ to: "/profile", label: "Profile", icon: User },
	{ to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
	const navigate = useNavigate();
	const location = useLocation();
	const { user, logout } = useAuth();

	const { pendingCount } = useFriendsBadge();
	const { unreadCount: unreadNotifications } = useNotifications();

	const [mobileOpen, setMobileOpen] = useState(false);

	// Close drawer on route change (mobile UX)
	useEffect(() => {
		setMobileOpen(false);
	}, [location.pathname]);

	// Lock body scroll when drawer open on mobile
	useEffect(() => {
		if (!mobileOpen) return;
		const original = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = original;
		};
	}, [mobileOpen]);

	const handleLogout = async () => {
		try {
			await logout();
			toast.success("Logged out");
			navigate("/login");
		} catch {
			toast.error("Logout failed");
		}
	};

	//  Shared content (desktop + mobile drawer)
	const content = (
		<>
			{/* Logo */}
			<div className="flex shrink-0 items-center justify-between px-6 py-5">
				<div className="flex items-center gap-2">
					<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-white font-bold shadow-md">
						M
					</div>
					<span className="text-lg font-bold text-gray-800">MeetUp</span>
				</div>
				{/* Close button — mobile only */}
				<button
					onClick={() => setMobileOpen(false)}
					className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
				>
					<X className="h-4 w-4" />
				</button>
			</div>

			{/* Nav links */}
			<nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
				{links.map(({ to, label, icon: Icon, end }) => (
					<NavLink
						key={to}
						to={to}
						end={end}
						className={({ isActive }) =>
							`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
								isActive
									? "bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] text-white shadow-md shadow-indigo-500/20"
									: "text-gray-600 hover:bg-gray-100"
							}`
						}
					>
						<Icon className="h-4 w-4" />
						{label}

						{/* Badge for Friends link when there are pending requests */}
						{label === "Friends" && pendingCount > 0 && (
							<span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
								{pendingCount}
							</span>
						)}

						{label === "Notifications" && unreadNotifications > 0 && (
							<span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
								{unreadNotifications > 9 ? "9+" : unreadNotifications}
							</span>
						)}
					</NavLink>
				))}
			</nav>

			{/* User card + logout */}
			<div className="shrink-0 border-t border-gray-200/60 p-3">
				<div className="mb-2 flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
					<div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-sm font-semibold text-white">
						{user?.profileImage ? (
							<img
								src={user.profileImage}
								alt={user.name}
								className="h-full w-full object-cover"
							/>
						) : (
							(user?.name || user?.username || "U").charAt(0).toUpperCase()
						)}
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-semibold text-gray-800">
							{user?.name || "User"}
						</p>
						<p className="truncate text-xs text-gray-500">
							@{user?.username || "user"}
						</p>
					</div>
				</div>

				<button
					onClick={handleLogout}
					className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
				>
					<LogOut className="h-4 w-4" />
					Logout
				</button>
			</div>
		</>
	);

	return (
		<>
			{/*  Mobile top bar (only shows on < lg)  */}
			<div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/40 bg-white/80 px-4 backdrop-blur-xl lg:hidden">
				<div className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-sm font-bold text-white shadow-sm">
						M
					</div>
					<span className="text-base font-bold text-gray-800">MeetUp</span>
				</div>
				<button
					onClick={() => setMobileOpen(true)}
					className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
					aria-label="Open menu"
				>
					<Menu className="h-5 w-5" />
				</button>
			</div>

			{/*  Desktop sidebar (always visible ≥ lg)  */}
			<aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-white/40 bg-white/70 backdrop-blur-xl lg:flex">
				{content}
			</aside>

			{/*  Mobile drawer + backdrop  */}
			{/* Backdrop */}
			<div
				onClick={() => setMobileOpen(false)}
				className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden ${
					mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
				}`}
			/>

			{/* Drawer */}
			<aside
				className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-white/40 bg-white shadow-2xl transition-transform duration-200 lg:hidden ${
					mobileOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				{content}
			</aside>
		</>
	);
}
