import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { MeetingProvider } from "./context/MeetingContext";

import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Forgot from "./pages/Forgot";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Landing from "./pages/Landing";
import Settings from "./pages/Settings";
import MediaTest from "./pages/MediaTest"; // testing purpose
import WebRTCTest from "./pages/WebRTCTest"; // testing purpose
import MeetingJoin from "./pages/MeetingJoin";
import MeetingRoom from "./pages/MeetingRoom";
import Meet from "./pages/Meet";
import Friends from "./pages/Friends";
import Notifications from "./pages/Notifications";

import { NotificationProvider } from "./context/NotificationContext";
import { useSocketConnection } from "./hooks/useSocketConnection";

function RequireAuth({ children }) {
	const { isAuthenticated, loading } = useAuth();
	if (loading) return <div className="p-10 text-center">Loading…</div>;
	if (!isAuthenticated) return <Navigate to="/login" replace />;
	return children;
}

function PublicOnly({ children }) {
	const { isAuthenticated, loading } = useAuth();
	if (loading) return <div className="p-10 text-center">Loading…</div>;
	if (isAuthenticated) return <Navigate to="/home" replace />;
	return children;
}

function LandingGate() {
	const { isAuthenticated, loading } = useAuth();
	if (loading) return <div className="p-10 text-center">Loading…</div>;
	if (isAuthenticated) return <Navigate to="/home" replace />;
	return <Landing />;
}

const GlobalSocket = ({ children }) => {
	useSocketConnection();
	return children;
};

const AppRoutes = () => (
	<Routes>
		{/* Public landing */}
		<Route path="/" element={<LandingGate />} />

		<Route
			path="/login"
			element={
				<PublicOnly>
					<Login />
				</PublicOnly>
			}
		/>
		<Route
			path="/signup"
			element={
				<PublicOnly>
					<SignUp />
				</PublicOnly>
			}
		/>
		<Route path="/forgot" element={<Forgot />} />

		{/* Protected */}
		<Route
			path="/home"
			element={
				<RequireAuth>
					<Home />
				</RequireAuth>
			}
		/>

		<Route
			path="/profile"
			element={
				<RequireAuth>
					<Profile />
				</RequireAuth>
			}
		/>

		<Route
			path="/settings"
			element={
				<RequireAuth>
					<Settings />
				</RequireAuth>
			}
		/>

		<Route
			path="/media-test"
			element={
				<RequireAuth>
					<MediaTest />
				</RequireAuth>
			}
		/>

		<Route
			path="/webrtc-test"
			element={
				<RequireAuth>
					<WebRTCTest />
				</RequireAuth>
			}
		/>

		<Route
			path="/meeting/:meetingCode"
			element={
				<RequireAuth>
					<MeetingJoin />
				</RequireAuth>
			}
		/>

		<Route
			path="/room/:meetingId"
			element={
				<RequireAuth>
					<MeetingRoom />
				</RequireAuth>
			}
		/>

		<Route
			path="/meet"
			element={
				<RequireAuth>
					<Meet />
				</RequireAuth>
			}
		/>

		<Route
			path="/friends"
			element={
				<RequireAuth>
					<Friends />
				</RequireAuth>
			}
		/>

		<Route
			path="/notifications"
			element={
				<RequireAuth>
					<Notifications />
				</RequireAuth>
			}
		/>

		<Route path="*" element={<Navigate to="/" replace />} />
	</Routes>
);

const App = () => (
	<AuthProvider>
		<NotificationProvider>
			<GlobalSocket>
				<MeetingProvider>
					<AppRoutes />
				</MeetingProvider>
			</GlobalSocket>
		</NotificationProvider>
		<Toaster
			position="top-right"
			toastOptions={{
				duration: 1500,
				style: {
					background: "#fff",
					color: "#000",
					padding: "16px",
					borderRadius: "8px",
				},
			}}
		/>
	</AuthProvider>
);

export default App;
