"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "../container";
import Header from "../header/page";
import { getWishlist, removeFromWishlist, isInWishlist } from "@/lib/utils/wishlist";
import { addToCart } from "@/lib/utils/cart";

const WishlistPage = () => {
  const router = useRouter();
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
    }
    updateWishlist();
    
    const handleWishlistUpdate = () => updateWishlist();
    window.addEventListener("wishlistUpdated", handleWishlistUpdate);
    return () => window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
  }, []);

  const updateWishlist = () => {
    setWishlist(getWishlist());
  };

  const handleRemove = (productId) => {
    removeFromWishlist(productId);
    toast.success("Removed from wishlist");
  };

  const handleAddToCart = (item) => {
    // Navigate to product page to configure order details
    router.push(`/product/${item.productId || item._id}`);
    toast.info("Please configure order details on product page");
  };

  const handleViewProduct = (productId) => {
    router.push(`/product/${productId}`);
  };

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Header />
        <ToastContainer position="top-right" autoClose={2000} theme="colored" />
        <Container>
          <div className="py-12">
            <h1 className="mb-6 text-3xl font-bold text-[#5b3a29]">My Wishlist</h1>
            <div className="rounded-lg border border-[#e5d4c4] bg-white p-12 text-center">
              <svg
                className="mx-auto h-24 w-24 text-[#8a6a52]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <h2 className="mt-4 text-2xl font-semibold text-[#5b3a29]">Your wishlist is empty</h2>
              <p className="mt-2 text-[#8a6a52]">Start adding your favorite cakes to wishlist!</p>
              <button
                onClick={() => router.push("/category/cake")}
                className="mt-6 rounded-full bg-[#5b3a29] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#3e261a]"
              >
                Browse Cakes
              </button>
            </div>
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
          <h1 className="mb-5 md:mb-6 text-2xl md:text-3xl font-bold text-[#5b3a29]">My Wishlist</h1>
          <p className="mb-5 md:mb-6 text-sm md:text-base text-[#8a6a52]">{wishlist.length} item(s) in your wishlist</p>

          <div className="grid gap-5 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {wishlist.map((item) => {
              const images = Array.isArray(item.images) ? item.images : [];
              const mainImage = images[0];

              return (
                <div
                  key={item.productId || item._id}
                  className="overflow-hidden rounded-2xl border border-[#f1e4d8] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-56 w-full overflow-hidden bg-[#f1e4d8]">
                    {mainImage ? (
                      <img
                        src={mainImage}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onClick={() => handleViewProduct(item.productId || item._id)}
                        style={{ cursor: "pointer" }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#8a6a52]">
                        No Image
                      </div>
                    )}
                    <button
                      onClick={() => handleRemove(item.productId || item._id)}
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-red-600 shadow-md transition hover:bg-white"
                      title="Remove from wishlist"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <h3
                      className="mb-1 cursor-pointer text-lg font-semibold text-[#5b3a29] hover:text-[#3e261a]"
                      onClick={() => handleViewProduct(item.productId || item._id)}
                    >
                      {item.name}
                    </h3>
                    <p className="mb-2 text-lg font-bold text-[#5b3a29]">₹{item.price} per kg</p>
                    {item.tag && (
                      <span className="mb-2 inline-block rounded-full bg-[#5b3a29] px-2 py-1 text-xs text-white">
                        {item.tag}
                      </span>
                    )}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleViewProduct(item.productId || item._id)}
                        className="flex-1 rounded-lg border border-[#5b3a29] bg-white px-4 py-2 text-sm font-semibold text-[#5b3a29] transition hover:bg-[#fff4ea]"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="flex-1 rounded-lg bg-[#5b3a29] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3e261a]"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default WishlistPage;

