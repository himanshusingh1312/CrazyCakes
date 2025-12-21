"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "../container";
import TermsModal from "../components/TermsModal";

const SignupPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    pincode: "",
    type: "user",
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
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          pincode: formData.pincode ? Number(formData.pincode) : 0,
          phone: formData.phone ? Number(formData.phone) : 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error || "Signup failed";
        setError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      toast.success("Account created successfully! Please login.");

      // Redirect to login page after signup
      setTimeout(() => {
        router.push("/login");
      }, 800);
    } catch (err) {
      const message = "Something went wrong. Please try again.";
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf3] flex items-center justify-center px-4 py-8">
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />

      {/* MAIN WRAPPER */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0 overflow-hidden rounded-2xl border border-[#f1e4d8] bg-white shadow-lg">
        {/* LEFT SIDE IMAGE */}
        <div className="hidden lg:block h-full">
          <img
            src="/bglogin.png"
            alt="Login Illustration"
            className="w-full h-full object-cover rounded-l-2xl"
          />
        </div>

        {/* RIGHT SIDE FORM */}
        <div className="flex w-full rounded-2xl lg:rounded-none lg:rounded-r-2xl bg-white items-center justify-center px-5 sm:px-8 py-10 shadow-inner">
          <div className="w-full max-w-md">
            <h1 className="mb-2 text-2xl font-semibold text-[#5b3a29]">
              Create account
            </h1>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* FORM START */}
            <form
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
              onSubmit={handleSubmit}
            >
              {/* NAME */}
              <div>
                <label htmlFor="name" className="mb-1 block text-md font-medium text-[#8a6a52]">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border text-[#5b3a29] border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                  placeholder="Your full name"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label htmlFor="email" className="mb-1 block text-md font-medium text-[#8a6a52]">
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

              {/* PASSWORD */}
              <div>
                <label htmlFor="password" className="mb-1 block text-md font-medium text-[#8a6a52]">
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-lg border text-[#5b3a29] border-[#e5d4c4] bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a6a52] hover:text-[#5b3a29]"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* PHONE */}
              <div>
                <label htmlFor="phone" className="mb-1 block text-md font-medium text-[#8a6a52]">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border text-[#5b3a29] border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                  placeholder="10-digit number"
                />
              </div>

              {/* ADDRESS */}
              <div className="md:col-span-2">
                <label htmlFor="address" className="mb-1 block text-md font-medium text-[#8a6a52]">
                  Address
                </label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full rounded-lg border text-[#5b3a29] border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                  rows={2}
                  placeholder="House no, street, area"
                />
              </div>

              {/* PINCODE */}
              <div>
                <label htmlFor="pincode" className="mb-1 block text-md font-medium text-[#8a6a52]">
                  Pincode
                </label>
                <input
                  id="pincode"
                  type="number"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full rounded-lg border text-[#5b3a29] border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                  placeholder="e.g. 110001"
                />
              </div>

              {/* TYPE */}
              <div>
                <label htmlFor="type" className="mb-1 block text-md font-medium text-[#8a6a52]">
                  Type
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full rounded-lg border text-[#5b3a29] border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* TERMS */}
              <div className="md:col-span-2 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-[#e5d4c4] text-[#5b3a29] cursor-pointer"
                />
                <label htmlFor="acceptTerms" className="text-xs text-[#8a6a52]">
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

              {/* SUBMIT BUTTON */}
              <div className="md:col-span-2 mt-2">
                <button
                  type="submit"
                  disabled={loading || !acceptedTerms}
                  className="w-full rounded-full bg-[#5b3a29] px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#3e261a] disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Sign Up"}
                </button>
              </div>
            </form>

            <p className="mt-4 text-center text-sm text-[#8a6a52]">
              Already have an account?{" "}
              <a href="/login" className="font-semibold text-[#5b3a29] hover:underline">
                Login
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </div>
  );
};

export default SignupPage;
