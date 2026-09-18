import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
	open,
	onClose,
	title,
	children,
	maxWidth = "max-w-lg",
	closeOnBackdrop = true,
}) {
	// Lock scroll + ESC key
	useEffect(() => {
		if (!open) return;

		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		const onKey = (e) => {
			if (e.key === "Escape") onClose?.();
		};
		window.addEventListener("keydown", onKey);

		return () => {
			document.body.style.overflow = originalOverflow;
			window.removeEventListener("keydown", onKey);
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/40 backdrop-blur-sm"
				onClick={closeOnBackdrop ? onClose : undefined}
			/>

			{/* Panel */}
			<div
				className={`relative z-10 w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl border border-white/60 bg-white shadow-2xl`}
			>
				{/* Header */}
				{title && (
					<div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
						<h2 className="text-lg font-bold text-gray-800">{title}</h2>
						<button
							onClick={onClose}
							className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
				)}

				{/* Content */}
				<div className="p-6">{children}</div>
			</div>
		</div>
	);
}