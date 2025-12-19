"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "../container";
import Header from "../header/page";
import { getCart, removeFromCart, clearCart } from "@/lib/utils/cart";

const CartPage = () => {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
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
    updateCart();
    
    const handleCartUpdate = () => updateCart();
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  const updateCart = () => {
    setCart(getCart());
  };

  const handleRemove = (index) => {
    removeFromCart(index);
    toast.success("Item removed from cart");
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const basePrice = (item.price || 0) * (item.size || 1);
      const deliveryCharge = item.deliveryType === "delivery" ? 50 : 0;
      return total + basePrice + deliveryCharge;
    }, 0);
  };

  const handleCheckout = () => {
    if (!user) {
      toast.error("Please login to checkout");
      router.push("/login");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Store cart in sessionStorage for checkout
    sessionStorage.setItem("cartCheckout", JSON.stringify(cart));
    router.push("/checkout");
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Header />
        <ToastContainer position="top-right" autoClose={2000} theme="colored" />
        <Container>
          <div className="py-8 md:py-12">
            <h1 className="mb-5 md:mb-6 text-2xl md:text-3xl font-bold text-[#5b3a29]">Shopping Cart</h1>
            <div className="rounded-lg border border-[#e5d4c4] bg-white p-8 md:p-12 text-center">
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h2 className="mt-4 text-2xl font-semibold text-[#5b3a29]">Your cart is empty</h2>
              <p className="mt-2 text-[#8a6a52]">Add some delicious cakes to your cart!</p>
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
          <h1 className="mb-5 md:mb-6 text-2xl md:3xl font-bold text-[#5b3a29]">Shopping Cart</h1>

          <div className="grid gap-5 md:gap-6 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item, index) => {
                const itemTotal = (item.price || 0) * (item.size || 1) + 
                  (item.deliveryType === "delivery" ? 50 : 0);
                
                return (
                  <div
                    key={index}
                    className="rounded-lg border border-[#e5d4c4] bg-white p-6 shadow-sm relative"
                  >
                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemove(index)}
                      className="absolute sm:top-4 top-0 sm:right-4 right-0 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition"
                      title="Remove from cart"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
<div className="flex flex-col gap-4 sm:flex-row sm:gap-4 sm:pr-10">
  {/* Top row on mobile: Image + Price */}
  <div className="flex items-start justify-between sm:items-start sm:justify-start gap-4">
    {/* Image */}
    {item.images && item.images[0] && (
      <img
        src={item.images[0]}
        alt={item.name}
        className="h-24 w-24 rounded-lg object-cover"
      />
    )}

    {/* Price (mobile right, desktop right column) */}
    <div className="text-right sm:hidden">
      <p className="text-lg font-bold text-[#5b3a29]">₹{itemTotal}</p>
      <p className="text-xs text-[#8a6a52]">
        ₹{item.price} × {item.size}kg
      </p>
      {item.deliveryType === "delivery" && (
        <p className="text-xs text-[#8a6a52]">+ ₹50 delivery</p>
      )}
    </div>
  </div>

  {/* Summary */}
  <div className="flex-1">
    <h3 className="text-lg font-semibold text-[#5b3a29]">
      {item.name}
    </h3>
    <p className="text-sm text-[#8a6a52]">Size: {item.size} kg</p>
    <p className="text-sm text-[#8a6a52]">
      Delivery: {item.deliveryType === "delivery" ? "Home Delivery" : "Pickup"}
    </p>
    {item.deliveryDate && (
      <p className="text-sm text-[#8a6a52]">
        Date: {new Date(item.deliveryDate).toLocaleDateString()}
      </p>
    )}
    {item.deliveryTime && (
      <p className="text-sm text-[#8a6a52]">
        Time: {item.deliveryTime}
      </p>
    )}
    {item.area && (
      <p className="text-sm text-[#8a6a52]">
        Area: {item.area}
      </p>
    )}
    {item.instruction && (
      <p className="text-sm text-[#8a6a52] mt-1">
        <span className="font-medium">Instructions:</span> {item.instruction}
      </p>
    )}
  </div>

  {/* Price (desktop only) */}
  <div className="hidden sm:block text-right">
    <p className="text-lg font-bold text-[#5b3a29]">₹{itemTotal}</p>
    <p className="text-xs text-[#8a6a52]">
      ₹{item.price} × {item.size}kg
    </p>
    {item.deliveryType === "delivery" && (
      <p className="text-xs text-[#8a6a52]">+ ₹50 delivery</p>
    )}
  </div>
</div>

                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-lg border border-[#e5d4c4] bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-[#5b3a29]">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8a6a52]">Items ({cart.length})</span>
                    <span className="font-medium text-[#5b3a29]">
                      ₹{cart.reduce((sum, item) => sum + (item.price || 0) * (item.size || 1), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a6a52]">Delivery Charges</span>
                    <span className="font-medium text-[#5b3a29]">
                      ₹{cart.reduce((sum, item) => sum + (item.deliveryType === "delivery" ? 50 : 0), 0)}
                    </span>
                  </div>
                  <div className="mt-4 flex justify-between border-t border-[#e5d4c4] pt-4">
                    <span className="text-lg font-semibold text-[#5b3a29]">Total</span>
                    <span className="text-xl font-bold text-[#5b3a29]">₹{calculateTotal()}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="mt-6 w-full rounded-full bg-[#5b3a29] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#3e261a]"
                >
                  Proceed to Checkout
                </button>
                <button
                  onClick={() => router.push("/category/cake")}
                  className="mt-3 w-full rounded-full border border-[#5b3a29] bg-white px-6 py-3 text-sm font-semibold text-[#5b3a29] transition hover:bg-[#fff4ea]"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CartPage;

