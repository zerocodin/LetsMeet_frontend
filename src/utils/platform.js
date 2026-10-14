export const isMobileDevice = () => {
	if (typeof navigator === "undefined") return false;
	return /Android|iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

export const supportsScreenShare = () => {
	if (typeof navigator === "undefined") return false;
	return !!navigator.mediaDevices?.getDisplayMedia && !isMobileDevice();
};