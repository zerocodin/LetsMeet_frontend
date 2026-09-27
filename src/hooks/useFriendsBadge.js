import { useEffect, useState, useCallback } from "react";
import friendsService from "../services/friends.Service";

/**
 * Returns { pendingCount, refresh }.
 * Use anywhere you need to display a badge.
 */
export const useFriendsBadge = () => {
	const [pendingCount, setPendingCount] = useState(0);

	const refresh = useCallback(async () => {
		try {
			const res = await friendsService.getRequests();
			setPendingCount(res.incoming?.length || 0);
		} catch {
			// ignore — likely not logged in yet
		}
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	return { pendingCount, refresh };
};