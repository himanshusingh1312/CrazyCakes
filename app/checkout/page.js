"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "../container";
import Header from "../header/page";
import { getCart, removeFromCart, clearCart } from "@/lib/utils/cart";

const CheckoutPage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Only initialize once - check if user is already set
      if (!user) {
        const userData = localStorage.getItem("user");
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            // Pre-fill phone and address from user data if available
            // Phone is stored as number, convert to string and check if it's not 0
            const userPhone = parsedUser.phone;
            if (userPhone && userPhone !== 0 && userPhone !== "0") {
              setPhone(String(userPhone));
            } else {
              setPhone("");
            }
            // Address is stored as string
            setAddress(parsedUser.address || "");
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        } else {
          // User not logged in, redirect to login with return URL
          const currentUrl = window.location.pathname;
          sessionStorage.setItem("returnUrl", currentUrl);
          router.push("/login");
          return;
        }
      }

      // Get checkout data from sessionStorage (either from product page or cart)
      // Only set if not already set to prevent re-initialization
      if (!checkoutData) {
        const storedData = sessionStorage.getItem("checkoutData");
        const cartCheckoutData = sessionStorage.getItem("cartCheckout");
        
        if (storedData) {
          try {
            setCheckoutData(JSON.parse(storedData));
          } catch (e) {
            console.error("Error parsing checkout data:", e);
            toast.error("Invalid checkout data. Please try again.");
            router.push("/");
          }
        } else if (cartCheckoutData) {
          // Handle cart checkout - use first item from cart
          try {
            const cart = JSON.parse(cartCheckoutData);
            if (cart && cart.length > 0) {
              const firstItem = cart[0];
              // Find the actual index in current cart (in case cart changed)
              const currentCart = getCart();
              const actualIndex = currentCart.findIndex(
                (item) =>
                  (item.productId === firstItem.productId || item._id === firstItem._id) &&
                  item.size === firstItem.size &&
                  item.deliveryType === firstItem.deliveryType &&
                  item.deliveryDate === firstItem.deliveryDate &&
                  item.deliveryTime === firstItem.deliveryTime
              );
              
              // Convert cart item to checkout data format
              setCheckoutData({
                productId: firstItem.productId || firstItem._id,
                product: {
                  _id: firstItem._id,
                  name: firstItem.name,
                  price: firstItem.price,
                  images: firstItem.images,
                },
                formData: {
                  city: firstItem.city || "Lucknow",
                  area: firstItem.area,
                  size: firstItem.size,
                  instruction: firstItem.instruction || "",
                  deliveryType: firstItem.deliveryType,
                  deliveryDate: firstItem.deliveryDate,
                  deliveryTime: firstItem.deliveryTime,
                  customizeImage: null,
                  customizeImageFile: null,
                },
                coupon: null,
                totalPrice: (firstItem.price || 0) * (firstItem.size || 1) + (firstItem.deliveryType === "delivery" ? 50 : 0),
                basePrice: (firstItem.price || 0) * (firstItem.size || 1),
                deliveryCharge: firstItem.deliveryType === "delivery" ? 50 : 0,
                discountAmount: 0,
                isFromCart: true, // Flag to identify cart checkout
                cartItemIndex: actualIndex >= 0 ? actualIndex : 0, // Actual index in current cart
              });
            } else {
              toast.error("Cart is empty");
              router.push("/cart");
            }
          } catch (e) {
            console.error("Error parsing cart checkout data:", e);
            toast.error("Invalid cart data. Please try again.");
            router.push("/cart");
          }
        } else {
          toast.error("No checkout data found. Please select a product first.");
          router.push("/");
        }
      }
    }
  }, [router]);

  const handleBook = async () => {
    if (!user) {
      // Store current page URL for redirect after login
      const currentUrl = window.location.pathname;
      sessionStorage.setItem("returnUrl", currentUrl);
      router.push("/login");
      return;
    }

    if (!checkoutData) {
      toast.error("Checkout data is missing");
      return;
    }

    if (!phone || !phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    if (!address || !address.trim()) {
      toast.error("Please enter your address");
      return;
    }

    setBookingLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login again");
        router.push("/login");
        return;
      }

      const form = new FormData();
      form.append("productId", checkoutData.productId);
      form.append("city", checkoutData.formData.city);
      form.append("area", checkoutData.formData.area);
      form.append("phone", phone.trim());
      form.append("address", address.trim());
      form.append("size", checkoutData.formData.size);
      form.append("instruction", checkoutData.formData.instruction || "");
      form.append("deliveryType", checkoutData.formData.deliveryType);
      form.append("deliveryDate", checkoutData.formData.deliveryDate);
      form.append("deliveryTime", checkoutData.formData.deliveryTime);
      form.append("originalPrice", checkoutData.product.price.toString());
      form.append("sizeMultiplier", checkoutData.formData.size);
      
      if (checkoutData.coupon) {
        form.append("couponCode", checkoutData.coupon.code);
      }

      // Handle customize image
      const imageData = sessionStorage.getItem("customizeImageData");
      if (imageData && checkoutData.formData.customizeImageFile) {
        // Convert data URL back to blob
        const response = await fetch(imageData);
        const blob = await response.blob();
        const file = new File([blob], "customize.jpg", { type: blob.type });
        form.append("customizeImage", file);
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to create order");
        setBookingLoading(false);
        return;
      }

      toast.success("Order placed successfully!");
      
      // Remove item from cart if it exists
      const cart = getCart();
      
      // Find the item in cart to remove (re-find to ensure accuracy)
      const cartItemIndex = cart.findIndex(
        (item) =>
          (item.productId === checkoutData.productId || item._id === checkoutData.productId) &&
          item.size === Number(checkoutData.formData.size) &&
          item.deliveryType === checkoutData.formData.deliveryType &&
          item.deliveryDate === checkoutData.formData.deliveryDate &&
          item.deliveryTime === checkoutData.formData.deliveryTime
      );
      
      if (cartItemIndex >= 0) {
        removeFromCart(cartItemIndex);
      }
      
      // Clear sessionStorage
      sessionStorage.removeItem("checkoutData");
      sessionStorage.removeItem("cartCheckout");
      sessionStorage.removeItem("customizeImageData");
      
      setTimeout(() => {
        router.push("/orders");
      }, 1000);
    } catch (err) {
      console.error("Booking error:", err);
      toast.error("Something went wrong");
      setBookingLoading(false);
    }
  };

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Header />
        <Container>
          <div className="py-12">
            <p className="text-center text-[#8a6a52]">Loading...</p>
          </div>
        </Container>
      </div>
    );
  }

  const product = checkoutData.product;

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Header />
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />
      <Container>
        <div className="py-8 md:py-12">
          <h1 className="mb-5 md:mb-6 text-2xl md:text-3xl font-bold text-[#5b3a29]">Checkout</h1>

          <div className="grid gap-5 md:gap-6 lg:grid-cols-2">
            {/* Left Column - Order Details */}
            <div className="space-y-6">
              {/* Product Details */}
              <div className="rounded-lg border border-[#e5d4c4] bg-white p-6">
                <h2 className="mb-4 text-xl font-semibold text-[#5b3a29]">
                  Product Details
                </h2>
                <div className="flex gap-4">
                  {product.images && product.images[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#5b3a29]">
                      {product.name}
                    </h3>
                    <p className="text-sm text-[#8a6a52]">
                      Price: ₹{product.price} per kg
                    </p>
                    <p className="text-sm text-[#8a6a52]">
                      Size: {checkoutData.formData.size} kg
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="rounded-lg border border-[#e5d4c4] bg-white p-6">
                <h2 className="mb-4 text-xl font-semibold text-[#5b3a29]">
                  Delivery Details
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8a6a52]">City:</span>
                    <span className="font-semibold text-[#5b3a29]">
                      {checkoutData.formData.city}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a6a52]">Area:</span>
                    <span className="font-semibold text-[#5b3a29]">
                      {checkoutData.formData.area}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a6a52]">Delivery Type:</span>
                    <span className="font-semibold text-[#5b3a29]">
                      {checkoutData.formData.deliveryType === "delivery"
                        ? "Home Delivery"
                        : "Pick up from store"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a6a52]">Date:</span>
                    <span className="font-semibold text-[#5b3a29]">
                      {new Date(
                        checkoutData.formData.deliveryDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a6a52]">Time:</span>
                    <span className="font-semibold text-[#5b3a29]">
                      {checkoutData.formData.deliveryTime}
                    </span>
                  </div>
                  {checkoutData.formData.instruction && (
                    <div className="mt-3 pt-3 border-t border-[#e5d4c4]">
                      <span className="text-[#8a6a52]">Instructions:</span>
                      <p className="mt-1 text-[#5b3a29]">
                        {checkoutData.formData.instruction}
                      </p>
                    </div>
                  )}
                  {checkoutData.formData.customizeImage && (
                    <div className="mt-3 pt-3 border-t border-[#e5d4c4]">
                      <span className="text-[#8a6a52]">Custom Image:</span>
                      <img
                        src={checkoutData.formData.customizeImage}
                        alt="Custom"
                        className="mt-2 h-32 w-32 rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - User Info & Summary */}
            <div className="space-y-6">
              {/* User Information */}
              <div className="rounded-lg border border-[#e5d4c4] bg-white p-6">
                <h2 className="mb-4 text-xl font-semibold text-[#5b3a29]">
                  Contact Information
                </h2>
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-[#8a6a52]">Name:</span>
                    <p className="mt-1 font-semibold text-[#5b3a29]">
                      {user?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#8a6a52]">Email:</span>
                    <p className="mt-1 font-semibold text-[#5b3a29]">
                      {user?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[#8a6a52] mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm text-[#5b3a29] outline-none focus:border-[#5b3a29] focus:ring-1 focus:ring-[#5b3a29]/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#8a6a52] mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your full address"
                      rows="3"
                      className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm text-[#5b3a29] outline-none focus:border-[#5b3a29] focus:ring-1 focus:ring-[#5b3a29]/30 resize-none"
                      required
                    />
                  </div>
                  {user?.pincode && (
                    <div>
                      <span className="text-[#8a6a52]">Pincode:</span>
                      <p className="mt-1 font-semibold text-[#5b3a29]">
                        {user.pincode}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="rounded-lg border border-[#e5d4c4] bg-white p-6">
                <h2 className="mb-4 text-xl font-semibold text-[#5b3a29]">
                  Order Summary
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8a6a52]">Base Price:</span>
                    <span className="font-semibold text-[#5b3a29]">
                      ₹{checkoutData.basePrice}
                    </span>
                  </div>
                  {checkoutData.deliveryCharge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#8a6a52]">Delivery Charge:</span>
                      <span className="font-semibold text-[#5b3a29]">
                        ₹{checkoutData.deliveryCharge}
                      </span>
                    </div>
                  )}
                  {checkoutData.coupon && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>
                          Discount ({checkoutData.coupon.discountPercent}%):
                        </span>
                        <span className="font-semibold">
                          -₹{checkoutData.discountAmount}
                        </span>
                      </div>
                      <div className="text-xs text-[#8a6a52]">
                        Coupon: {checkoutData.coupon.code} -{" "}
                        {checkoutData.coupon.message}
                      </div>
                    </>
                  )}
                  <div className="mt-4 flex justify-between border-t border-[#e5d4c4] pt-3">
                    <span className="text-lg font-semibold text-[#5b3a29]">
                      Total:
                    </span>
                    <span className="text-xl font-bold text-[#5b3a29]">
                      ₹{checkoutData.totalPrice}
                    </span>
                  </div>
                </div>
              </div>

              {/* Book Now Button */}
              <button
                onClick={handleBook}
                disabled={bookingLoading}
                className="w-full rounded-full bg-[#5b3a29] px-6 py-3 text-lg font-semibold text-white shadow-md transition hover:bg-[#3e261a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingLoading ? "Booking..." : "Book Now"}
              </button>

              {/* Back Button */}
              <button
                onClick={() => router.back()}
                className="w-full rounded-full border border-[#5b3a29] bg-white px-6 py-3 text-lg font-semibold text-[#5b3a29] transition hover:bg-[#f9f4ee]"
              >
                Back to Product
              </button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CheckoutPage;

