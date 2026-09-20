import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from "react";
import authService from "../services/auth.Service";

const AuthContext = createContext(null);

// helper: read a non-httpOnly cookie by name
function getCookie(name) {
	return document.cookie
		.split("; ")
		.find((row) => row.startsWith(name + "="))
		?.split("=")[1];
}

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [loading, setLoading] = useState(true);

	const checkAuth = useCallback(async () => {
		//    Skip the /me call entirely if there's no session flag cookie.
		//    This prevents the 401 from ever hitting the network tab
		const hasSession = getCookie("logged_in");

		if (!hasSession) {
			setUser(null);
			setIsAuthenticated(false);
			setLoading(false);
			return;
		}

		try {
			const data = await authService.getMe();
			setUser(data.user || data);
			setIsAuthenticated(true);
		} catch {
			setUser(null);
			setIsAuthenticated(false);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	const login = (userData) => {
		setUser(userData);
		setIsAuthenticated(true);
	};

	const logout = async () => {
		try {
			await authService.logout();
		} finally {
			setUser(null);
			setIsAuthenticated(false);
			// cookie was cleared by the server; also clear the JS-readable flag
			document.cookie = "logged_in=; Max-Age=0; path=/";
		}
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated,
				loading,
				login,
				logout,
				setUser,
				checkAuth,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
};
