import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Camera, Mail, Lock, User as UserIcon, Loader2, LucidePowerOff, User } from "lucide-react";

import Sidebar from "../components/layout/Sidebar";
import userService from "../services/user.Service";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
	const { setUser } = useAuth();
	const fileInputRef = useRef(null);

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [profile, setProfile] = useState({
		name: "",
		profession: "",
		email: "",
		bio: "",
		profileImage: "",
	});

	// email-change state
	const [emailStep, setEmailStep] = useState(1); // 1 = request, 2 = verify
	const [emailForm, setEmailForm] = useState({
		newEmail: "",
		password: "",
		otp: "",
	});

	// password-change state
	const [pwdForm, setPwdForm] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	// ------- load profile -------
	useEffect(() => {
		(async () => {
			try {
				const res = await userService.getProfile();
				setProfile({
					name: res.user.name || "",
					username: res.user.username || "",
					profession: res.user.profession || "",
					email: res.user.email || "",
					bio: res.user.bio || "",
					profileImage: res.user.profileImage || "",
				});
			} catch (err) {
				toast.error(err.message || "Failed to load profile");
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	// ------- update name / profession / bio -------
	const handleProfileSave = async (e) => {
		e.preventDefault();
		setSaving(true);
		try {
			const res = await userService.updateProfile({
				name: profile.name,
				profession: profile.profession,
				bio: profile.bio,
			});
			toast.success(res.message || "Profile updated");
			setUser((prev) => ({ ...(prev || {}), ...res.user }));
		} catch (err) {
			toast.error(err.message || "Failed to update profile");
		} finally {
			setSaving(false);
		}
	};

	// ------- upload avatar -------
	const handleAvatarChange = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const toastId = toast.loading("Uploading…");
		try {
			const res = await userService.updateAvatar(file);
			toast.success(res.message || "Image updated", { id: toastId });
			setProfile((p) => ({ ...p, profileImage: res.profileImage }));
			setUser((prev) => ({ ...(prev || {}), profileImage: res.profileImage }));
		} catch (err) {
			toast.error(err.message || "Upload failed", { id: toastId });
		}
	};

	// ------- email change -------
	const handleEmailRequest = async (e) => {
		e.preventDefault();
		try {
			const res = await userService.requestEmailUpdate(
				emailForm.newEmail,
				emailForm.password,
			);
			toast.success(res.message || "OTP sent to new email");
			setEmailStep(2);
		} catch (err) {
			toast.error(err.message || "Failed to request change");
		}
	};

	const handleEmailVerify = async (e) => {
		e.preventDefault();
		try {
			const res = await userService.verifyEmailUpdate(emailForm.otp);
			toast.success(res.message || "Email updated");
			setProfile((p) => ({ ...p, email: res.email }));
			setEmailStep(1);
			setEmailForm({ newEmail: "", password: "", otp: "" });
		} catch (err) {
			toast.error(err.message || "Invalid OTP");
		}
	};

	// ------- password change -------
	const handlePasswordSave = async (e) => {
		e.preventDefault();
		try {
			const res = await userService.updatePassword(pwdForm);
			toast.success(res.message || "Password updated");
			setPwdForm({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
		} catch (err) {
			toast.error(err.message || "Failed to update password");
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
				<Sidebar />
				<main className="ml-64 flex min-h-screen items-center justify-center p-8">
					<Loader2 className="h-6 w-6 animate-spin text-[#3e4bc4]" />
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
			<Sidebar />

			<main className="ml-64 min-h-screen p-8">
				<h1 className="mb-8 text-3xl font-bold text-gray-800">
					Profile Settings
				</h1>

				{/* ---------- Profile card ---------- */}
				<div className="mb-6 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-lg">
					<div className="flex items-center gap-6">
						<div className="relative">
							{profile.profileImage ? (
								<img
									src={profile.profileImage}
									alt="avatar"
									className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-md"
								/>
							) : (
								<div className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-3xl font-bold text-white shadow-md">
									{(profile.name || "U").charAt(0).toUpperCase()}
								</div>
							)}
							<button
								onClick={() => fileInputRef.current?.click()}
								className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-50"
							>
								<Camera className="h-4 w-4 text-[#3e4bc4]" />
							</button>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handleAvatarChange}
							/>
						</div>

						<div>
							<h2 className="text-xl font-bold text-gray-800">
								{profile.name}
							</h2>
							<p className="text-sm text-gray-500">@{profile.username}</p>

							{profile.profession && (
								<div className="flex gap-1">
									<User className="h-4 w-4 text-[#3e4bc4]" />
									<p className="text-sm text-gray-500">{profile.profession}</p>
								</div>
							)}
							<p className="mt-1 text-sm text-gray-600">{profile.email}</p>
						</div>
					</div>
				</div>

				{/* ---------- Basic info ---------- */}
				<section className="mb-6 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-lg">
					<h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
						<UserIcon className="h-4 w-4" /> Basic Info
					</h3>

					<form onSubmit={handleProfileSave} className="space-y-4">
						<div>
							<label className="mb-1 block text-sm font-medium text-gray-700">
								Full Name
							</label>
							<input
								value={profile.name}
								onChange={(e) =>
									setProfile({ ...profile, name: e.target.value })
								}
								className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2.5 text-sm outline-none focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20"
							/>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium text-gray-700">
								Profession
							</label>
							<input
								value={profile.profession}
								onChange={(e) =>
									setProfile({ ...profile, profession: e.target.value })
								}
								className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2.5 text-sm outline-none focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20"
							/>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium text-gray-700">
								Bio
							</label>
							<textarea
								rows={3}
								maxLength={200}
								value={profile.bio}
								onChange={(e) =>
									setProfile({ ...profile, bio: e.target.value })
								}
								className="w-full resize-none rounded-lg border border-gray-200 bg-white/50 px-4 py-2.5 text-sm outline-none focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20"
								placeholder="Tell us about yourself…"
							/>
							<p className="mt-1 text-xs text-gray-400">
								{profile.bio.length}/200
							</p>
						</div>

						<button
							disabled={saving}
							className="rounded-lg bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] disabled:opacity-60"
						>
							{saving ? "Saving…" : "Save changes"}
						</button>
					</form>
				</section>

				{/* ---------- Email ---------- */}
				<section className="mb-6 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-lg">
					<h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
						<Mail className="h-4 w-4" /> Change Email
					</h3>
						<form onSubmit={handleEmailRequest} className="space-y-4">
							<input
								type="email"
								required
								placeholder="New email"
								value={emailForm.newEmail}
								onChange={(e) =>
									setEmailForm({ ...emailForm, newEmail: e.target.value })
								}
								className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2.5 text-sm outline-none focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20"
							/>
							<input
								type="password"
								required
								placeholder="Current password"
								value={emailForm.password}
								onChange={(e) =>
									setEmailForm({ ...emailForm, password: e.target.value })
								}
								className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2.5 text-sm outline-none focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20"
							/>
							<button className="rounded-lg bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02]">
								Change email
							</button>
						</form>
				</section>

				{/* ---------- Password ---------- */}
				<section className="mb-6 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-lg">
					<h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
						<Lock className="h-4 w-4" /> Change Password
					</h3>

					<form onSubmit={handlePasswordSave} className="space-y-4">
						<input
							type="password"
							required
							placeholder="Current password"
							value={pwdForm.currentPassword}
							onChange={(e) =>
								setPwdForm({ ...pwdForm, currentPassword: e.target.value })
							}
							className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2.5 text-sm outline-none focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20"
						/>
						<input
							type="password"
							required
							placeholder="New password"
							value={pwdForm.newPassword}
							onChange={(e) =>
								setPwdForm({ ...pwdForm, newPassword: e.target.value })
							}
							className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2.5 text-sm outline-none focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20"
						/>
						<input
							type="password"
							required
							placeholder="Confirm new password"
							value={pwdForm.confirmPassword}
							onChange={(e) =>
								setPwdForm({ ...pwdForm, confirmPassword: e.target.value })
							}
							className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2.5 text-sm outline-none focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20"
						/>
						<button className="rounded-lg bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02]">
							Update password
						</button>
					</form>
				</section>
			</main>
		</div>
	);
}
