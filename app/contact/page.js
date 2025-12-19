"use client";

import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "../container";
import Header from "../header/page";
import Footer from "../footer/page";
const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Something went wrong. Please try again.");
        return;
      }

      toast.success("Thank you for contacting us! We'll get back to you soon.");
      setFormData({
        name: "",
        phone: "",
        description: "",
      });
    } catch (err) {
      console.error("Contact form error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (<div className="min-h-screen bg-[#fffaf3]">
  <Header />
  <ToastContainer position="top-right" autoClose={2000} theme="colored" />

  <Container>
    <div className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl">

        {/* MAIN CARD */}
        <div className="flex flex-col lg:flex-row overflow-hidden rounded-2xl shadow-lg bg-white">

          {/* LEFT IMAGE — 55% */}
          <div className="lg:w-[55%] w-full h-[260px] sm:h-[340px] lg:h-auto">
            <img
              src="/contactus.jpg"
              alt="Contact Us"
              className="h-full w-full object-cover"
            />
          </div>

          {/* RIGHT CONTENT — 45% */}
          <div className="lg:w-[45%] w-full p-6 md:p-8">

            <h1 className="mb-2 text-2xl md:text-3xl font-bold text-[#5b3a29]">
              Contact Us
            </h1>
            <p className="mb-6 md:mb-8 text-sm text-[#8a6a52]">
              Have a question or want to place a custom order? Get in touch with us!
            </p>

            <div className="rounded-2xl border border-[#f1e4d8] bg-white p-5 sm:p-6 md:p-8 shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">

                <div>
                  <label className="mb-1 block text-md font-medium text-[#8a6a52]">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#e5d4c4] px-3 py-2 text-sm outline-none
                               focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-md font-medium text-[#8a6a52]">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#e5d4c4] px-3 py-2 text-sm outline-none
                               focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                    placeholder="10-digit phone number"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-md font-medium text-[#8a6a52]">
                    Message / Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#e5d4c4] px-3 py-2 text-sm outline-none
                               focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                    placeholder="Tell us about your inquiry, custom order requirements, or any questions you have..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#5b3a29] px-6 py-3 text-sm font-semibold text-white
                             shadow-md transition hover:bg-[#3e261a]
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>

              {/* CONTACT INFO */}
              <div className="mt-6 md:mt-8 border-t border-[#e5d4c4] pt-6 md:pt-8">
                <h2 className="mb-4 text-lg md:text-xl font-semibold text-[#5b3a29]">
                  Other Ways to Reach Us
                </h2>

                <div className="space-y-3 text-sm text-[#8a6a52]">
                  <div className="flex items-center gap-3">
                    <span>📞 Call us for immediate assistance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>📍 Visit us at our store in Lucknow</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>⏰ We're open daily from 9 AM to 9 PM</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  </Container>

  <Footer />
</div>

  );
};

export default ContactPage;

