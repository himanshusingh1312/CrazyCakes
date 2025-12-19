"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "../container";
import Header from "../header/page";
import Footer from "../footer/page";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { MdOutlineMail } from "react-icons/md";
import { FaPhoneAlt } from "react-icons/fa";
import { FcAddressBook } from "react-icons/fc";
import { TbMapPinCode } from "react-icons/tb";
import Loader from "../loader";
const ProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    pincode: "",
    phone: "",
  });

  useEffect(() => {
    const initializeAndFetch = async () => {
      if (typeof window === "undefined") return;

      const userData = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!userData || !token) {
        router.push("/login");
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        
        // Allow both "user" and "admin" types to access profile
        if (parsedUser.type !== "user" && parsedUser.type !== "admin") {
          router.push("/");
          return;
        }

        // Set user from localStorage first
        setUser(parsedUser);
        setPhotoPreview(parsedUser.photo || null);
        
        // Initialize form data from localStorage user
        setFormData({
          name: parsedUser.name || "",
          email: parsedUser.email || "",
          address: parsedUser.address || "",
          pincode: parsedUser.pincode?.toString() || "",
          phone: parsedUser.phone?.toString() || "",
        });

        // Fetch fresh data from API
        try {
          setLoading(true);
          const response = await fetch("/api/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.ok) {
            // Update form data with fresh data from API
            setFormData({
              name: data.user.name || "",
              email: data.user.email || "",
              address: data.user.address || "",
              pincode: data.user.pincode?.toString() || "",
              phone: data.user.phone?.toString() || "",
            });
            setPhotoPreview(data.user.photo || null);
            setUser(data.user);
            // Update localStorage with fresh data including photo
            localStorage.setItem("user", JSON.stringify(data.user));
          } else {
            toast.error(data.error || "Failed to fetch profile");
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
          // Keep the data from localStorage if API fails
        } finally {
          setLoading(false);
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
        router.push("/login");
      }
    };

    initializeAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login again");
      router.push("/login");
      return;
    }

    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("address", formData.address);
      form.append("pincode", formData.pincode);
      form.append("phone", formData.phone);
      if (photoFile) {
        form.append("photo", photoFile);
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update profile");
        setSaving(false);
        return;
      }

      toast.success("Profile updated successfully!");
      
      // Update localStorage with new user data
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setPhotoFile(null);
      if (data.user.photo) {
        setPhotoPreview(data.user.photo);
      }
      
      // Dispatch event to update header
      window.dispatchEvent(new Event("userUpdated"));
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Header />
        <Container>
          <Loader/>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Header />
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />
      <Container>
        <div className="py-8 md:py-12">
          <h1 className="mb-5 md:mb-6 text-2xl md:text-3xl font-bold text-[#5b3a29]">My Profile</h1>

          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
            {/* Left Column - Profile Form */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border border-[#e5d4c4] bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-[#5b3a29]">
                  Edit Profile
                </h2>
                
                {/* Photo Upload Section */}
                <div className="mb-6 flex sm:flex-row flex-col items-center sm:gap-6 gap-4">
                  <div className="relative">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile"
                        className="h-24 w-24 rounded-full object-cover border-4 border-[#e5d4c4] shadow-md"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-[#e5d4c4] flex items-center justify-center border-4 border-[#e5d4c4]">
                        <svg
                          className="h-12 w-12 text-[#8a6a52]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="photo"
                      className="block text-md font-medium text-[#5b3a29] mb-2"
                    >
                      Profile Photo
                    </label>
                    <input
                      type="file"
                      id="photo"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="w-full text-sm text-[#5b3a29] file:mr-4 file:rounded-full file:border-0 file:bg-[#5b3a29] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#3e261a] cursor-pointer"
                    />
                    <p className="mt-1 text-xs text-[#8a6a52]">
                      Upload a profile photo (JPG, PNG)
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
<div>
  <div className="flex items-center gap-2">
    <MdDriveFileRenameOutline className="text-[#8a6a52] mb-1" />
    <label
      htmlFor="name"
      className="mb-1 block text-md font-medium text-[#8a6a52]"
    >
      Name *
    </label>
  </div>

  <input
    type="text"
    id="name"
    name="name"
    value={formData.name}
    onChange={handleChange}
    required
    className="w-full rounded-lg border border-[#e5d4c4] bg-white px-4 py-2 text-sm text-[#5b3a29] outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
  />
</div>
                  <div>
                    
  <div className="flex items-center gap-2">
    <MdOutlineMail  className="text-[#8a6a52] mb-1" />
                    <label
                      htmlFor="email"
                      className="mb-1 block text-md font-medium text-[#8a6a52]"
                    >
                      Email *
                    </label>
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-[#e5d4c4] bg-white px-4 py-2 text-sm text-[#5b3a29] outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                    />
                  </div>

                  <div>
                    
  <div className="flex items-center gap-2">
                    <FaPhoneAlt  className="text-[#8a6a52] mb-2" />
                    <label
                      htmlFor="phone"
                      className="mb-1 block text-md font-medium text-[#8a6a52]"
                    >
                      Phone Number
                    </label>
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-[#e5d4c4] bg-white px-4 py-2 text-sm text-[#5b3a29] outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                    />
                  </div>

                  <div>
                    
  <div className="flex items-center gap-2">
                    <FcAddressBook  className="text-[#8a6a52] mb-1" />
                    <label
                      htmlFor="address"
                      className="mb-1 block text-md font-medium text-[#8a6a52]"
                    >
                      Address
                    </label>
                    </div>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="3"
                      className="w-full rounded-lg border border-[#e5d4c4] bg-white px-4 py-2 text-sm text-[#5b3a29] outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                    />
                  </div>

                  <div>
                    
  <div className="flex items-center gap-2">
                    <TbMapPinCode  className="text-[#8a6a52] mb-1"  />
                    <label
                      htmlFor="pincode"
                      className="mb-1 block text-md font-medium text-[#8a6a52]"
                    >
                      Pincode
                    </label>
                    </div>
                    <input
                      type="number"
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-[#e5d4c4] bg-white px-4 py-2 text-sm text-[#5b3a29] outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-full bg-[#5b3a29] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#3e261a] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column - Quick Links */}
            <div className="lg:col-span-1">
              <div className="rounded-lg border border-[#e5d4c4] bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-[#5b3a29]">
                  Quick Links
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push("/orders")}
                    className="w-full rounded-lg border border-[#e5d4c4] bg-white px-4 py-3 text-left text-sm font-medium text-[#5b3a29] transition hover:bg-[#fff4ea] hover:border-[#5b3a29] flex items-center gap-2"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    My Orders
                  </button>
                  <button
                    onClick={() => router.push("/category/cake")}
                    className="w-full rounded-lg border border-[#e5d4c4] bg-white px-4 py-3 text-left text-sm font-medium text-[#5b3a29] transition hover:bg-[#fff4ea] hover:border-[#5b3a29] flex items-center gap-2"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    Browse Cakes
                  </button>
                  <button
                    onClick={() => router.push("/category/pastry")}
                    className="w-full rounded-lg border border-[#e5d4c4] bg-white px-4 py-3 text-left text-sm font-medium text-[#5b3a29] transition hover:bg-[#fff4ea] hover:border-[#5b3a29] flex items-center gap-2"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    Browse Pastries
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
      <Footer/>
    </div>
  );
};

export default ProfilePage;

