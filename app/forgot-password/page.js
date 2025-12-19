"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "../container";
import Header from "../header/page";

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(1); // 1 for email, 2 for password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/forgot-password/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Email not found");
        toast.error(data.error || "Email not found");
        setLoading(false);
        return;
      }

      toast.success("Email verified! Please set your new password.");
      setActiveTab(2);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/forgot-password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset password");
        toast.error(data.error || "Failed to reset password");
        setLoading(false);
        return;
      }

      toast.success("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Header />
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />
      <Container>
        <div className="py-12 flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-[#f1e4d8]">
            <h1 className="mb-2 text-2xl font-semibold text-[#5b3a29]">
              Forgot Password
            </h1>
            <p className="mb-6 text-sm text-[#8a6a52]">
              Reset your password in two simple steps.
            </p>

            {/* Tabs */}
            <div className="mb-6 flex gap-2 border-b border-[#e5d4c4]">
              <button
                onClick={() => setActiveTab(1)}
                className={`px-4 py-2 text-sm font-medium transition ${
                  activeTab === 1
                    ? "border-b-2 border-[#5b3a29] text-[#5b3a29]"
                    : "text-[#8a6a52] hover:text-[#5b3a29]"
                }`}
              >
                Step 1: Verify Email
              </button>
              <button
                onClick={() => setActiveTab(2)}
                disabled={activeTab === 1}
                className={`px-4 py-2 text-sm font-medium transition ${
                  activeTab === 2
                    ? "border-b-2 border-[#5b3a29] text-[#5b3a29]"
                    : activeTab === 1
                    ? "text-[#8a6a52] cursor-not-allowed opacity-50"
                    : "text-[#8a6a52] hover:text-[#5b3a29]"
                }`}
              >
                Step 2: Set Password
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Tab 1: Verify Email */}
            {activeTab === 1 && (
              <form className="space-y-4" onSubmit={handleVerifyEmail}>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-sm font-medium text-[#5b3a29]"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                    placeholder="you@example.com"
                  />
                  <p className="mt-1 text-xs text-[#8a6a52]">
                    Enter your registered email address. We&apos;ll verify it exists in our system.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#5b3a29] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#3e261a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </button>
              </form>
            )}

            {/* Tab 2: Set Password */}
            {activeTab === 2 && (
              <form className="space-y-4" onSubmit={handleResetPassword}>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#5b3a29]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full rounded-lg border border-[#e5d4c4] bg-gray-50 px-3 py-2 text-sm text-[#8a6a52] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1 block text-sm font-medium text-[#5b3a29]"
                  >
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <p className="mt-1 text-xs text-[#8a6a52]">
                    Password must be at least 6 characters long.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1 block text-sm font-medium text-[#5b3a29]"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(1);
                      setPassword("");
                      setConfirmPassword("");
                      setError("");
                    }}
                    className="flex-1 rounded-full border border-[#5b3a29] bg-white px-4 py-2 text-sm font-semibold text-[#5b3a29] transition hover:bg-[#fff4ea]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-full bg-[#5b3a29] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#3e261a] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}

            <p className="mt-6 text-center text-xs text-[#8a6a52]">
              Remember your password?{" "}
              <a
                href="/login"
                className="font-semibold text-[#5b3a29] hover:underline"
              >
                Back to Login
              </a>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ForgotPasswordPage;

