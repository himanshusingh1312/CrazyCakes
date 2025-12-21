"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "../container";
import TermsModal from "../components/TermsModal";
import { MdLocationOn, MdPhone, MdEmail } from "react-icons/md";
import Loader from "../loader"
const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!acceptedTerms) {
      setError("Please accept the Terms and Conditions to continue");
      toast.error("Please accept the Terms and Conditions to continue");
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error || "Login failed";
        setError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      // Save token to localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        // Dispatch event to update header
        window.dispatchEvent(new Event("userUpdated"));
      }

      toast.success("Login successful!");

      // Check if there's a return URL stored (from product page checkout)
      const returnUrl = sessionStorage.getItem("returnUrl");
      sessionStorage.removeItem("returnUrl"); // Clear it after reading

      // Slight delay so user sees toast, then redirect
      setTimeout(() => {
        if (returnUrl) {
          router.push(returnUrl);
        } else {
          router.push("/");
        }
      }, 800);
    } catch (err) {
      const message = "Something went wrong. Please try again.";
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf3] flex items-center justify-center sm:px-4 px-3 sm:py-8 py-6">
        
        
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />

      {/* MAIN WRAPPER – responsive columns */}
      <div className="flex w-full max-w-6xl flex-col md:flex-row overflow-hidden rounded-2xl shadow-lg border border-[#f1e4d8] bg-white">
        {/* LEFT SIDE – CONTACT INFO */}
        <div className="w-full md:w-1/3 bg-[#5b3a29]  sm:flex hidden text-white flex-col justify-center px-8 sm:px-10 lg:px-12 py-10 space-y-8">
          {/* ADDRESS */}
          <div className="flex items-start gap-3">
            <MdLocationOn className="text-2xl sm:text-3xl" />
            <div>
              <h3 className="text-lg sm:text-xl font-semibold">Address</h3>
              <p className="text-sm sm:text-md">Crazy Cakes Bakery , Malhaur, Gomti Nagar</p>
            </div>
          </div>

          {/* PHONE */}
          <div className="flex items-start gap-3">
            <MdPhone className="text-2xl sm:text-3xl" />
            <div>
              <h3 className="text-lg sm:text-xl font-semibold">Phone</h3>
              <p className="text-sm sm:text-md">+91 9555105186</p>
            </div>
          </div>

          {/* EMAIL */}
          <div className="flex items-start gap-3">
            <MdEmail className="text-2xl sm:text-3xl" />
            <div>
              <h3 className="text-lg sm:text-xl font-semibold">Email</h3>
              <p className="text-sm sm:text-md">himanshu094405@gmail.com</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE – LOGIN FORM */}
        <div className="w-full md:w-2/3 flex justify-center items-center p-6 sm:p-10 bg-white">
          <div className="w-full max-w-md rounded-2xl bg-white sm:p-6 lg:p-8 p-4 shadow-inner border border-[#f1e4d8]">
            <h1 className="mb-2 text-2xl font-semibold text-[#5b3a29]">Login</h1>
            <p className="mb-6 text-sm text-[#8a6a52]">
              Welcome back to Crazy Cakes. Please sign in to continue.
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#5b3a29]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border text-[#5b3a29] border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#5b3a29]">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#e5d4c4] text-[#5b3a29] bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a6a52]"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-[#e5d4c4] text-[#5b3a29]"
                />
                <label htmlFor="acceptTerms" className="text-xs text-[#8a6a52] cursor-pointer">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="font-semibold text-[#5b3a29] hover:underline"
                  >
                    Terms and Conditions
                  </button>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !acceptedTerms}
                className="mt-2 w-full rounded-full bg-[#5b3a29] px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#3e261a]"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-[#8a6a52]">
              <a href="/forgot-password" className="font-semibold text-[#5b3a29] hover:underline block mb-2">
                Forgot Password?
              </a>
              Don’t have an account?{" "}
              <a href="/signup" className="font-semibold text-[#5b3a29] hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>

      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </div>
  );
};

export default LoginPage;
