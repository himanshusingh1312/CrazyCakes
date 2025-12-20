"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Container from "../container";
import Header from "../header/page";
import { FiSearch, FiHelpCircle, FiPackage, FiFilter, FiLogIn, FiLock } from "react-icons/fi";

const AssistantPage = () => {
  const router = useRouter();
  const [questionType, setQuestionType] = useState("products"); // "products" | "help" | "orders"
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  
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
  const [aiQuery, setAiQuery] = useState("");
  const [sortBy, setSortBy] = useState("");

  useEffect(() => {
    // block assistant for logged-out users
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setIsAuthenticated(!!token);
  }, []);

  // Reset messages when question type changes
  useEffect(() => {
    setMessages([getInitialMessage()]);
    setProductName("");
    setOrderSearchQuery("");
    setSearchedOrders([]);
    setAiQuery("");
    setSortBy("");
  }, [questionType]);


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

    const searchText = (productName || aiQuery || "").trim();
    if (!searchText) return;

    // Check if it's a natural language query
    const isNLQuery = isNaturalLanguageQuery(searchText);

    const userMessage = { role: "user", text: searchText, products: [] };
    setMessages((prev) => [...prev, userMessage]);

    try {
      setLoading(true);
      
      if (isNLQuery) {
        // Use Gemini API for natural language queries
        const res = await fetch("/api/chat/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchText }),
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

        // Sort products if needed
        let sortedProducts = data.products || [];
        if (sortBy === "price-low") {
          sortedProducts = [...sortedProducts].sort((a, b) => a.price - b.price);
        } else if (sortBy === "price-high") {
          sortedProducts = [...sortedProducts].sort((a, b) => b.price - a.price);
        } else if (sortBy === "rating") {
          sortedProducts = [...sortedProducts].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.reply || data.explanation || "Here are some options for you:",
            products: sortedProducts,
          },
        ]);
      } else {
        // Use filter-based search for simple product names
        const filters = { nameContains: searchText };
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorText =
            data?.error || "Something went wrong while searching. Please try again.";
        setMessages((prev) => [
          ...prev,
            { role: "assistant", text: errorText, products: [] },
        ]);
        return;
      }

        // Sort products if needed
        let sortedProducts = data.products || [];
        if (sortBy === "price-low") {
          sortedProducts = [...sortedProducts].sort((a, b) => a.price - b.price);
        } else if (sortBy === "price-high") {
          sortedProducts = [...sortedProducts].sort((a, b) => b.price - a.price);
        } else if (sortBy === "rating") {
          sortedProducts = [...sortedProducts].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
            text: data.reply || "Here are some products for you:",
            products: sortedProducts,
        },
      ]);
      }
      
      // Clear the input after successful search
      setProductName("");
      setAiQuery("");
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I'm having trouble reaching the server. Please try again.",
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (typeof price !== "number") return "";
    return `₹${price}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      preparing: "bg-purple-100 text-purple-800",
      ready: "bg-blue-100 text-blue-800",
      delivered: "bg-green-200 text-green-900",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleOrderSearch = async () => {
    if (!orderSearchQuery.trim() || loading) return;

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
            text: "Please login to search for your orders.",
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
        body: JSON.stringify({ searchQuery: orderSearchQuery }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.error || "Failed to search orders. Please try again.",
            products: [],
          },
        ]);
        return;
      }

      setSearchedOrders(data.orders || []);

      if (data.orders.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `No orders found matching "${orderSearchQuery}". Please check the product name and try again.`,
            products: [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `Found ${data.orders.length} order${data.orders.length === 1 ? "" : "s"} matching "${orderSearchQuery}":`,
            products: [],
            orders: data.orders,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I'm having trouble searching orders. Please try again.",
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Header />
        <Container>
          <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center py-8 px-4 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#5b3a29]/10 text-[#5b3a29]">
              <FiLock className="h-6 w-6" />
            </div>
            <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-[#5b3a29]">Login required</h1>
            <p className="mb-6 text-sm sm:text-base text-[#8a6a52] max-w-md">
              Please log in to use the AI Cake Assistant for product help, support, and order lookups.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-[#3e261a] hover:to-[#5b3a29]"
            >
              <FiLogIn className="h-4 w-4" />
              Login to continue
            </button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Header />
      <Container>
        <div className="flex min-h-[calc(100vh-80px)] flex-col py-6 sm:py-8 px-3 sm:px-0">
          <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-[#5b3a29] flex items-center gap-2">
            <FiSearch className="h-5 w-5 sm:h-6 sm:w-6" />
            AI Cake Assistant
          </h1>
          <p className="mb-6 text-xs sm:text-sm text-[#8a6a52]">
            Choose what you need help with and I'll guide you.
          </p>

          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#f1e4d8] bg-white">
            {/* Question Type Selector */}
            <div className="border-b border-[#f1e4d8] bg-[#fdf7f0] px-3 sm:px-4 py-3">
              <div className="mb-3 flex gap-1.5 sm:gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setQuestionType("products")}
                  className={`rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition ${
                    questionType === "products"
                      ? "bg-[#5b3a29] text-white"
                      : "bg-white text-[#5b3a29] border border-[#e5d4c4] hover:bg-[#f9f4ee]"
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <FiSearch className="h-4 w-4" /> Product Search
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionType("help")}
                  className={`rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition ${
                    questionType === "help"
                      ? "bg-[#5b3a29] text-white"
                      : "bg-white text-[#5b3a29] border border-[#e5d4c4] hover:bg-[#f9f4ee]"
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <FiHelpCircle className="h-4 w-4" /> Help & Support
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionType("orders")}
                  className={`rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition ${
                    questionType === "orders"
                      ? "bg-[#5b3a29] text-white"
                      : "bg-white text-[#5b3a29] border border-[#e5d4c4] hover:bg-[#f9f4ee]"
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <FiPackage className="h-4 w-4" /> Order Related
                  </span>
                </button>
              </div>
            </div>

            {/* Quick question controls - Only show for product search */}
            {questionType === "products" && (
            <>
                {/* Product Search Input */}
            <div className="border-b border-[#f1e4d8] bg-[#fdf7f0] px-3 sm:px-4 py-3">
              <div className="mb-2">
                <span className="text-sm font-semibold text-[#5b3a29] flex items-center gap-1.5">
                      <FiSearch className="h-4 w-4" /> Search Products
                </span>
                    <p className="mt-1 text-[11px] sm:text-xs text-[#8a6a52]">
                      Search by name or ask naturally (e.g., "cake under 5000", "pastry with 4 star")
                    </p>
              </div>
              <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
                <div className="flex-1 flex flex-col gap-1">
                  <input
                    type="text"
                        value={productName || aiQuery}
                        onChange={(e) => {
                          setProductName(e.target.value);
                          setAiQuery(e.target.value);
                        }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !loading) {
                        handleSearch();
                      }
                    }}
                        placeholder="e.g., Premium cakes, cake under 5000, pastry with 3 star"
                    className="rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-xs sm:text-sm text-[#5b3a29] outline-none focus:border-[#5b3a29] focus:ring-1 focus:ring-[#5b3a29]/30 placeholder:text-gray-400"
                  />
                </div>
                    <div className="flex items-end gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="rounded-lg border border-[#e5d4c4] bg-white px-2.5 py-2 text-[11px] sm:text-xs text-[#5b3a29] outline-none focus:border-[#5b3a29] focus:ring-1 focus:ring-[#5b3a29]/30 flex items-center gap-1"
                      >
                        <option value="">Sort</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Rating: High to Low</option>
                      </select>
                  <button
                    type="button"
                    onClick={handleSearch}
                        disabled={loading || (!productName?.trim() && !aiQuery?.trim())}
                    className="inline-flex items-center justify-center rounded-lg bg-[#5b3a29] px-5 sm:px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4c3022] disabled:cursor-not-allowed disabled:bg-[#b89c83] gap-2"
                  >
                    {loading ? "Searching..." : (
                      <>
                        <FiSearch className="h-4 w-4" />
                        Search
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            </>
            )}

            {/* Help Section */}
            {questionType === "help" && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 space-y-4 overflow-y-auto p-3 sm:p-4">
                  <div className="flex justify-start">
                    <div className="max-w-full rounded-2xl bg-[#f9f4ee] px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#5b3a29] shadow-sm md:max-w-[70%]">
                      <p className="mb-4">
                        I'm here to help! Choose an option below:
                      </p>
                      
                      <div className="space-y-3">
                        {/* Contact Us */}
                        <button
                          type="button"
                          onClick={() => router.push("/contact")}
                          className="w-full rounded-lg bg-[#5b3a29] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4c3022] text-left"
                        >
                          📧 Contact Us - Send us a message
                        </button>

                        {/* FAQ Section */}
                        <div className="rounded-lg border border-[#e5d4c4] bg-white p-3">
                          <h3 className="mb-2 text-xs font-semibold text-[#5b3a29]">
                            Frequently Asked Questions:
                          </h3>
                          <div className="space-y-2 text-xs text-[#8a6a52]">
                            <div>
                              <strong className="text-[#5b3a29]">Q: What are your delivery areas?</strong>
                              <p className="mt-1">A: We deliver to Gomti Nagar, Chinnat, Kamta, Matiyari, and Charbagh in Lucknow.</p>
                            </div>
                            <div>
                              <strong className="text-[#5b3a29]">Q: What are your delivery charges?</strong>
                              <p className="mt-1">A: Home delivery charges are ₹50. Pickup from store is free.</p>
                            </div>
                            <div>
                              <strong className="text-[#5b3a29]">Q: Can I customize my cake?</strong>
                              <p className="mt-1">A: Yes! You can upload a custom image and add special instructions when booking.</p>
                            </div>
                            <div>
                              <strong className="text-[#5b3a29]">Q: What sizes are available?</strong>
                              <p className="mt-1">A: We offer cakes from 2kg to 10kg. Price is calculated per kg.</p>
                            </div>
                            <div>
                              <strong className="text-[#5b3a29]">Q: How do I track my order?</strong>
                              <p className="mt-1">A: Visit "My Orders" page to see your order status and updates.</p>
                            </div>
                          </div>
                        </div>

                        {/* Business Information */}
                        <div className="rounded-lg border border-[#e5d4c4] bg-white p-3">
                          <h3 className="mb-2 text-xs font-semibold text-[#5b3a29]">
                            Business Information:
                          </h3>
                          <div className="space-y-1 text-xs text-[#8a6a52]">
                            <div className="flex items-center gap-2">
                              <span>📍</span>
                              <span>Location: Lucknow, Uttar Pradesh</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>🕐</span>
                              <span>Hours: Daily 9:00 AM - 9:00 PM</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>📞</span>
                              <span>Phone: Available on Contact Page</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>✉️</span>
                              <span>Email: Available on Contact Page</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Links */}
                        <div className="rounded-lg border border-[#e5d4c4] bg-white p-3">
                          <h3 className="mb-2 text-xs font-semibold text-[#5b3a29]">
                            Quick Links:
                          </h3>
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => router.push("/category/cake")}
                              className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-xs text-[#5b3a29] transition hover:bg-[#f9f4ee] text-left"
                            >
                              🎂 Browse Cakes
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push("/category/pastry")}
                              className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-xs text-[#5b3a29] transition hover:bg-[#f9f4ee] text-left"
                            >
                              🥐 Browse Pastries
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push("/orders")}
                              className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-xs text-[#5b3a29] transition hover:bg-[#f9f4ee] text-left"
                            >
                              📦 My Orders
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Section */}
            {questionType === "orders" && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="border-b border-[#f1e4d8] bg-[#fdf7f0] px-4 py-3">
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => router.push("/orders")}
                      className="w-full rounded-lg bg-[#5b3a29] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4c3022]"
                    >
                      1. Go to My Orders Page
                    </button>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleOrderSearch();
                          }
                        }}
                        placeholder="2. Enter product name to search order..."
                        className="flex-1 rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm text-[#5b3a29] outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                      />
                      <button
                        type="button"
                        onClick={handleOrderSearch}
                        disabled={loading || !orderSearchQuery.trim()}
                        className="rounded-lg bg-[#5b3a29] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4c3022] disabled:cursor-not-allowed disabled:bg-[#b89c83]"
                      >
                        {loading ? "Searching..." : "Search"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {messages
                    .filter((msg) => msg.orders)
                    .map((msg, idx) => (
                      <div key={`order-${idx}`} className="space-y-4">
                        <div className="flex justify-start">
                          <div className="max-w-full rounded-2xl bg-[#f9f4ee] px-4 py-3 text-sm text-[#5b3a29] shadow-sm md:max-w-[70%]">
                            <p className="mb-3 whitespace-pre-line">{msg.text}</p>
                            {msg.orders && msg.orders.length > 0 && (
                              <div className="space-y-4">
                                {msg.orders.map((order) => (
                                  <div
                                    key={order._id}
                                    className="overflow-hidden rounded-xl border border-[#f1e4d8] bg-white p-4"
                                  >
                                    <div className="mb-3 flex items-start gap-3">
                                      {order.product?.images?.[0] && (
                                        <img
                                          src={order.product.images[0]}
                                          alt={order.product?.name}
                                          className="h-16 w-16 rounded-lg object-cover"
                                          onError={(e) => {
                                            e.target.style.display = "none";
                                          }}
                                        />
                                      )}
                                      <div className="flex-1">
                                        <h3 className="mb-1 text-sm font-semibold text-[#5b3a29]">
                                          {order.product?.name || "Product"}
                                        </h3>
                                        <p className="text-xs text-[#8a6a52]">
                                          Size: {order.size} kg
                                        </p>
                                        <p className="text-xs text-[#8a6a52]">
                                          {order.city} - {order.area.charAt(0).toUpperCase() + order.area.slice(1)}
                                        </p>
                                      </div>
                                      <span
                                        className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                                          order.status
                                        )}`}
                                      >
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                      </span>
                                    </div>
                                    <div className="space-y-1 border-t border-[#f1e4d8] pt-2 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-[#8a6a52]">Delivery:</span>
                                        <span className="font-medium text-[#5b3a29]">
                                          {order.deliveryType === "delivery" ? "Home Delivery" : "Pick up"}
                                        </span>
                                      </div>
                                      {order.deliveryDate && (
                                        <div className="flex justify-between">
                                          <span className="text-[#8a6a52]">Date:</span>
                                          <span className="font-medium text-[#5b3a29]">
                                            {new Date(order.deliveryDate).toLocaleDateString("en-IN", {
                                              day: "numeric",
                                              month: "short",
                                              year: "numeric",
                                            })}
                                          </span>
                                        </div>
                                      )}
                                      {order.deliveryTime && (
                                        <div className="flex justify-between">
                                          <span className="text-[#8a6a52]">Time:</span>
                                          <span className="font-medium text-[#5b3a29]">
                                            {new Date(`2000-01-01T${order.deliveryTime}`).toLocaleTimeString("en-IN", {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              hour12: true,
                                            })}
                                          </span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span className="text-[#8a6a52]">Total:</span>
                                        <span className="font-bold text-[#5b3a29]">
                                          ₹{order.totalPrice}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Messages - Only show for product search */}
            {questionType === "products" && (
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-full rounded-2xl px-4 py-3 text-sm shadow-sm md:max-w-[70%] ${
                      msg.role === "user"
                        ? "bg-[#5b3a29] text-white"
                        : "bg-[#f9f4ee] text-[#5b3a29]"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {msg.products.map((product) => {
                          const images = Array.isArray(product.images)
                            ? product.images
                            : [];
                            
                          const mainImage = images[0].url;

                          return (
                            <div
                              key={product._id}
                              onClick={() => router.push(`/product/${product._id}`)}
                              className="cursor-pointer overflow-hidden rounded-xl border border-[#f1e4d8] bg-white text-left text-[#5b3a29] transition hover:border-[#5b3a29] hover:shadow-md"
                            >
                              <div className="relative h-32 w-full overflow-hidden bg-[#f1e4d8]">
                                {mainImage ? (
                                  <img
                                    src={mainImage}
                                    alt={product.name}
                                    className="h-full w-full object-cover transition hover:scale-105"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs text-[#8a6a52]">
                                    No Image
                                  </div>
                                )}
                              </div>
                              <div className="p-3">
                                <h3 className="mb-1 text-sm font-semibold">
                                  {product.name}
                                </h3>
                                <p className="mb-1 text-sm font-bold">
                                  {formatPrice(product.price)}
                                </p>
                                {product.averageRating > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-[#8a6a52]">
                                    <span>
                                      ⭐ {product.averageRating} (
                                      {product.totalRatings || 0})
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-[#f9f4ee] px-4 py-2 text-sm text-[#8a6a52] shadow-sm">
                    Thinking about the best options for you...
                  </div>
                </div>
              )}
            </div>
            )}

          </div>
        </div>
      </Container>
    </div>
  );
};

export default AssistantPage;


