import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Trash2,
  AlertTriangle,
  Lock,
  Mail,
  X,
  Loader2,
} from "lucide-react";

import Sidebar from "../components/layout/Sidebar";
import { useAuth } from "../context/AuthContext";
import authService from "../services/auth.Service";

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    if (confirmText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setLoading(true);
    try {
      await authService.deleteVerified({ email, password });
      toast.success("Account deleted successfully");

      try {
        await logout();
      } catch {
        // ignore logout error — account is already gone
      }

      navigate("/signup", { replace: true });
    } catch (error) {
      toast.error(error?.message || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    if (loading) return;
    setShowModal(false);
    setEmail("");
    setPassword("");
    setConfirmText("");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Sidebar />

      <main className="ml-64 min-h-screen p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account preferences and security.
          </p>
        </div>

        {/* Danger Zone */}
        <section className="max-w-3xl rounded-2xl border border-red-200 bg-white/70 p-6 shadow-md backdrop-blur-lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-600">Danger Zone</h2>
              <p className="text-xs text-gray-500">
                Irreversible actions. Please be careful.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Delete Account
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                Once deleted, your account and all data will be permanently
                removed. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </button>
          </div>
        </section>

        {/* Confirmation Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white p-6 shadow-2xl">
              {/* Modal header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      Delete your account?
                    </h3>
                    <p className="text-xs text-gray-500">
                      This action is permanent and cannot be undone.
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  disabled={loading}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleDelete} className="space-y-4">
                {/* Email (editable) */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    Email
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      autoComplete="email"
                      disabled={loading}
                      className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    Confirm your password
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100">
                    <Lock className="h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={loading}
                      className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Confirm text */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    Type <span className="font-bold text-red-600">DELETE</span>{" "}
                    to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={loading}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !email ||
                      !password ||
                      confirmText !== "DELETE"
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete Permanently
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}