"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "../../container";
import Header from "../../header/page";

const AdminReviewsPage = () => {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editReview, setEditReview] = useState("");
  const [analyzingSentiment, setAnalyzingSentiment] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          if (parsedUser.type !== "admin") {
            router.push("/");
            return;
          }
        } catch (e) {
          console.error("Error parsing user data:", e);
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  useEffect(() => {
    const fetchReviews = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        const response = await fetch("/api/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          // Filter orders that have reviews or ratings
          const ordersWithReviews = (data.orders || []).filter(
            (order) => (order.rating && order.rating > 0) || (order.review && order.review.trim() !== "")
          );
          console.log("Total orders:", data.orders?.length || 0);
          console.log("Orders with reviews:", ordersWithReviews.length);
          setReviews(ordersWithReviews);
        } else {
          console.error("Failed to fetch reviews:", data);
          toast.error(data.error || "Failed to fetch reviews");
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (user && user.type === "admin") {
      fetchReviews();
    }
  }, [user, router]);

  const handleEditReview = (order) => {
    setEditingReview(order._id);
    setEditRating(order.rating || 0);
    setEditReview(order.review || "");
  };

  const handleCancelReviewEdit = () => {
    setEditingReview(null);
    setEditRating(0);
    setEditReview("");
  };

  const handleSaveReview = async (orderId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login again");
      router.push("/login");
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          rating: editRating,
          review: editReview,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update review");
        return;
      }

      toast.success("Review updated successfully");
      setEditingReview(null);
      setEditRating(0);
      setEditReview("");

      // Refresh reviews
      const fetchResponse = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const fetchData = await fetchResponse.json();
      if (fetchResponse.ok) {
        const ordersWithReviews = (fetchData.orders || []).filter(
          (order) => order.rating || order.review
        );
        setReviews(ordersWithReviews);
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const handleDeleteReview = async (orderId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login again");
      router.push("/login");
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          rating: null,
          review: "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to delete review");
        return;
      }

      toast.success("Review deleted successfully");

      // Refresh reviews
      const fetchResponse = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const fetchData = await fetchResponse.json();
      if (fetchResponse.ok) {
        const ordersWithReviews = (fetchData.orders || []).filter(
          (order) => order.rating || order.review
        );
        setReviews(ordersWithReviews);
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const handleAnalyzeAllSentiments = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login again");
      router.push("/login");
      return;
    }

    try {
      setAnalyzingSentiment(true);
      
      // Get all reviews without sentiment
      const reviewsWithoutSentiment = reviews.filter(
        (review) => !review.sentiment || !review.sentiment.label
      );

      if (reviewsWithoutSentiment.length === 0) {
        toast.info("All reviews already have sentiment analysis!");
        setAnalyzingSentiment(false);
        return;
      }

      // Analyze each review
      let analyzed = 0;
      for (const review of reviewsWithoutSentiment) {
        if (review.review && review.review.trim() !== "") {
          try {
            const response = await fetch("/api/sentiment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ text: review.review }),
            });

            const data = await response.json();

            if (response.ok && data.sentiment) {
              // Update the order with sentiment
              await fetch("/api/orders", {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  orderId: review._id,
                  review: review.review,
                  rating: review.rating,
                }),
              });
              analyzed++;
            }
          } catch (err) {
            console.error("Error analyzing sentiment:", err);
          }
        }
      }

      toast.success(`Analyzed sentiment for ${analyzed} reviews!`);
      
      // Refresh reviews
      const fetchResponse = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const fetchData = await fetchResponse.json();
      if (fetchResponse.ok) {
        const ordersWithReviews = (fetchData.orders || []).filter(
          (order) => order.rating || order.review
        );
        setReviews(ordersWithReviews);
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setAnalyzingSentiment(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-xl ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Header />
        <Container>
          <div className="py-12">
            <p className="text-center text-[#8a6a52]">Loading reviews...</p>
          </div>
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
          <div className="mb-6 md:mb-8 flex sm:flex-row flex-col items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="sm:text-2xl text-xl md:text-3xl font-bold text-[#5b3a29]">⭐ All Reviews & Ratings</h1>
              <p className="mt-2 text-sm md:text-base text-[#8a6a52]">
                Manage all customer reviews and ratings
              </p>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <div className="flex gap-4 md:gap-6 text-xs md:text-sm text-[#8a6a52]">
                <div>
                  Total Reviews: <span className="font-bold text-[#5b3a29]">{reviews.length}</span>
                </div>
                {reviews.length > 0 && (
                  <>
                    <div>
                      Positive: <span className="font-bold text-green-600">
                        {reviews.filter(r => r.sentiment?.label === "positive").length}
                      </span>
                    </div>
                    <div>
                      Negative: <span className="font-bold text-red-600">
                        {reviews.filter(r => r.sentiment?.label === "negative").length}
                      </span>
                    </div>
                    <div>
                      Neutral: <span className="font-bold text-gray-600">
                        {reviews.filter(r => r.sentiment?.label === "neutral" || !r.sentiment).length}
                      </span>
                    </div>
                  </>
                )}
              </div>
              {reviews.length > 0 && reviews.some(r => r.review && (!r.sentiment || !r.sentiment.label)) && (
                <button
                  onClick={handleAnalyzeAllSentiments}
                  disabled={analyzingSentiment}
                  className="px-3 md:px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-semibold hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span>🤖</span>
                  {analyzingSentiment ? "Analyzing..." : "Analyze All Sentiments"}
                </button>
              )}
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 md:p-12 text-center shadow-lg border border-[#f1e4d8]">
              <p className="text-base md:text-lg text-[#8a6a52]">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-5">
              {reviews.map((order) => (
                <div
                  key={order._id}
                  className="rounded-2xl border border-[#e5d4c4] bg-white p-5 md:p-6 shadow-sm hover:shadow-md transition"
                >
                  <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
                    {/* Left: Order & User Info */}
                    <div className="lg:col-span-2">
                      <div className="mb-3 md:mb-4 flex sm:flex-row flex-col items-start gap-3 md:gap-4">
                        {order.product?.images?.[0].url && (
                          <img
                            src={order.product.images[0].url}
                            alt={order.product?.name}
                            className="h-16 w-16 md:h-20 md:w-20 rounded-lg object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2 md:gap-3">
                            <span className="rounded-full bg-[#5b3a29] px-3 py-1 text-xs font-semibold text-white">
                              Order ID: {order._id?.toString().slice(-8) || "N/A"}
                            </span>
                            <span className="text-xs text-[#8a6a52]">
                              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <h3 className="mb-1 text-base md:text-lg font-semibold text-[#5b3a29]">
                            {order.product?.name || "Product"}
                          </h3>
                          <p className="text-xs md:text-sm text-[#8a6a52]">
                            <span className="font-medium">Customer:</span> {order.user?.name || "N/A"}
                          </p>
                          <p className="text-xs md:text-sm text-[#8a6a52]">
                            <span className="font-medium">Email:</span> {order.user?.email || "N/A"}
                          </p>
                          <p className="text-xs md:text-sm text-[#8a6a52]">
                            <span className="font-medium">Phone:</span> {order.phone || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Review & Actions */}
                    <div className="lg:col-span-1">
                      {editingReview === order._id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-[#5b3a29] mb-1">
                              Rating (1-5 stars)
                            </label>
                            <div className="flex gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setEditRating(star)}
                                  className={`text-xl md:text-2xl transition ${
                                    star <= editRating
                                      ? "text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                            <p className="text-xs text-[#8a6a52]">
                              Selected: {editRating} star{editRating !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#5b3a29] mb-1">
                              Review Text
                            </label>
                            <textarea
                              value={editReview}
                              onChange={(e) => setEditReview(e.target.value)}
                              rows={4}
                              className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                              placeholder="Enter review text..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveReview(order._id)}
                              className="flex-1 rounded-lg bg-[#5b3a29] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#3e261a]"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelReviewEdit}
                              className="flex-1 rounded-lg border border-[#5b3a29] px-3 py-2 text-xs font-semibold text-[#5b3a29] transition hover:bg-[#fff4ea]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {order.rating && (
                            <div>
                              <p className="mb-2 text-xs font-semibold text-[#5b3a29] uppercase">
                                Rating
                              </p>
                              {renderStars(order.rating)}
                              <p className="mt-1 text-xs text-[#8a6a52]">
                                {order.rating} out of 5 stars
                              </p>
                            </div>
                          )}
                          {order.review && (
                            <div>
                              <p className="mb-2 text-xs font-semibold text-[#5b3a29] uppercase">
                                Review
                              </p>
                              <p className="rounded-lg border border-[#e5d4c4] bg-[#fffaf3] p-3 text-sm text-[#5b3a29]">
                                {order.review}
                              </p>
                              
                              {/* Sentiment Analysis */}
                              {order.sentiment && (
                                <div className="mt-3 rounded-lg border border-[#e5d4c4] bg-white p-3">
                                  <p className="mb-2 text-xs font-semibold text-[#5b3a29] uppercase">
                                    🤖 AI Sentiment Analysis
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        order.sentiment.label === "positive"
                                          ? "bg-green-100 text-green-700"
                                          : order.sentiment.label === "negative"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {order.sentiment.label === "positive"
                                        ? "😊 Positive"
                                        : order.sentiment.label === "negative"
                                        ? "😞 Negative"
                                        : "😐 Neutral"}
                                    </span>
                                    <span className="text-xs text-[#8a6a52]">
                                      Score: {order.sentiment.score > 0 ? "+" : ""}
                                      {order.sentiment.score?.toFixed(2) || "0.00"}
                                    </span>
                                  </div>
                                  {/* Sentiment Bar */}
                                  <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                                    <div
                                      className={`h-full transition-all ${
                                        order.sentiment.label === "positive"
                                          ? "bg-green-500"
                                          : order.sentiment.label === "negative"
                                          ? "bg-red-500"
                                          : "bg-gray-400"
                                      }`}
                                      style={{
                                        width: `${Math.abs(order.sentiment.score || 0) * 100}%`,
                                        marginLeft: order.sentiment.score < 0 ? "auto" : "0",
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleEditReview(order)}
                              className="flex-1 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-600"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteReview(order._id)}
                              className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default AdminReviewsPage;

