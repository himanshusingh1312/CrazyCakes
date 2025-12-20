"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import {
  FiMessageSquare,
  FiArrowLeft,
  FiX,
  FiSearch,
  FiHelpCircle,
  FiPackage,
  FiLock,
  FiLogIn,
} from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

const AssistantWidget = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [questionType, setQuestionType] = useState("products");
  
  // Always start with fresh welcome message
  const getInitialMessage = () => ({
    role: "assistant",
    text: "Hi! I'm your Crazy Cakes assistant.\nHow can I help you today?",
    products: [],
  });
  
  const [messages, setMessages] = useState([getInitialMessage()]);
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [searchedOrders, setSearchedOrders] = useState([]);
  const [showFAQs, setShowFAQs] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bookingStep, setBookingStep] = useState(null); // null, "area", "size", "deliveryType", "instruction", "date", "time", "address", "phone", "confirm"
  const [bookingFormData, setBookingFormData] = useState({
    area: "",
    size: "",
    deliveryType: "",
    deliveryDate: "",
    deliveryTime: "",
    instruction: "",
    address: "",
    phone: "",
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [contactStep, setContactStep] = useState(null); // null, "name", "phone", "description", "confirm"
  const [contactFormData, setContactFormData] = useState({
    name: "",
    phone: "",
    description: "",
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // Reset messages when question type changes
  useEffect(() => {
    if (isOpen) {
      setMessages([getInitialMessage()]);
      setProductName("");
      setOrderSearchQuery("");
      setSearchedOrders([]);
      setShowFAQs(false);
      setExpandedFAQ(null);
      setContactStep(null);
      setContactFormData({
        name: "",
        phone: "",
        description: "",
      });
      setContactLoading(false);
      setContactSuccess(false);
    }
  }, [questionType, isOpen]);

  // Reset booking state when assistant is closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedProduct(null);
      setBookingStep(null);
      setBookingFormData({
        area: "",
        size: "",
        deliveryType: "",
        deliveryDate: "",
        deliveryTime: "",
        instruction: "",
        address: "",
        phone: "",
      });
      setBookingLoading(false);
      setBookingSuccess(false);
      setContactStep(null);
      setContactFormData({
        name: "",
        phone: "",
        description: "",
      });
      setContactLoading(false);
      setContactSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setIsAuthenticated(!!token);
  }, [isOpen]);


  // Check if input is a natural language query
  const isNaturalLanguageQuery = (text) => {
    if (!text || text.trim().length < 5) return false;
    const lowerText = text.toLowerCase();
    const naturalLanguageIndicators = [
      "i want", "show me", "i need", "looking for", "find me",
      "under", "below", "less than", "upto", "up to",
      "above", "over", "more than", "from",
      "with", "having", "star", "rating", "stars",
      "and", "or", "between"
    ];
    return naturalLanguageIndicators.some(indicator => lowerText.includes(indicator));
  };

  const handleSearch = async () => {
    if (loading) return;

    // Check if productName is a natural language query
    const isNLQuery = productName && isNaturalLanguageQuery(productName);
    const queryText = isNLQuery ? productName.trim() : null;

    if (isNLQuery && queryText) {
      // Use Gemini API for natural language queries
      const userMessage = { role: "user", text: queryText, products: [] };
      setMessages((prev) => [...prev, userMessage]);

      try {
        setLoading(true);
        const res = await fetch("/api/chat/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: queryText }),
        });

        const data = await res.json();

        if (!res.ok) {
          const errorText =
            data?.error || "Something went wrong with AI search. Please try again.";
          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: errorText, products: [] },
          ]);
          return;
        }

        const assistantMessage = {
          role: "assistant",
          text: data.reply || data.explanation || "Here are some products for you:",
          products: data.products || [],
        };

        setMessages((prev) => [...prev, assistantMessage]);
        // Clear the input after successful search
        setProductName("");
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Sorry, I encountered an error. Please try again.",
            products: [],
          },
        ]);
      } finally {
        setLoading(false);
      }
    } else {
      // Use filter-based search for simple product names
      const filters = { nameContains: productName.trim() };
      const userMessage = { role: "user", text: productName, products: [] };
      setMessages((prev) => [...prev, userMessage]);

      try {
        setLoading(true);
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filters }),
        });

        const data = await res.json();

        if (!res.ok) {
          const errorText =
            data?.error || "Something went wrong while talking to the assistant.";
          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: errorText, products: [] },
          ]);
          return;
        }

        const assistantMessage = {
          role: "assistant",
          text: data.reply || "Here are some products for you:",
          products: data.products || [],
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Sorry, I encountered an error. Please try again.",
            products: [],
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOrderSearch = async () => {
    if (loading || !orderSearchQuery.trim()) return;

    const userMessage = {
      role: "user",
      text: `Search for order: ${orderSearchQuery}`,
      products: [],
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Please login to search for orders.",
            products: [],
          },
        ]);
        return;
      }

      const res = await fetch("/api/orders/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ searchQuery: orderSearchQuery.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.error || "No orders found.",
            products: [],
          },
        ]);
        return;
      }

      const assistantMessage = {
        role: "assistant",
        text: `I found ${data.orders.length} order(s) matching "${orderSearchQuery}":`,
        orders: data.orders || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setSearchedOrders(data.orders || []);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I encountered an error. Please try again.",
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleBookNow = async () => {
    if (!bookingFormData.area || !bookingFormData.size || !bookingFormData.deliveryDate || !bookingFormData.deliveryTime || !bookingFormData.address || !bookingFormData.phone) {
      toast.error("Please fill all required fields");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to book");
      router.push("/login");
      return;
    }

    setBookingLoading(true);

    try {
      const form = new FormData();
      form.append("productId", selectedProduct._id);
      form.append("city", "Lucknow");
      form.append("area", bookingFormData.area);
      form.append("size", bookingFormData.size);
      form.append("instruction", bookingFormData.instruction || "");
      form.append("deliveryType", bookingFormData.deliveryType);
      form.append("deliveryDate", bookingFormData.deliveryDate);
      form.append("deliveryTime", bookingFormData.deliveryTime);
      form.append("originalPrice", selectedProduct.price.toString());
      form.append("sizeMultiplier", bookingFormData.size);
      form.append("phone", bookingFormData.phone);
      form.append("address", bookingFormData.address);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to book order");
        setBookingLoading(false);
        return;
      }

      setBookingSuccess(true);
      setBookingStep(null);
      setMessages((prev) => [
        ...prev,
        { role: "user", text: "Book Now", products: [] },
        { role: "assistant", text: "✅ Order booked successfully!", products: [] },
      ]);
      setBookingLoading(false);
      
      // Reset booking state after showing success message (auto-clear after 5 seconds)
      setTimeout(() => {
        setSelectedProduct(null);
        setBookingFormData({
          area: "",
          size: "",
          deliveryType: "",
          deliveryDate: "",
          deliveryTime: "",
          instruction: "",
          address: "",
          phone: "",
        });
        setBookingSuccess(false);
      }, 5000);
    } catch (err) {
      toast.error("Something went wrong");
      setBookingLoading(false);
    }
  };

  const handleContactSubmit = async () => {
    if (!contactFormData.name || !contactFormData.phone || !contactFormData.description) {
      toast.error("Please fill all fields");
      return;
    }

    setContactLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to send message");
        setContactLoading(false);
        return;
      }

      setContactSuccess(true);
      setContactStep(null);
      setMessages((prev) => [
        ...prev,
        { role: "user", text: `Name: ${contactFormData.name}\nPhone: ${contactFormData.phone}\nMessage: ${contactFormData.description}`, products: [] },
        { role: "assistant", text: "✅ Message sent successfully! We'll get back to you soon.", products: [] },
      ]);
      setContactLoading(false);
      
      // Reset contact form after showing success message
      setTimeout(() => {
        setContactFormData({
          name: "",
          phone: "",
          description: "",
        });
        setContactSuccess(false);
      }, 5000);
    } catch (err) {
      toast.error("Something went wrong");
      setContactLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 bottom-4 z-50 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#5b3a29] to-[#8a6a52] text-white shadow-2xl transition-all duration-300 hover:from-[#4c3022] hover:to-[#5b3a29] hover:scale-110 hover:shadow-[0_10px_40px_rgba(91,58,41,0.4)] animate-bounce-subtle"
        title="Open Assistant"
        style={{
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      >
        <FiMessageSquare className="h-6 w-6 sm:h-7 sm:w-7 transition-transform duration-300 hover:rotate-12" />
      </button>
    );
  }

  return (
    <div 
      className="fixed right-3 bottom-4 sm:right-4 z-50 flex h-[560px] sm:h-[600px] w-[280px] md:w-[380px] sm:w-[300px] flex-col rounded-2xl border-2 border-[#e5d4c4] bg-white shadow-2xl overflow-hidden animate-slide-up"
      style={{
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#e5d4c4] bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-4 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-200 transition-all duration-200 hover:scale-110 rounded-full p-1 hover:bg-white/20"
          >
            <FiArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Customer Support</h3>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-gray-200 transition-all duration-200 hover:scale-110 rounded-full p-1 hover:bg-white/20"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>

      {/* Question Type Tabs or Login Prompt */}
      {isAuthenticated === false ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#fdf7f0] to-white px-4 py-6 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5b3a29]/10 text-[#5b3a29]">
            <FiLock className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-[#5b3a29]">Login required</h4>
          <p className="text-xs text-[#8a6a52]">Sign in to use the assistant for products, help, and orders.</p>
          <button
            onClick={() => router.push("/login")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-[#4c3022] hover:to-[#5b3a29]"
          >
            <FiLogIn className="h-4 w-4" />
            Go to Login
          </button>
        </div>
      ) : (
        <>
          <div className="border-b-2 border-[#f1e4d8] bg-gradient-to-b from-[#fdf7f0] to-white px-3 py-2 shadow-sm">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setQuestionType("products")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-300 transform ${
                  questionType === "products"
                    ? "bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] text-white shadow-md scale-105"
                    : "bg-white text-[#5b3a29] border-2 border-[#e5d4c4] hover:border-[#5b3a29] hover:scale-105"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <FiSearch className="h-4 w-4" /> Products
                </span>
              </button>
              <button
                type="button"
                onClick={() => setQuestionType("help")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-300 transform ${
                  questionType === "help"
                    ? "bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] text-white shadow-md scale-105"
                    : "bg-white text-[#5b3a29] border-2 border-[#e5d4c4] hover:border-[#5b3a29] hover:scale-105"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <FiHelpCircle className="h-4 w-4" /> Help
                </span>
              </button>
              <button
                type="button"
                onClick={() => setQuestionType("orders")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-300 transform ${
                  questionType === "orders"
                    ? "bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] text-white shadow-md scale-105"
                    : "bg-white text-[#5b3a29] border-2 border-[#e5d4c4] hover:border-[#5b3a29] hover:scale-105"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <FiPackage className="h-4 w-4" /> Orders
                </span>
              </button>
            </div>
          </div>

      {/* Product Search */}
      {questionType === "products" && (
        <div className="border-b-2 border-[#f1e4d8] bg-gradient-to-b from-[#fdf7f0] to-white px-3 py-3 space-y-2 animate-fade-in">
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="🔍 Search by name or ask naturally (e.g., 'cake under 5000', 'pastry with 4 star')"
            className="w-full rounded-lg border-2 border-[#e5d4c4] bg-white px-3 py-2 text-xs text-[#5b3a29] outline-none transition-all duration-200 focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20 hover:border-[#8a6a52]"
            onKeyPress={(e) => {
              if (e.key === "Enter" && !loading) {
                handleSearch();
              }
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-4 py-2 text-xs font-bold text-white transition-all duration-300 hover:from-[#4c3022] hover:to-[#5b3a29] disabled:opacity-50 transform hover:scale-105 hover:shadow-lg disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </span>
            ) : (
              "🔍 Search Products"
            )}
          </button>
        </div>
      )}

      {/* Order Search */}
      {questionType === "orders" && (
        <div className="border-b-2 border-[#f1e4d8] bg-gradient-to-b from-[#fdf7f0] to-white px-3 py-3 animate-fade-in">
          <input
            type="text"
            value={orderSearchQuery}
            onChange={(e) => setOrderSearchQuery(e.target.value)}
            placeholder="🔍 Search by Order ID or product name..."
            className="w-full rounded-lg border-2 border-[#e5d4c4] bg-white px-3 py-2 text-xs text-[#5b3a29] outline-none transition-all duration-200 focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20 hover:border-[#8a6a52]"
            onKeyPress={(e) => {
              if (e.key === "Enter" && !loading) {
                handleOrderSearch();
              }
            }}
          />
          <button
            onClick={handleOrderSearch}
            disabled={loading || !orderSearchQuery.trim()}
            className="mt-2 w-full rounded-lg bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-4 py-2 text-xs font-bold text-white transition-all duration-300 hover:from-[#4c3022] hover:to-[#5b3a29] disabled:opacity-50 transform hover:scale-105 hover:shadow-lg disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </span>
            ) : (
              "🔍 Search Orders"
            )}
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-[#fdf7f0] p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex animate-message-slide ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
            style={{
              animation: `slideIn${msg.role === "user" ? "Right" : "Left"} 0.3s ease-out`,
              animationDelay: `${idx * 0.1}s`,
            }}
          >
            {msg.role === "assistant" && (
              <div className="mr-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5b3a29] to-[#8a6a52] text-white text-xs font-bold shadow-md">
                AI
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs shadow-md transition-all duration-300 hover:shadow-lg ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-[#5b3a29] to-[#8a6a52] text-white"
                  : "bg-gradient-to-br from-[#f9f4ee] to-white text-[#5b3a29] border border-[#e5d4c4]"
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
              
              {/* Booking Form Steps */}
              {msg.role === "assistant" && bookingStep && idx === messages.length - 1 && (
                <div className="mt-3 space-y-2">
                  {bookingStep === "area" && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={bookingFormData.area}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, area: e.target.value })}
                        placeholder="Enter your area..."
                        className="w-full rounded-lg border-2 border-[#e5d4c4] bg-white px-3 py-2 text-xs text-[#5b3a29] outline-none focus:border-[#5b3a29]"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && bookingFormData.area.trim()) {
                            setBookingStep("size");
                            setMessages((prev) => [
                              ...prev,
                              { role: "user", text: bookingFormData.area, products: [] },
                              { role: "assistant", text: "✅ Area saved!\n\n⚖️ Please select the size (kg) - maximum 12 kg:", products: [] },
                            ]);
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (bookingFormData.area.trim()) {
                            setBookingStep("size");
                            setMessages((prev) => [
                              ...prev,
                              { role: "user", text: bookingFormData.area, products: [] },
                              { role: "assistant", text: "✅ Area saved!\n\n⚖️ Please select the size (kg) - maximum 12 kg:", products: [] },
                            ]);
                          }
                        }}
                        disabled={!bookingFormData.area.trim()}
                        className="w-full rounded-lg bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-3 py-2 text-xs font-semibold text-white hover:from-[#4c3022] hover:to-[#5b3a29] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
                  )}
                  
                  {bookingStep === "size" && (
                    <div className="space-y-2">
                      <select
                        value={bookingFormData.size}
                        onChange={(e) => {
                          setBookingFormData({ ...bookingFormData, size: e.target.value });
                          if (e.target.value) {
                            setBookingStep("deliveryType");
                            setMessages((prev) => [
                              ...prev,
                              { role: "user", text: `${e.target.value} kg`, products: [] },
                              { role: "assistant", text: "✅ Size selected!\n\n🚚 Please select delivery type:", products: [] },
                            ]);
                          }
                        }}
                        className="w-full rounded-lg border-2 border-[#e5d4c4] bg-white px-3 py-2 text-xs text-[#5b3a29] outline-none focus:border-[#5b3a29]"
                      >
                        <option value="">Select Size (kg)</option>
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((size) => (
                          <option key={size} value={size}>{size} kg</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {bookingStep === "deliveryType" && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setBookingFormData({ ...bookingFormData, deliveryType: "pickup" });
                            setBookingStep("instruction");
                            setMessages((prev) => [
                              ...prev,
                              { role: "user", text: "Pickup", products: [] },
                              { role: "assistant", text: "✅ Delivery type selected!\n\n📝 Any special instructions? (Optional - you can skip this)", products: [] },
                            ]);
                          }}
                          className="flex-1 rounded-lg bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-3 py-2 text-xs font-semibold text-white hover:from-[#4c3022] hover:to-[#5b3a29] transition"
                        >
                          Pickup
                        </button>
                        <button
                          onClick={() => {
                            setBookingFormData({ ...bookingFormData, deliveryType: "delivery" });
                            setBookingStep("instruction");
                            setMessages((prev) => [
                              ...prev,
                              { role: "user", text: "Delivery", products: [] },
                              { role: "assistant", text: "✅ Delivery type selected!\n\n📝 Any special instructions? (Optional - you can skip this)", products: [] },
                            ]);
                          }}
                          className="flex-1 rounded-lg bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-3 py-2 text-xs font-semibold text-white hover:from-[#4c3022] hover:to-[#5b3a29] transition"
                        >
                          Delivery
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {bookingStep === "instruction" && (
                    <div className="space-y-2">
                      <textarea
                        value={bookingFormData.instruction}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, instruction: e.target.value })}
                        placeholder="Enter special instructions (optional)..."
                        rows={2}
                        className="w-full rounded-lg border-2 border-[#e5d4c4] bg-white px-3 py-2 text-xs text-[#5b3a29] outline-none focus:border-[#5b3a29]"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setBookingStep("date");
                            setMessages((prev) => [
                              ...prev,
                              { role: "user", text: bookingFormData.instruction || "Skip", products: [] },
                              { role: "assistant", text: "✅ Instructions noted!\n\n📅 Please select delivery date:", products: [] },
                            ]);
                          }}
                          className="flex-1 rounded-lg bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-3 py-2 text-xs font-semibold text-white hover:from-[#4c3022] hover:to-[#5b3a29] transition"
                        >
                          {bookingFormData.instruction ? "Continue" : "Skip"}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {bookingStep === "date" && (
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={bookingFormData.deliveryDate}
                        onChange={(e) => {
                          setBookingFormData({ ...bookingFormData, deliveryDate: e.target.value });
                          if (e.target.value) {
                            setBookingStep("time");
                            setMessages((prev) => [
                              ...prev,
                              { role: "user", text: e.target.value, products: [] },
                              { role: "assistant", text: "✅ Date selected!\n\n⏰ Please select delivery time:", products: [] },
                            ]);
                          }
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full rounded-lg border-2 border-[#e5d4c4] bg-white px-3 py-2 text-xs text-[#5b3a29] outline-none focus:border-[#5b3a29]"
                      />
                    </div>
                  )}
                  
                  {bookingStep === "time" && (
                    <div className="space-y-2">
                      <input
                        type="time"
                        value={bookingFormData.deliveryTime}
                        onChange={(e) => {
                          setBookingFormData({ ...bookingFormData, deliveryTime: e.target.value });
                          if (e.target.value) {
                            setBookingStep("address");
                            setMessages((prev) => [
                              ...prev,
                              { role: "user", text: e.target.value, products: [] },
                              { role: "assistant", text: "✅ Time selected!\n\n🏠 Please enter your full address:", products: [] },
                            ]);
                          }
                        }}
                        className="w-full rounded-lg border-2 border-[#e5d4c4] bg-white px-3 py-2 text-xs text-[#5b3a29] outline-none focus:border-[#5b3a29]"
                      />
                    </div>
                  )}
                  
                  {bookingStep === "address" && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={bookingFormData.address}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, address: e.target.value })}
                        placeholder="Enter your full address..."
                        className="w-full rounded-lg border-2 border-[#e5d4c4] bg-white px-3 py-2 text-xs text-[#5b3a29] outline-none focus:border-[#5b3a29]"
                      />
                      <button
                        onClick={() => {
                          if (bookingFormData.address.trim()) {
                            setBookingStep("phone");
                            setMessages((prev) => [
                              ...prev,
                              { role: "user", text: bookingFormData.address, products: [] },
                              { role: "assistant", text: "✅ Address saved!\n\n📞 Please enter your phone number:", products: [] },
                            ]);
                          }
                        }}
                        disabled={!bookingFormData.address.trim()}
                        className="w-full rounded-lg bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-3 py-2 text-xs font-semibold text-white hover:from-[#4c3022] hover:to-[#5b3a29] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
                  )}
                  
                  {bookingStep === "phone" && (
                    <div className="space-y-2">
                      <input
                        type="tel"
                        value={bookingFormData.phone}
                        onChange={(e) => setBookingFormData({ ...bookingFormData, phone: e.target.value })}
                        placeholder="Enter your phone number..."
                        className="w-full rounded-lg border-2 border-[#e5d4c4] bg-white px-3 py-2 text-xs text-[#5b3a29] outline-none focus:border-[#5b3a29]"
                      />
                      <button
                        onClick={() => {
                          if (bookingFormData.phone.trim()) {
                            setBookingStep("confirm");
                            const totalPrice = selectedProduct.price * Number(bookingFormData.size) + (bookingFormData.deliveryType === "delivery" ? 50 : 0);
                            setMessages((prev) => [
                              ...prev,
                              { role: "user", text: bookingFormData.phone, products: [] },
                              { role: "assistant", text: `✅ Phone number saved!\n\n📋 Order Summary:\n• Product: ${selectedProduct.name}\n• Size: ${bookingFormData.size} kg\n• Area: ${bookingFormData.area}\n• Delivery: ${bookingFormData.deliveryType === "delivery" ? "Home Delivery" : "Pickup"}\n• Date: ${bookingFormData.deliveryDate}\n• Time: ${bookingFormData.deliveryTime}\n• Total: ${formatPrice(totalPrice)}\n\nReady to book?`, products: [] },
                            ]);
                          }
                        }}
                        disabled={!bookingFormData.phone.trim()}
                        className="w-full rounded-lg bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-3 py-2 text-xs font-semibold text-white hover:from-[#4c3022] hover:to-[#5b3a29] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
                  )}
                  
                  {bookingStep === "confirm" && (
                    <div className="space-y-2">
                      <button
                        onClick={handleBookNow}
                        disabled={bookingLoading}
                        className="w-full rounded-lg bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-4 py-3 text-xs font-bold text-white hover:from-[#4c3022] hover:to-[#5b3a29] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {bookingLoading ? "Booking..." : "📦 Book Now"}
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Success Message */}
              {bookingSuccess && idx === messages.length - 1 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                    <span className="text-2xl">✅</span>
                    <span className="text-xs font-semibold text-green-700">Order booked successfully!</span>
                  </div>
                  <button
                    onClick={() => router.push("/orders")}
                    className="w-full rounded-lg bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-4 py-3 text-xs font-bold text-white hover:from-[#4c3022] hover:to-[#5b3a29] transition"
                  >
                    📦 Go to Orders Page
                  </button>
                </div>
              )}

              {/* Contact Form Steps */}
              {msg.role === "assistant" && contactStep && idx === messages.length - 1 && (
                <div className="mt-3 space-y-2">
                  {contactStep === "name" && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={contactFormData.name}
                        onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                        placeholder="Enter your name..."
                        className="w-full rounded-lg border-2 border-[#e5d4c4] bg-white px-3 py-2 text-xs text-[#5b3a29] outline-none focus:border-[#5b3a29]"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && contactFormData.name.trim()) {
                            setContactStep("phone");
                            setMessages((prev) => [
                              ...prev,
                              { role: "user", text: contactFormData.name, products: [] },
                              { role: "assistant", text: "✅ Name saved!\n\n📞 Please enter your phone number:", products: [] },
                            ]);
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (contactFormData.name.trim()) {
                            setContactStep("phone");
                            setMessages((prev) => [
                              ...prev,
                              { role: "user", text: contactFormData.name, products: [] },
                              { role: "assistant", text: "✅ Name saved!\n\n📞 Please enter your phone number:", products: [] },
                            ]);
                          }
                        }}
                        disabled={!contactFormData.name.trim()}
                        className="w-full rounded-lg bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-3 py-2 text-xs font-semibold text-white hover:from-[#4c3022] hover:to-[#5b3a29] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
                  )}
                  
                  {contactStep === "phone" && (
                    <div className="space-y-2">
                      <input
                        type="tel"
                        value={contactFormData.phone}
                        onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                        placeholder="Enter your phone number..."
                        className="w-full rounded-lg border-2 border-[#e5d4c4] bg-white px-3 py-2 text-xs text-[#5b3a29] outline-none focus:border-[#5b3a29]"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && contactFormData.phone.trim()) {
                            setContactStep("description");
                            setMessages((prev) => [
                              ...prev,
                              { role: "user", text: contactFormData.phone, products: [] },
                              { role: "assistant", text: "✅ Phone number saved!\n\n📝 Please enter your message or description:", products: [] },
                            ]);
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (contactFormData.phone.trim()) {
                            setContactStep("description");
                            setMessages((prev) => [
                              ...prev,
                              { role: "user", text: contactFormData.phone, products: [] },
                              { role: "assistant", text: "✅ Phone number saved!\n\n📝 Please enter your message or description:", products: [] },
                            ]);
                          }
                        }}
                        disabled={!contactFormData.phone.trim()}
                        className="w-full rounded-lg bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-3 py-2 text-xs font-semibold text-white hover:from-[#4c3022] hover:to-[#5b3a29] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
                  )}
                  
                  {contactStep === "description" && (
                    <div className="space-y-2">
                      <textarea
                        value={contactFormData.description}
                        onChange={(e) => setContactFormData({ ...contactFormData, description: e.target.value })}
                        placeholder="Enter your message or description..."
                        rows={4}
                        className="w-full rounded-lg border-2 border-[#e5d4c4] bg-white px-3 py-2 text-xs text-[#5b3a29] outline-none focus:border-[#5b3a29] resize-none"
                      />
                      <button
                        onClick={() => {
                          if (contactFormData.description.trim()) {
                            setContactStep("confirm");
                            setMessages((prev) => [
                              ...prev,
                              { role: "user", text: contactFormData.description, products: [] },
                              { role: "assistant", text: "✅ Message saved!\n\n📋 Review your contact details:\n• Name: " + contactFormData.name + "\n• Phone: " + contactFormData.phone + "\n• Message: " + contactFormData.description + "\n\nReady to send?", products: [] },
                            ]);
                          }
                        }}
                        disabled={!contactFormData.description.trim()}
                        className="w-full rounded-lg bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-3 py-2 text-xs font-semibold text-white hover:from-[#4c3022] hover:to-[#5b3a29] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
                  )}
                  
                  {contactStep === "confirm" && (
                    <div className="space-y-2">
                      <button
                        onClick={handleContactSubmit}
                        disabled={contactLoading}
                        className="w-full rounded-lg bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-4 py-3 text-xs font-bold text-white hover:from-[#4c3022] hover:to-[#5b3a29] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {contactLoading ? "Sending..." : "📧 Send Message"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Success Message */}
              {contactSuccess && idx === messages.length - 1 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                    <span className="text-2xl">✅</span>
                    <span className="text-xs font-semibold text-green-700">Message sent successfully!</span>
                  </div>
                </div>
              )}
              
              {/* Products Grid */}
              {msg.products && msg.products.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {msg.products.map((product, productIdx) => {
                    const images = Array.isArray(product.images) ? product.images : [];
                    const mainImage = images[0].url;
                    return (
                      <div
                        key={product._id}
                        onClick={() => router.push(`/product/${product._id}`)}
                        className="cursor-pointer overflow-hidden rounded-xl border-2 border-[#e5d4c4] bg-white text-left text-[#5b3a29] transition-all duration-300 hover:border-[#5b3a29] hover:shadow-lg hover:scale-105 transform"
                        style={{
                          animation: `fadeInUp 0.4s ease-out`,
                          animationDelay: `${productIdx * 0.1}s`,
                        }}
                      >
                        <div className="relative h-24 w-full overflow-hidden bg-gradient-to-br from-[#f1e4d8] to-[#fffaf3]">
                          {mainImage ? (
                            <img
                              src={mainImage}
                              alt={product.name}
                              className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-[#8a6a52]">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <h3 className="mb-1.5 text-xs font-bold line-clamp-1">
                            {product.name}
                          </h3>
                          <p className="text-xs font-bold text-[#5b3a29] mb-2">
                            {formatPrice(product.price)}
                          </p>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/product/${product._id}`);
                              }}
                              className="flex-1 rounded-lg bg-white border-2 border-[#5b3a29] px-2 py-1 text-[10px] font-semibold text-[#5b3a29] hover:bg-[#fff4ea] transition"
                            >
                              View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct(product);
                                setBookingStep("area");
                                setBookingFormData({
                                  area: "",
                                  size: "",
                                  deliveryType: "",
                                  deliveryDate: "",
                                  deliveryTime: "",
                                  instruction: "",
                                  address: "",
                                  phone: "",
                                });
                                setBookingSuccess(false);
                                // Add assistant message asking for area
                                setMessages((prev) => [
                                  ...prev,
                                  {
                                    role: "assistant",
                                    text: `Great choice! I'll help you book "${product.name}".\n\n📍 Please enter your area:`,
                                    products: [],
                                  },
                                ]);
                              }}
                              className="flex-1 rounded-lg bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-2 py-1 text-[10px] font-semibold text-white hover:from-[#4c3022] hover:to-[#5b3a29] transition"
                            >
                              Book
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Orders List */}
              {msg.orders && msg.orders.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.orders.map((order, orderIdx) => (
                    <div
                      key={order._id}
                      className="rounded-xl border-2 border-[#e5d4c4] bg-gradient-to-br from-white to-[#f9f4ee] p-3 text-xs cursor-pointer transition-all duration-300 hover:border-[#5b3a29] hover:shadow-lg hover:scale-105 transform"
                      onClick={() => router.push("/orders")}
                      style={{
                        animation: `fadeInUp 0.4s ease-out`,
                        animationDelay: `${orderIdx * 0.1}s`,
                      }}
                    >
                      <p className="font-bold text-[#5b3a29] mb-1">{order.product?.name}</p>
                      <p className="text-[#8a6a52] text-[10px] mb-1">
                        Order ID: {order._id?.toString().slice(-8)}
                      </p>
                      <p className="text-[#8a6a52] font-semibold">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)} • {formatPrice(order.totalPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Help Options */}
              {msg.role === "assistant" && questionType === "help" && idx === messages.length - 1 && (
                <div className="mt-3 space-y-2">
                  {!showFAQs ? (
                    <>
                      <button
                        onClick={() => setShowFAQs(true)}
                        className="w-full rounded-xl bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-4 py-2.5 text-xs font-bold text-white transition-all duration-300 hover:from-[#4c3022] hover:to-[#5b3a29] transform hover:scale-105 hover:shadow-lg"
                      >
                        ❓ View FAQs
                      </button>
                      <button
                        onClick={() => {
                          setContactStep("name");
                          setContactFormData({
                            name: "",
                            phone: "",
                            description: "",
                          });
                          setContactSuccess(false);
                          setMessages((prev) => [
                            ...prev,
                            {
                              role: "user",
                              text: "Contact Us",
                              products: [],
                            },
                            {
                              role: "assistant",
                              text: "I'd be happy to help you get in touch!\n\n👤 Please enter your name:",
                              products: [],
                            },
                          ]);
                        }}
                        className="w-full rounded-xl border-2 border-[#e5d4c4] bg-white px-4 py-2.5 text-xs font-semibold text-[#5b3a29] transition-all duration-300 hover:bg-[#f9f4ee] hover:border-[#5b3a29] transform hover:scale-105"
                      >
                        📧 Contact Us
                      </button>
                      <button
                        onClick={() => router.push("/category/cake")}
                        className="w-full rounded-xl border-2 border-[#e5d4c4] bg-white px-4 py-2.5 text-xs font-semibold text-[#5b3a29] transition-all duration-300 hover:bg-[#f9f4ee] hover:border-[#5b3a29] transform hover:scale-105"
                      >
                        🎂 Browse Cakes
                      </button>
                      <button
                        onClick={() => router.push("/category/pastry")}
                        className="w-full rounded-xl border-2 border-[#e5d4c4] bg-white px-4 py-2.5 text-xs font-semibold text-[#5b3a29] transition-all duration-300 hover:bg-[#f9f4ee] hover:border-[#5b3a29] transform hover:scale-105"
                      >
                        🥐 Browse Pastries
                      </button>
                      <button
                        onClick={() => router.push("/orders")}
                        className="w-full rounded-xl border-2 border-[#e5d4c4] bg-white px-4 py-2.5 text-xs font-semibold text-[#5b3a29] transition-all duration-300 hover:bg-[#f9f4ee] hover:border-[#5b3a29] transform hover:scale-105"
                      >
                        📦 My Orders
                      </button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowFAQs(false)}
                        className="w-full rounded-xl border-2 border-[#e5d4c4] bg-white px-4 py-2 text-xs font-semibold text-[#5b3a29] transition-all duration-300 hover:bg-[#f9f4ee] hover:border-[#5b3a29] flex items-center gap-2 transform hover:scale-105"
                      >
                        ← Back
                      </button>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {[
                          {
                            q: "What are your delivery areas?",
                            a: "We currently deliver to Gomti Nagar, Chinnat, Kamta, Matiyari, and Charbagh areas in Lucknow. You can also pick up your order from our store."
                          },
                          {
                            q: "What is the minimum order value?",
                            a: "There is no minimum order value. However, delivery charges of ₹50 apply for home delivery orders."
                          },
                          {
                            q: "How far in advance should I place my order?",
                            a: "We recommend placing your order at least 24-48 hours in advance, especially for custom cakes. However, we also accept same-day orders subject to availability."
                          },
                          {
                            q: "Can I customize my cake?",
                            a: "Yes! You can upload a custom image and add special instructions when placing your order. Our team will do their best to match your requirements."
                          },
                          {
                            q: "What payment methods do you accept?",
                            a: "Currently, we accept cash on delivery and online payments. Payment details will be shared during order confirmation."
                          },
                          {
                            q: "Can I cancel or modify my order?",
                            a: "You can cancel or modify your order by contacting us before we start preparing it. Once preparation begins, modifications may not be possible."
                          },
                          {
                            q: "Do you offer discounts or coupons?",
                            a: "Yes! We offer special discount coupons that you can apply at checkout. Check your account for available coupons or contact us for special offers."
                          },
                          {
                            q: "How do I track my order?",
                            a: "You can track your order status in the 'My Orders' section. The status will update as your order progresses through: Order Accepted → Preparing → Out for Delivery → Delivered."
                          },
                          {
                            q: "What if I'm not satisfied with my order?",
                            a: "We strive for 100% customer satisfaction. If you have any concerns, please contact us immediately through the contact page, and we'll resolve the issue."
                          },
                          {
                            q: "Do you make cakes for special occasions?",
                            a: "Absolutely! We specialize in birthday cakes, anniversary cakes, wedding cakes, and cakes for all special occasions. Just mention your occasion in the special instructions."
                          }
                        ].map((faq, index) => (
                          <div
                            key={index}
                            className="rounded-xl border-2 border-[#e5d4c4] bg-white overflow-hidden transition-all duration-300 hover:border-[#5b3a29] hover:shadow-md"
                            style={{
                              animation: `fadeInUp 0.4s ease-out`,
                              animationDelay: `${index * 0.05}s`,
                            }}
                          >
                            <button
                              onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                              className="w-full px-4 py-3 text-left text-xs font-bold text-[#5b3a29] flex items-center justify-between hover:bg-gradient-to-r hover:from-[#f9f4ee] hover:to-white transition-all duration-300"
                            >
                              <span className="flex-1 pr-2">{faq.q}</span>
                              <svg
                                className={`h-5 w-5 transition-transform duration-300 flex-shrink-0 ${expandedFAQ === index ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {expandedFAQ === index && (
                              <div className="px-4 py-3 text-xs text-[#8a6a52] bg-gradient-to-br from-[#f9f4ee] to-white border-t-2 border-[#e5d4c4] animate-fade-in">
                                {faq.a}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="rounded-2xl bg-gradient-to-br from-[#f9f4ee] to-white border border-[#e5d4c4] px-4 py-3 text-xs text-[#8a6a52] shadow-md">
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-semibold">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
        </>
      )}
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />
    </div>
  );
};

export default AssistantWidget;

