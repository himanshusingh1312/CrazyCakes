"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "../../container";
import Header from "../../header/page";
import { addToCart, getCart, removeFromCart } from "@/lib/utils/cart";
import { addToWishlist, removeFromWishlist, isInWishlist } from "@/lib/utils/wishlist";
import CakeDesigner from "../../components/CakeDesigner";
import Footer from '../../footer/page'
import BestsellerSection from '../../components/BestsellerSection'
import Loader from "../../loader";
const ProductDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const productId = String(params.id || "");

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showDesigner, setShowDesigner] = useState(false);

  // Booking form state
  const [formData, setFormData] = useState({
    city: "Lucknow",
    area: "",
    size: "",
    customizeImage: null,
    instruction: "",
    deliveryType: "pickup",
    deliveryDate: "",
    deliveryTime: "",
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);

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
  }, []);

  useEffect(() => {
    if (!productId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products?id=${encodeURIComponent(productId)}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.products) && data.products[0]) {
          setProduct(data.products[0]);
          setInWishlist(isInWishlist(productId));
        } else {
          setProduct(null);
        }
      } catch (e) {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    const handleWishlistUpdate = () => {
      if (productId) setInWishlist(isInWishlist(productId));
    };
    window.addEventListener("wishlistUpdated", handleWishlistUpdate);
    return () => window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
  }, [productId]);

  const images = Array.isArray(product?.images) ? product.images : [];
  const mainImage = images[activeIndex] || images[0];

  const areas = [
    "Aishbagh",
    "Alambagh",
    "Aliganj",
    "Amar Shaheed Path",
    "Aminabad",
    "Ashiyana Colony",
    "Balaganj",
    "Banthra",
    "Butler Colony",
    "Cantonment / Lucknow Cantonment",
    "Charbagh",
    "Chinhat",
    "Chowk",
    "Daliganj",
    "Deva Road",
    "DLF Garden City",
    "Dubagga",
    "Faizabad Road",
    "Ghazipur",
    "Gokhale Marg",
    "Gomti Nagar",
    "Gomti Nagar Extension",
    "Gosainganj",
    "Hazratganj",
    "Husainabad",
    "IIM Road",
    "Indira Nagar",
    "Jankipuram",
    "Jopling Road",
    "Kakori",
    "Kalyanpur",
    "Kanpur Road",
    "Kapoorthala",
    "Krishna Nagar",
    "Khurram Nagar",
    "Kursi Road",
    "Lalbagh",
    "Mahanagar",
    "Malihabad",
    "Mohanlalganj",
    "Munshi Pulia",
    "Nirala Nagar",
    "Nishatganj",
    "Qaiserbagh",
    "Raebareli Road",
    "Rajajipuram",
    "Rajendra Nagar",
    "Sarojini Nagar",
    "Sultanpur Road",
    "Sushant Golf City",
    "Telibagh",
    "Thakurganj",
    "Vibhuti Khand",
    "Vikas Nagar",
    "Vrindavan Yojana"
  ];
  const sizes = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const handleChange = (e) => {
  const { name, id, value, type } = e.target;

  setFormData((prev) => ({
    ...prev,
    [type === "radio" ? name : id]: value,
  }));
};


  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, customizeImage: file });
      setShowDesigner(false); // Close designer if user uploads image
      toast.success("Image uploaded! Designer tool is now disabled.");
    }
  };

  const handleDesignerSave = (file) => {
    setFormData({ ...formData, customizeImage: file });
    setShowDesigner(false);
    toast.success("Design saved!");
  };

  const calculatePrice = () => {
    if (!product || !formData.size) return 0;
    const basePrice = product.price * Number(formData.size);
    const deliveryCharge = formData.deliveryType === "delivery" ? 50 : 0;
    const subtotal = basePrice + deliveryCharge;
    
    // Apply coupon discount if available
    if (appliedCoupon) {
      const discount = (subtotal * appliedCoupon.discountPercent) / 100;
      return Math.round(subtotal - discount);
    }
    
    return subtotal;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    if (!user) {
      toast.error("Please login to apply coupon");
      router.push("/login");
      return;
    }

    setApplyingCoupon(true);
    setCouponError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login again");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: couponCode }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        toast.success(`Coupon applied! ${data.coupon.message}`);
        setCouponError("");
      } else {
        setCouponError(data.error || "Invalid coupon code");
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError("Something went wrong. Please try again.");
      setAppliedCoupon(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const handleAddToCart = () => {
    if (!user) {
      // Store current page URL for redirect after login
      const currentUrl = window.location.pathname;
      sessionStorage.setItem("returnUrl", currentUrl);
      router.push("/login");
      return;
    }

    if (!formData.area || !formData.size || !formData.deliveryDate || !formData.deliveryTime) {
      toast.error("Please fill all required fields (Area, Size, Date, Time)");
      return;
    }

    const cartItem = {
      productId: productId,
      _id: product._id,
      name: product.name,
      price: product.price,
      images: product.images,
      size: Number(formData.size),
      area: formData.area,
      city: formData.city,
      deliveryType: formData.deliveryType,
      deliveryDate: formData.deliveryDate,
      deliveryTime: formData.deliveryTime,
      instruction: formData.instruction || "",
    };

    addToCart(cartItem);
    toast.success("Added to cart!");
  };

  const handleToggleWishlist = () => {
    if (!user) {
      // Store current page URL for redirect after login
      const currentUrl = window.location.pathname;
      sessionStorage.setItem("returnUrl", currentUrl);
      router.push("/login");
      return;
    }

    if (inWishlist) {
      removeFromWishlist(productId);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({
        productId: productId,
        _id: product._id,
        name: product.name,
        price: product.price,
        images: product.images,
        specification: product.specification,
        tag: product.tag,
      });
      toast.success("Added to wishlist!");
    }
  };

  const handleCheckout = () => {
    if (!user) {
      // Store current page URL for redirect after login
      const currentUrl = window.location.pathname;
      sessionStorage.setItem("returnUrl", currentUrl);
      router.push("/login");
      return;
    }

    if (!formData.area || !formData.size) {
      toast.error("Please select area and size");
      return;
    }

    if (!formData.deliveryDate || !formData.deliveryTime) {
      toast.error("Please select date and time");
      return;
    }

    // Store checkout data in sessionStorage
    const checkoutData = {
      productId: productId,
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
        images: product.images,
      },
      formData: {
        city: formData.city,
        area: formData.area,
        size: formData.size,
        instruction: formData.instruction,
        deliveryType: formData.deliveryType,
        deliveryDate: formData.deliveryDate,
        deliveryTime: formData.deliveryTime,
        customizeImage: formData.customizeImage ? URL.createObjectURL(formData.customizeImage) : null,
        customizeImageFile: formData.customizeImage ? "needs-upload" : null,
      },
      coupon: appliedCoupon,
      totalPrice: totalPrice,
      basePrice: product.price * Number(formData.size),
      deliveryCharge: formData.deliveryType === "delivery" ? 50 : 0,
      discountAmount: appliedCoupon ? Math.round((product.price * Number(formData.size) + (formData.deliveryType === "delivery" ? 50 : 0)) * appliedCoupon.discountPercent / 100) : 0,
    };

    // Store the actual file separately if it exists
    if (formData.customizeImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData));
        sessionStorage.setItem("customizeImageData", e.target.result);
        router.push("/checkout");
      };
      reader.readAsDataURL(formData.customizeImage);
    } else {
      sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData));
      router.push("/checkout");
    }
  };

  const handleBook = async () => {
    if (!user) {
      // Store current page URL for redirect after login
      const currentUrl = window.location.pathname;
      sessionStorage.setItem("returnUrl", currentUrl);
      router.push("/login");
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
      form.append("productId", productId);
      form.append("city", formData.city);
      form.append("area", formData.area);
      form.append("size", formData.size);
      form.append("instruction", formData.instruction);
      form.append("deliveryType", formData.deliveryType);
      form.append("deliveryDate", formData.deliveryDate);
      form.append("deliveryTime", formData.deliveryTime);
      form.append("originalPrice", product.price.toString());
      form.append("sizeMultiplier", formData.size);
      if (appliedCoupon) {
        form.append("couponCode", appliedCoupon.code);
      }

      if (formData.customizeImage) {
        form.append("customizeImage", formData.customizeImage);
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
      const cartItemIndex = cart.findIndex(
        (item) =>
          item.productId === productId &&
          item.size === Number(formData.size) &&
          item.deliveryType === formData.deliveryType &&
          item.deliveryDate === formData.deliveryDate &&
          item.deliveryTime === formData.deliveryTime
      );
      
      if (cartItemIndex >= 0) {
        removeFromCart(cartItemIndex);
      }
      
      setShowPreview(false);
      setTimeout(() => {
        router.push("/orders");
      }, 1000);
    } catch (err) {
      toast.error("Something went wrong");
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Header />
        <Container>
          <div className="py-8 md:py-12">
            <Loader/>
          </div>
        </Container>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Header />
        <Container>
          <div className="py-8 md:py-12">
            <p className="text-center text-[#8a6a52]">Product not found.</p>
          </div>
        </Container>
      </div>
    );
  }

  const totalPrice = calculatePrice();

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Header />
      <ToastContainer position="top-right" autoClose={2000} theme="colored" />
      {showDesigner && (
        <CakeDesigner
          productImage={mainImage}
          onSave={handleDesignerSave}
          onClose={() => setShowDesigner(false)}
        />
      )}
      <Container>
        <div className="py-8 md:py-12">
          <button
            className="mb-4 text-sm text-[#8a6a52] hover:text-[#5b3a29]"
            onClick={() => router.back()}
          >
            ← Back
          </button>

          <div className="grid gap-6 md:gap-10 md:grid-cols-2">
            {/* Left: Images */}
            <div>
              <div className="relative mb-4 h-72 md:h-96 w-full overflow-hidden rounded-2xl bg-[#f1e4d8]">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#8a6a52]">
                    No Image
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex sm:gap-3 gap-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`sm:h-20 h-16 md:h-28 flex-1 overflow-hidden rounded-xl border-2 transition ${
                        activeIndex === idx
                          ? "border-[#5b3a29]"
                          : "border-transparent hover:border-[#8a6a52]"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} ${idx + 1}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Specifications Section */}
              {product.specification && (
                <div className="mt-6">
                  <h2 className="mb-2 md:mb-3 text-lg md:text-xl font-semibold text-[#5b3a29]">
                    Specifications
                  </h2>
                  <ul className="space-y-2 list-disc list-inside">
                    {product.specification
                      ?.split("\n")
                      .filter((line) => line.trim())
                      .map((line, idx) => (
                        <li key={idx} className="text-sm text-[#8a6a52]">
                          {line.trim()}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right: Details & Booking Form */}
            <div>
              <h1 className="mb-2 text-2xl md:text-3xl font-bold text-[#5b3a29]">
                {product.name}
              </h1>
              <p className="mb-4 text-base md:text-lg font-semibold text-[#5b3a29]">
                ₹{product.price} <span className="text-sm text-[#8a6a52]">(per kg)</span>
              </p>
              {/* Star Rating */}
              {product.averageRating > 0 && (
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`h-5 w-5 ${
                          star <= Math.round(product.averageRating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-[#5b3a29]">
                    {product.averageRating} ({product.totalRatings} {product.totalRatings === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
              {product.tag && (
                <span className="mb-4 inline-block rounded-full bg-[#5b3a29] px-3 py-1 text-xs text-white">
                  {product.tag}
                </span>
              )}

              {/* Add to Cart and Wishlist Buttons - Only show if user is logged in */}
              {user && (
                <div className="mb-6 flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 rounded-full border-2 border-[#5b3a29] bg-white px-4 py-2 text-sm font-semibold text-[#5b3a29] transition hover:bg-[#fff4ea] flex items-center justify-center gap-2"
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
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Add to Cart
                  </button>
                  <button
                    onClick={handleToggleWishlist}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                      inWishlist
                        ? "bg-red-100 text-red-600 border-2 border-red-600 hover:bg-red-200"
                        : "border-2 border-[#5b3a29] bg-white text-[#5b3a29] hover:bg-[#fff4ea]"
                    }`}
                    title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <svg
                      className="h-5 w-5"
                      fill={inWishlist ? "currentColor" : "none"}
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
                  </button>
                </div>
              )}

              {/* Booking Form */}
              <div className="rounded-2xl border border-[#f1e4d8] bg-white p-4 sm:p-6 max-w-sm sm:max-w-none">

                <h2 className="mb-4 text-xl font-semibold text-[#5b3a29]">
                  Book Your Order
                </h2>

                <div className="space-y-4">
                  {/* City */}
                  <div>
                    <label
                      htmlFor="city"
                      className="mb-1 block text-sm font-medium text-[#5b3a29]"
                    >
                      City
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={formData.city}
                      readOnly
                      className="w-full rounded-lg border border-[#e5d4c4] bg-[#f9f7f4] px-3 py-2 text-sm text-[#8a6a52]"
                    />
                  </div>

                  {/* Area */}
                  <div>
                    <label
                      htmlFor="area"
                      className="mb-1 block text-sm font-medium text-[#5b3a29]"
                    >
                      Area <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="area"
                      required
                      value={formData.area}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                    >
                      <option value="">Select area</option>
                      {areas.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Size */}
                  <div>
                    <label
                      htmlFor="size"
                      className="mb-1 block text-sm font-medium text-[#5b3a29]"
                    >
                      Size (kg) <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="size"
                      required
                      value={formData.size}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                    >
                      <option value="">Select size</option>
                      {sizes.map((size) => (
                        <option key={size} value={size}>
                          {size} kg
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Customize Cake */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#5b3a29]">
                      Customize Your Cake
                    </label>
                    {!formData.customizeImage ? (
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => setShowDesigner(true)}
                          className="w-full rounded-lg bg-gradient-to-r from-[#5b3a29] to-[#8a6a52] px-4 py-3 text-sm font-semibold text-white transition hover:from-[#3e261a] hover:to-[#5b3a29] flex items-center justify-center gap-2 shadow-lg"
                        >
                          <span>🎨</span>
                          Use Cake Designer Tool
                        </button>
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#e5d4c4]"></div>
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="bg-white px-2 text-[#8a6a52]">OR</span>
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="customizeImage"
                            className="block text-xs text-[#8a6a52] mb-1"
                          >
                            Upload Your Own Image
                          </label>
                          <input
                            id="customizeImage"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full text-sm text-[#5b3a29] file:mr-3 file:rounded-full file:border-0 file:bg-[#8a6a52] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#5b3a29]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-3 bg-[#fff4ea] rounded-lg border-2 border-[#5b3a29]">
                          <p className="text-sm text-[#5b3a29] font-semibold mb-2">
                            ✓ {formData.customizeImage.name || "Custom Design"} Selected
                          </p>
                          {formData.customizeImage instanceof File && formData.customizeImage.type.startsWith('image/') && (
                            <img
                              src={URL.createObjectURL(formData.customizeImage)}
                              alt="Preview"
                              className="w-full max-h-40 rounded border border-[#e5d4c4] object-contain"
                            />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, customizeImage: null });
                            toast.info("Design cleared. You can choose a new option.");
                          }}
                          className="w-full px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition"
                        >
                          Remove & Choose Again
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Instruction */}
                  <div>
                    <label
                      htmlFor="instruction"
                      className="mb-1 block text-sm font-medium text-[#5b3a29]"
                    >
                      Instruction (Optional)
                    </label>
                    <textarea
                      id="instruction"
                      value={formData.instruction}
                      onChange={handleChange}
                      rows={3}
                      className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                      placeholder="Any special instructions..."
                    />
                  </div>

                  {/* Delivery Type */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#5b3a29]">
                      Delivery Option <span className="text-red-500">*</span>
                    </label>
                    <div className="flex sm:gap-4 gap-2 sm:flex-row flex-col">
                      <label className="flex cursor-pointer items-center">
                        <input
                          type="radio"
                          name="deliveryType"
                          value="pickup"
                          checked={formData.deliveryType === "pickup"}
                          onChange={handleChange}
                          className="mr-2"
                        />
                        <span className="text-sm text-[#5b3a29]">Pick up from store</span>
                      </label>
                      <label className="flex cursor-pointer items-center">
                        <input
                          type="radio"
                          name="deliveryType"
                          value="delivery"
                          checked={formData.deliveryType === "delivery"}
                          onChange={handleChange}
                          className="mr-2"
                        />
                        <span className="text-sm text-[#5b3a29]">
                          Home delivery (+₹50)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="deliveryDate"
                        className="mb-1 block text-sm font-medium text-[#5b3a29]"
                      >
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="deliveryDate"
                        type="date"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        value={formData.deliveryDate}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="deliveryTime"
                        className="mb-1 block text-sm font-medium text-[#5b3a29]"
                      >
                        Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="deliveryTime"
                        type="time"
                        required
                        value={formData.deliveryTime}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                      />
                    </div>
                  </div>

                  {/* Coupon Code */}
                  {formData.size && (
                    <div>
                      <label
                        htmlFor="couponCode"
                        className="mb-1 block text-sm font-medium text-[#5b3a29]"
                      >
                        Apply Coupon Code
                      </label>
                      {!appliedCoupon ? (
                        <div className="flex sm:flex-row flex-col gap-2">
                          <input
                            id="couponCode"
                            type="text"
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value.toUpperCase());
                              setCouponError("");
                            }}
                            placeholder="Enter coupon code"
                            className="flex-1 rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                          />
                          <button
                            onClick={handleApplyCoupon}
                            disabled={applyingCoupon || !couponCode.trim()}
                            className="px-4 py-2 rounded-lg bg-[#5b3a29] text-white text-sm font-semibold hover:bg-[#3e261a] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {applyingCoupon ? "Applying..." : "Apply"}
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-green-500 bg-green-50 p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-green-800">
                                {appliedCoupon.code} - {appliedCoupon.message}
                              </p>
                              <p className="text-xs text-green-600">
                                {appliedCoupon.discountPercent}% discount applied
                              </p>
                            </div>
                            <button
                              onClick={handleRemoveCoupon}
                              className="text-xs text-red-600 hover:text-red-800 font-semibold"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                      {couponError && (
                        <p className="mt-1 text-xs text-red-600">{couponError}</p>
                      )}
                    </div>
                  )}

                  {/* Price Summary */}
                  {formData.size && (
                    <div className="rounded-lg border border-[#e5d4c4] bg-[#fffaf3] p-4">
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-[#8a6a52]">Base Price ({formData.size}kg):</span>
                        <span className="font-semibold text-[#5b3a29]">
                          ₹{product.price * Number(formData.size)}
                        </span>
                      </div>
                      {formData.deliveryType === "delivery" && (
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-[#8a6a52]">Delivery Charge:</span>
                          <span className="font-semibold text-[#5b3a29]">₹50</span>
                        </div>
                      )}
                      {appliedCoupon && (
                        <>
                          <div className="mb-2 flex justify-between text-sm">
                            <span className="text-[#8a6a52]">Subtotal:</span>
                            <span className="font-semibold text-[#5b3a29]">
                              ₹{product.price * Number(formData.size) + (formData.deliveryType === "delivery" ? 50 : 0)}
                            </span>
                          </div>
                          <div className="mb-2 flex justify-between text-sm text-green-600">
                            <span>Discount ({appliedCoupon.discountPercent}%):</span>
                            <span className="font-semibold">
                              -₹{Math.round((product.price * Number(formData.size) + (formData.deliveryType === "delivery" ? 50 : 0)) * appliedCoupon.discountPercent / 100)}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="mt-2 flex justify-between border-t border-[#e5d4c4] pt-2">
                        <span className="font-semibold text-[#5b3a29]">Total:</span>
                        <span className="text-lg font-bold text-[#5b3a29]">
                          ₹{totalPrice}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Checkout/Login Button */}
                  {!user ? (
                    <button
                      onClick={() => {
                        // Store current page URL for redirect after login
                        const currentUrl = window.location.pathname;
                        sessionStorage.setItem("returnUrl", currentUrl);
                        router.push("/login");
                      }}
                      className="w-full rounded-full bg-[#5b3a29] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#3e261a]"
                    >
                      Login to Checkout
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckout}
                      disabled={!formData.area || !formData.size || !formData.deliveryDate || !formData.deliveryTime}
                      className="w-full rounded-full bg-[#5b3a29] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#3e261a] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Checkout
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-2xl font-bold text-[#5b3a29]">Order Preview</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#8a6a52]">Product:</span>
                <span className="font-semibold text-[#5b3a29]">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8a6a52]">City:</span>
                <span className="font-semibold text-[#5b3a29]">{formData.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8a6a52]">Area:</span>
                <span className="font-semibold text-[#5b3a29]">
                  {formData.area}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8a6a52]">Size:</span>
                <span className="font-semibold text-[#5b3a29]">{formData.size} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8a6a52]">Delivery:</span>
                <span className="font-semibold text-[#5b3a29]">
                  {formData.deliveryType === "delivery" ? "Home Delivery" : "Pick up from store"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8a6a52]">Date:</span>
                <span className="font-semibold text-[#5b3a29]">
                  {formData.deliveryDate
                    ? new Date(formData.deliveryDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Not selected"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8a6a52]">Time:</span>
                <span className="font-semibold text-[#5b3a29]">
                  {formData.deliveryTime
                    ? new Date(`2000-01-01T${formData.deliveryTime}`).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "Not selected"}
                </span>
              </div>
              {formData.instruction && (
                <div>
                  <span className="text-[#8a6a52]">Instruction:</span>
                  <p className="mt-1 text-[#5b3a29]">{formData.instruction}</p>
                </div>
              )}
              {formData.customizeImage && (
                <div>
                  <span className="text-[#8a6a52]">Customize Image:</span>
                  <p className="mt-1 text-[#5b3a29]">{formData.customizeImage.name}</p>
                </div>
              )}
              {appliedCoupon && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#8a6a52]">Subtotal:</span>
                    <span className="font-semibold text-[#5b3a29]">
                      ₹{product.price * Number(formData.size) + (formData.deliveryType === "delivery" ? 50 : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon.discountPercent}%):</span>
                    <span className="font-semibold">
                      -₹{Math.round((product.price * Number(formData.size) + (formData.deliveryType === "delivery" ? 50 : 0)) * appliedCoupon.discountPercent / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a6a52]">Coupon Code:</span>
                    <span className="font-semibold text-[#5b3a29]">{appliedCoupon.code}</span>
                  </div>
                </>
              )}
              <div className="mt-4 flex justify-between border-t border-[#e5d4c4] pt-3">
                <span className="text-lg font-semibold text-[#5b3a29]">Total Price:</span>
                <span className="text-xl font-bold text-[#5b3a29]">₹{totalPrice}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 rounded-full border border-[#5b3a29] px-4 py-2 text-sm font-semibold text-[#5b3a29] transition hover:bg-[#fff4ea]"
              >
                Cancel
              </button>
              <button
                onClick={handleBook}
                disabled={bookingLoading}
                className="flex-1 rounded-full bg-[#5b3a29] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3e261a] disabled:opacity-50"
              >
                {bookingLoading ? "Booking..." : "Confirm & Book"}
              </button>
            </div>
          </div>
        </div>
      )}
     < BestsellerSection/>
     <Footer/>
    </div>
  );
};

export default ProductDetailPage;
