import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  X,
  ArrowLeft,
  CircleUser,
} from "lucide-react";

import authService from "../services/auth.Service";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: val }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must agree to the terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix all validation errors");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      try {
        const me = await authService.getMe();
        login(me.user || me);
      } catch {
        login(response.user || response); // work here
      }

      toast.success(response.message || "Login successful!");

      navigate("/home");
    } catch (error) {
      const errorMessage =
        error.message ||
        error.response?.data?.message ||
        "Something went wrong";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20">
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
              Welcome to <span>MeetUp</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Login your Account</p>
          </div>

          <form className="space-y-4">
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
              {errors.password && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <X className="w-3 h-3" /> {errors.password}
                </p>
              )}
            </div>

            <div
              onClick={() => navigate("/forgot")}
              className="w-30 -mt-3 ml-auto text-[#3e4bc4] hover:underline text-sm hover:scale-[1.03] cursor-pointer"
            >
              Forgot Password
            </div>

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

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-3 bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] text-white font-semibold rounded-lg hover:scale-[1.02] hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  LOGIN
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

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

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => toast("Comming soon...")}
                className="flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  className="w-5 h-5"
                />
                <span className="text-sm font-bold text-gray-500">
                  Continue with Google
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
                  className="w-5 h-5"
                />
                <span className="text-sm font-bold text-gray-500">
                  Continue with GitHub
                </span>
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-[#3e4bc4] hover:text-[#5a4bd1] font-semibold hover:underline transition-colors"
            >
              SignUp
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;