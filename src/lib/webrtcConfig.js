/**
 * ICE servers for WebRTC.
 *
 * STUN: discovers your public IP (free, no auth).
 * TURN: relays traffic when P2P fails (symmetric NATs). Required in production.
 *
 * For dev, STUN alone works on same-WiFi / same-network.
 * For production, add TURN — Metered.ca and Twilio offer free tiers.
 */
export const ICE_SERVERS = [
	{ urls: "stun:stun.l.google.com:19302" },
	{ urls: "stun:stun1.l.google.com:19302" },
	{ urls: "stun:stun2.l.google.com:19302" },

	// Uncomment and fill these in when  TURN on credentials
	/* {
	//   urls: "turn:global.turn.twilio.com:3478?transport=udp",
	//   username: import.meta.env.VITE_TURN_USERNAME,
	//   credential: import.meta.env.VITE_TURN_CREDENTIAL,
	},*/
];

export const RTC_CONFIG = {
	iceServers: ICE_SERVERS,
	iceCandidatePoolSize: 10,
};