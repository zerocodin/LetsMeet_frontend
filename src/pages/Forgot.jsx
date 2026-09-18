import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Check,
  X,
  ArrowLeft,
  MailIcon,
} from "lucide-react";

import {otpURL} from "../api/urlEndPoint";
import authService from "../services/auth.Service";

const Forgot = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerify, setIsVerify] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [step, setStep] = useState(1);
  const [OTP, setOTP] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [otpError, setOtpError] = useState("");

  const [cooldown, setCooldown] = useState(30);
  const [isCooldownActive, setIsCooldownActive] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
  });

  const checkPasswordStrength = (password) => {
    let score = 0;
    let message = "";

    if (password.length >= 8) score++;
    if (password.match(/[a-z]/)) score++;
    if (password.match(/[A-Z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^a-zA-Z0-9]/)) score++;

    if (score <= 2) message = "Weak";
    else if (score <= 4) message = "Medium";
    else message = "Strong";

    setPasswordStrength({ score, message });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time validation
    if (name === "password") {
      checkPasswordStrength(value);
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateEmail = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (isCooldownActive && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else if (cooldown === 0) {
      setIsCooldownActive(false);
    }
    return () => clearInterval(timer);
  }, [cooldown, isCooldownActive]);

  useEffect(() => {
    if (step === 2) {
      setCooldown(30);
      setIsCooldownActive(true);
    }
  }, [step]);

  const handleOTPChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 6) {
      setOTP(value);
      setOtpError("");
    }
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!validateEmail()) {
      toast.error("Please fix all validation errors");
      return;
    }

    setIsLoading(true);

    try {
      const result = await axios.post(
        `${otpURL}/send`,
        { email: formData.email },
        { withCredentials: true },
      );

      toast.success(result.data.message || "OTP sent to your email!");
      setStep(2);
      setCooldown(30);
      setIsCooldownActive(true);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to send OTP";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerify = async (e) => {
    e.preventDefault();

    if (!OTP || OTP.length < 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsVerify(true);

    try {
      const result = await axios.post(
        `${otpURL}/verify`,
        {
          email: formData.email,
          OTP: OTP,
        },
        { withCredentials: true },
      );
      console.log(formData.email, OTP);
      toast.success(result.data.message || "OTP verified successfully!");
      setStep(3);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Invalid OTP";
      toast.error(errorMessage);
      setOtpError(errorMessage);
      setIsVerify(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (isCooldownActive) {
      toast.error(`Please wait ${cooldown} seconds before resending`);
      return;
    }

    try {
      const result = await axios.post(
        `${otpURL}/send`,
        { email: formData.email },
        { withCredentials: true },
      );

      toast.success(result.data.message || "OTP resent successfully!");
      setCooldown(30);
      setIsCooldownActive(true);
      setOTP("");
      setOtpError("");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to resend OTP";
      toast.error(errorMessage);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!validatePassword()) {
      toast.error("Please fix all validation errors");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.resetPassword({
        email: formData.email,
        password: formData.password,
      });

      toast.success(result.message || "Password reset successfully!");

      setTimeout(() => {
        navigate("/login", {
          state: { message: "Password reset successfully! Please login." },
        });
      }, 1500);
    } catch (error) {
      const errorMessage =
        error.response?.message || "Failed to reset password";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Back from OTP step
  const handleBackFromOTP = () => {
    setStep(1);
    setOTP("");
    setOtpError("");
  };

  // Back from Reset Password step
  const handleBackFromReset = () => {
    setStep(1);
    setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
  };

  // Format time for display
  const formatTime = (seconds) => {
    if (seconds < 10) {
      return `0:0${seconds}`;
    }
    return `0:${seconds}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20">
          {/* Step 1: Enter Email */}
          {step === 1 && (
            <div>
              <ArrowLeft
                onClick={() => navigate("/login")}
                size={24}
                className="text-blue-400 cursor-pointer hover:text-blue-600 transition-colors"
              />
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] text-white text-xl font-bold mb-3 shadow-lg">
                  <Mail size={28} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Account Recovery
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Enter your email to receive OTP
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                        errors.email ? "border-red-500" : "border-gray-200"
                      } focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20 outline-none transition-all duration-200 bg-white/50 text-sm`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <X className="w-3 h-3" /> {errors.email}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-7 mb-3 py-3 bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] text-white font-semibold rounded-lg hover:scale-[1.02] hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <div>
              <ArrowLeft
                onClick={handleBackFromOTP}
                size={24}
                className="text-blue-400 cursor-pointer hover:text-blue-600 transition-colors"
              />
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] text-white text-xl font-bold mb-3 shadow-lg">
                  <MailIcon size={28} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Verify Email
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              {/* OTP Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OTP Code
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="otp"
                    value={OTP}
                    onChange={handleOTPChange}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                      otpError ? "border-red-500" : "border-gray-200"
                    } focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20 outline-none transition-all duration-200 bg-white/50 text-sm text-center tracking-widest font-mono`}
                  />
                </div>
                {otpError && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <X className="w-3 h-3" /> {otpError}
                  </p>
                )}

                {/* OTP Hint with Resend Button and Cooldown */}
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-400">
                    Enter the code sent to your email
                  </span>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isCooldownActive}
                    className={`text-xs font-medium transition-all duration-200 ${
                      isCooldownActive
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-[#3e4bc4] hover:underline"
                    }`}
                  >
                    {isCooldownActive ? (
                      <span className="flex items-center gap-1">
                        Resend in{" "}
                        <span className="font-mono font-bold">
                          {formatTime(cooldown)}
                        </span>
                      </span>
                    ) : (
                      "Resend Code"
                    )}
                  </button>
                </div>
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerify}
                disabled={isVerify || OTP.length < 6}
                className="w-full mb-3 py-3 bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] text-white font-semibold rounded-lg hover:scale-[1.02] hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
              >
                {isVerify ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Email
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <div>
              <ArrowLeft
                onClick={handleBackFromReset}
                size={24}
                className="text-blue-400 cursor-pointer hover:text-blue-600 transition-colors"
              />
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] text-white text-xl font-bold mb-3 shadow-lg">
                  <Lock size={28} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Reset Password
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Enter your new password
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter new password"
                      className={`w-full pl-10 pr-12 py-2.5 rounded-lg border ${
                        errors.password ? "border-red-500" : "border-gray-200"
                      } focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20 outline-none transition-all duration-200 bg-white/50 text-sm`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <X className="w-3 h-3" /> {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                      className={`w-full pl-10 pr-12 py-2.5 rounded-lg border ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-200"
                      } focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20 outline-none transition-all duration-200 bg-white/50 text-sm`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <X className="w-3 h-3" /> {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordStrength.score <= 2
                              ? "w-1/3 bg-red-500"
                              : passwordStrength.score <= 4
                                ? "w-2/3 bg-yellow-500"
                                : "w-full bg-green-500"
                          }`}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          passwordStrength.score <= 2
                            ? "text-red-500"
                            : passwordStrength.score <= 4
                              ? "text-yellow-500"
                              : "text-green-500"
                        }`}
                      >
                        {passwordStrength.message}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-0.5 text-xs">
                      <div
                        className={`flex items-center gap-1 ${
                          formData.password.length >= 8
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                      >
                        {formData.password.length >= 8 ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        Min 8 characters
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          /[A-Z]/.test(formData.password)
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                      >
                        {/[A-Z]/.test(formData.password) ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        Uppercase
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          /[a-z]/.test(formData.password)
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                      >
                        {/[a-z]/.test(formData.password) ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        Lowercase
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          /[0-9]/.test(formData.password)
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                      >
                        {/[0-9]/.test(formData.password) ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        Number
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-6 mb-3 py-3 bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] text-white font-semibold rounded-lg hover:scale-[1.02] hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Forgot;