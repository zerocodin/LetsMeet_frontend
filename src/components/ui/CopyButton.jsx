import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function CopyButton({
	text,
	label = "Copy",
	className = "",
	iconOnly = false,
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			toast.success("Copied!");
			setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error("Copy failed");
		}
	};

	return (
		<button
			onClick={handleCopy}
			type="button"
			className={`inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200 ${className}`}
			title={label}
		>
			{copied ? (
				<Check className="h-3.5 w-3.5 text-emerald-600" />
			) : (
				<Copy className="h-3.5 w-3.5" />
			)}
			{!iconOnly && (copied ? "Copied" : label)}
		</button>
	);
}