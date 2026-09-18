import React, { memo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
	Home,
	User,
	Settings,
	LogOut,
	Users,
	Bell,
	UserGroup,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const links = [
	{ to: "/", label: "Home", icon: Home, end: true },
	{ to: "/meet", label: "Meet", icon: UserGroup, },
	{ to: "/friends", label: "Friends", icon: Users },
	{ to: "/notifications", label: "Notifications", icon: Bell },
	{ to: "/profile", label: "Profile", icon: User },
	{ to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
	const navigate = useNavigate();
  
	const { user, logout } = useAuth();

	const handleLogout = async () => {
		try {
			await logout();
			toast.success("Logged out");
			navigate("/login");
		} catch {
			toast.error("Logout failed");
		}
	};

	return (
		<aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-white/40 bg-white/70 backdrop-blur-xl">
			{/* Logo */}
			<div className="flex items-center gap-2 px-6 py-5">
				<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-white font-bold shadow-md">
					M
				</div>
				<span className="text-lg font-bold text-gray-800">MeetUp</span>
			</div>

			{/* Nav links */}
			<nav className="flex-1 space-y-1 px-3">
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
					</NavLink>
				))}
			</nav>

			{/* User card + logout */}
			<div className="border-t border-gray-200/60 p-3">
				<div className="mb-2 flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
					<div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-sm font-semibold text-white">
						{(user?.name || user?.username || "U").charAt(0).toUpperCase()}
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
		</aside>
	);
}
