import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  UserCircle,
  ArrowRight,
  Check,
  X,
  ArrowLeft,
  CircleUser,
  MailIcon,
} from "lucide-react";

import otpService from "../services/otp.Service";
import authService from "../services/auth.Service";

const SignUp = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerify, setIsVerify] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState(1);
  const [OTP, setOTP] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [otpError, setOtpError] = useState("");

  const [cooldown, setCooldown] = useState(30);
  const [isCooldownActive, setIsCooldownActive] = useState(true);

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
  });

  // Password strength checker
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
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: val }));

    // Real-time validation
    if (name === "password") {
      checkPasswordStrength(value);
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      newErrors.name = "Full name is required";
    }

    if (!formData.username.trim() || formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } 

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must agree to the terms";
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
    // Only allow numbers and limit to 6 digits
    if (/^\d*$/.test(value) && value.length <= 6) {
      setOTP(value);
      setOtpError("");
    }
  };

  // STEP 1: register
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix all validation errors");
      return;
    }

    // setIsLoading(true);
    try {
      const reg = await authService.register({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      // After register → send OTP
      await otpService.send(formData.email);

      toast.success(reg.message || "Verify your email address");
      setStep(2);
      setCooldown(30);
      setIsCooldownActive(true);
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    } finally {
      // setIsLoading(false);
    }
  };

  // STEP 2: verify OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!OTP || OTP.length < 6) {
      toast.error("Please enter a valid 6-digit OTP");

      return;
    }

    setIsVerify(true);

    try {
      const res = await otpService.verify(formData.email, OTP);
      toast.success(res.message || "Email verified successfully");

      navigate("/login");
    } catch (error) {
      const msg = error.message || "Invalid OTP";

      setOtpError(msg);
      toast.error(msg);
    } finally {
      setIsVerify(false);
    }
  };

    const handleResendOTP = async () => {
    if (isCooldownActive) {
      toast.error(`Please wait ${cooldown}s before resending`);
      return;
    }
    try {
      const res = await otpService.send(formData.email);
      toast.success(res.message || "OTP resent successfully");

      setCooldown(30);
      setIsCooldownActive(true);
      
      setOTP("");
      setOtpError("");
    } catch (error) {
      toast.error(error.message || "Failed to resend OTP");
    }
  };

  // Format time for display
  const formatTime = (seconds) => {
    if (seconds < 10) {
      return `0:0${seconds}`;
    }
    return `0:${seconds}`;
  };

  const handleBackFromOTP = async () => {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      await authService.deleteUnverified(formData.email);
      toast.success("Pending registration removed");

      setStep(1);
      setOTP("");

      setOtpError("");
    } catch (error) {
      // If user wasn't there (e.g. already deleted), just go back

      toast.error(error.message || "Failed to clean up pending user");
      
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Glass Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20">
          {/* Header */}

          {step == 1 && (
            <div>
              <ArrowLeft
                onClick={() => navigate("/")}
                size={24}
                className="text-blue-400 cursor-pointer hover:text-blue-600 transition-colors"
              />
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] text-white text-xl font-bold mb-3 shadow-lg">
                  <CircleUser size={28} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Create Account
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Join our community today to hangout with friends
                </p>
              </div>

              {/* Form */}
              <form className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                        errors.name ? "border-red-500" : "border-gray-200"
                      } focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20 outline-none transition-all duration-200 bg-white/50 text-sm`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <X className="w-3 h-3" /> {errors.name}
                    </p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="@johndoe"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                        errors.username ? "border-red-500" : "border-gray-200"
                      } focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20 outline-none transition-all duration-200 bg-white/50 text-sm`}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <X className="w-3 h-3" /> {errors.username}
                    </p>
                  )}
                </div>

                {/* Email */}
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
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <X className="w-3 h-3" /> {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
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

                      {/* Password requirements */}
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
                      placeholder="••••••••"
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

                {/* Terms and Conditions */}
                <div className="flex items-start gap-3 pt-1">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-[#3e4bc4] focus:ring-[#3e4bc4] cursor-pointer"
                  />
                  <label className="text-sm text-gray-600">
                    I agree to the{" "}
                    <a
                      href="#"
                      className="text-[#3e4bc4] hover:underline font-medium"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="#"
                      className="text-[#3e4bc4] hover:underline font-medium"
                    >
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.agreeTerms && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <X className="w-3 h-3" /> {errors.agreeTerms}
                  </p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="w-full py-3 bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] text-white font-semibold rounded-lg hover:scale-[1.02] hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                >
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/80 text-gray-500 text-xs">
                      or
                    </span>
                  </div>
                </div>

                {/* Social Signup */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => toast("Comming soon...")}
                    className="flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
                  >
                    <img
                      src="https://www.google.com/favicon.ico"
                      alt="Google"
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Google
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toast("Comming soon...")}
                    className="flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
                  >
                    <img
                      src="https://github.com/favicon.ico"
                      alt="GitHub"
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      GitHub
                    </span>
                  </button>
                </div>
              </form>

              {/* Login Link */}
              <p className="text-center text-sm text-gray-600 mt-6">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-[#3e4bc4] hover:text-[#5a4bd1] font-semibold hover:underline transition-colors"
                >
                  Login here
                </Link>
              </p>
            </div>
          )}

          {step == 2 && (
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
                disabled={isVerify || OTP.length < 4}
                className="w-full py-3 bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] text-white font-semibold rounded-lg hover:scale-[1.02] hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
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
        </div>
      </div>
    </div>
  );
};

export default SignUp;