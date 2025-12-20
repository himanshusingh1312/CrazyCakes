"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "../container";
import Header from "../header/page";
import OrderTracking from "../components/OrderTracking";
import { addToCart } from "@/lib/utils/cart";
import Pagination from "../components/Pagination";
import Footer from '../footer/page'
import Loader from "../loader";
const OrdersPage = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [modifyingOrder, setModifyingOrder] = useState(null);
  const [modifyData, setModifyData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      } else {
        router.push("/login");
        return;
      }
    }
  }, [router]);

  useEffect(() => {
    const fetchOrders = async () => {
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
          setOrders(data.orders || []);
        } else {
          console.error("Failed to fetch orders");
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user, router]);

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

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

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
          status: "cancelled",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to cancel order");
        return;
      }

      toast.success("Order cancelled successfully!");
      
      // Refresh orders
      const refreshResponse = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok) {
        setOrders(refreshData.orders || []);
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const handleModifyOrder = (order) => {
    setModifyingOrder(order._id);
    setModifyData({
      phone: order.phone || "",
      address: order.address || "",
      deliveryDate: order.deliveryDate || "",
      deliveryTime: order.deliveryTime || "",
      deliveryType: order.deliveryType || "pickup",
      area: order.area || "",
      size: order.size || "",
      instruction: order.instruction || "",
    });
  };

  const handleModifySubmit = async (orderId) => {
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
          ...modifyData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to modify order");
        return;
      }

      toast.success("Order modified successfully!");
      setModifyingOrder(null);
      setModifyData({});
      
      // Refresh orders
      const refreshResponse = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok) {
        setOrders(refreshData.orders || []);
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const handleDownloadInvoice = (order) => {
    // Create invoice HTML content with compact design
    const invoiceDate = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const deliveryDate = order.deliveryDate
      ? new Date(order.deliveryDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "N/A";

    const deliveryTime = order.deliveryTime
      ? new Date(`2000-01-01T${order.deliveryTime}`).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "N/A";

    // Get base URL for images
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - Order #${order._id.toString().slice(-8)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @page {
      size: A4;
      margin: 10mm;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 8mm;
      background: #fff;
      color: #333;
      font-size: 11px;
    }
    .invoice-container {
      width: 100%;
      background: white;
      border: 1px solid #5b3a29;
    }
    .invoice-header {
      background: #5b3a29;
      color: white;
      padding: 8mm 5mm;
      text-align: center;
    }
    .invoice-header h1 {
      font-size: 20px;
      margin-bottom: 3px;
    }
    .invoice-header p {
      font-size: 12px;
      opacity: 0.9;
    }
    .invoice-body {
      padding: 5mm;
    }
    .invoice-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5mm;
      margin-bottom: 4mm;
      padding-bottom: 3mm;
      border-bottom: 1px solid #e5d4c4;
    }
    .info-section h3 {
      color: #5b3a29;
      margin-bottom: 3px;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: bold;
    }
    .info-section p {
      margin: 1px 0;
      font-size: 10px;
      color: #333;
      line-height: 1.3;
    }
    .section {
      margin-bottom: 4mm;
      page-break-inside: avoid;
    }
    .section h2 {
      color: #5b3a29;
      margin-bottom: 3mm;
      font-size: 12px;
      border-bottom: 1px solid #5b3a29;
      padding-bottom: 2px;
      font-weight: bold;
    }
    .section-content {
      background: #fffaf3;
      padding: 3mm;
      border: 1px solid #e5d4c4;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      font-size: 10px;
      line-height: 1.4;
    }
    .detail-label {
      font-weight: 600;
      color: #8a6a52;
    }
    .detail-value {
      color: #5b3a29;
      font-weight: 500;
    }
    .payment-summary {
      background: #fff4ea;
      padding: 3mm;
      border: 1px solid #5b3a29;
    }
    .payment-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      font-size: 10px;
    }
    .payment-total {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      border-top: 1px solid #5b3a29;
      margin-top: 3px;
      font-size: 12px;
      font-weight: bold;
      color: #5b3a29;
    }
    .invoice-footer {
      background: #f9f4ee;
      padding: 3mm;
      text-align: center;
      color: #8a6a52;
      font-size: 9px;
      border-top: 1px solid #e5d4c4;
      margin-top: 3mm;
    }
    @media print {
      body {
        padding: 0;
        margin: 0;
      }
      .invoice-container {
        border: none;
      }
      @page {
        margin: 0;
        size: A4;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-header">
      <h1>🎂 Crazy Cakes</h1>
      <p>INVOICE</p>
    </div>
    
    <div class="invoice-body">
      <div class="invoice-info">
        <div class="info-section">
          <h3>Invoice Details</h3>
          <p><strong>Invoice #:</strong> ${order._id.toString().slice(-8)}</p>
          <p><strong>Invoice Date:</strong> ${invoiceDate}</p>
          <p><strong>Order Date:</strong> ${orderDate}</p>
          <p><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
        </div>
        <div class="info-section">
          <h3>Customer Details</h3>
          <p><strong>Name:</strong> ${order.user?.name || "N/A"}</p>
          <p><strong>Email:</strong> ${order.user?.email || "N/A"}</p>
          <p><strong>Phone:</strong> ${order.phone || "N/A"}</p>
        </div>
      </div>

      <div class="section">
        <h2>Product Details</h2>
        <div class="section-content">
          <div class="detail-row">
            <span class="detail-label">Product Name:</span>
            <span class="detail-value">${order.product?.name || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Size:</span>
            <span class="detail-value">${order.size} kg</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Price per kg:</span>
            <span class="detail-value">₹${order.originalPrice}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Base Price:</span>
            <span class="detail-value">₹${order.originalPrice * order.sizeMultiplier}</span>
          </div>
          ${order.instruction ? `
          <div class="detail-row">
            <span class="detail-label">Special Instructions:</span>
            <span class="detail-value">${order.instruction}</span>
          </div>
          ` : ""}
        </div>
      </div>

      <div class="section">
        <h2>Delivery Details</h2>
        <div class="section-content">
          <div class="detail-row">
            <span class="detail-label">Delivery Type:</span>
            <span class="detail-value">${order.deliveryType === "delivery" ? "Home Delivery" : "Pick up from store"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">City:</span>
            <span class="detail-value">${order.city}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Area:</span>
            <span class="detail-value">${order.area.charAt(0).toUpperCase() + order.area.slice(1)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Address:</span>
            <span class="detail-value">${order.address || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Delivery Date:</span>
            <span class="detail-value">${deliveryDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Delivery Time:</span>
            <span class="detail-value">${deliveryTime}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Payment Details</h2>
        <div class="payment-summary">
          <div class="payment-row">
            <span>Base Price (${order.size} kg):</span>
            <span>₹${order.originalPrice * order.sizeMultiplier}</span>
          </div>
          ${order.deliveryCharge > 0 ? `
          <div class="payment-row">
            <span>Delivery Charge:</span>
            <span>₹${order.deliveryCharge}</span>
          </div>
          ` : ""}
          ${order.discountAmount > 0 ? `
          <div class="payment-row" style="color: green;">
            <span>Discount ${order.couponCode ? `(${order.couponCode})` : ""}:</span>
            <span>-₹${order.discountAmount}</span>
          </div>
          ` : ""}
          <div class="payment-total">
            <span>Total Amount:</span>
            <span>₹${order.totalPrice}</span>
          </div>
          <div class="payment-row" style="margin-top: 15px; font-size: 10px; color: #8a6a52;">
            <span>Payment Status:</span>
            <span style="color: green; font-weight: bold;">Paid</span>
          </div>
        </div>
      </div>
    </div>

    <div class="invoice-footer">
      <p>Thank you for your order! 🎂</p>
      <p>© ${new Date().getFullYear()} Crazy Cakes. All rights reserved.</p>
      <p style="margin-top: 10px;">This is a computer-generated invoice.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Function to generate PDF with retry mechanism
    const generatePDF = (retryCount = 0) => {
      // Check if html2pdf is available
      if (typeof window.html2pdf === "undefined" && retryCount < 15) {
        // Retry after a short delay
        setTimeout(() => generatePDF(retryCount + 1), 150);
        return;
      }

      if (typeof window.html2pdf === "undefined" || typeof window.html2pdf !== "function") {
        toast.error("PDF library failed to load. Please refresh the page and try again.");
        return;
      }

      // Create a temporary div with invoice content
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = invoiceHTML;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      document.body.appendChild(tempDiv);
      
      const element = tempDiv.querySelector(".invoice-container");
      
      if (!element) {
        document.body.removeChild(tempDiv);
        toast.error("Failed to create invoice content.");
        return;
      }
      
      // Configure PDF options
      const opt = {
        margin: [5, 5, 5, 5],
        filename: `Invoice_${order._id.toString().slice(-8)}_${new Date().toISOString().split("T")[0]}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false
        },
        jsPDF: { 
          unit: "mm", 
          format: "a4", 
          orientation: "portrait",
          compress: true
        }
      };
      
      // Generate and download PDF
      try {
        window.html2pdf().set(opt).from(element).save().then(() => {
          document.body.removeChild(tempDiv);
          toast.success("Invoice downloaded as PDF!");
        }).catch((error) => {
          document.body.removeChild(tempDiv);
          console.error("PDF generation error:", error);
          toast.error("Failed to generate PDF. Please try again.");
        });
      } catch (error) {
        document.body.removeChild(tempDiv);
        console.error("PDF generation error:", error);
        toast.error("Failed to generate PDF. Please try again.");
      }
    };

    // Check if html2pdf is already loaded
    if (typeof window.html2pdf !== "undefined") {
      generatePDF();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="html2pdf"]');
    if (existingScript) {
      // Wait for script to load if not complete
      if (!existingScript.complete) {
        existingScript.onload = () => {
          generatePDF();
        };
      } else {
        // Script loaded but library might not be ready
        generatePDF();
      }
      return;
    }

    // Load html2pdf library from CDN (try alternative CDN if first fails)
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js";
    script.async = true;
    
    script.onload = () => {
      // Wait a moment for library to fully initialize
      setTimeout(() => {
        if (typeof window.html2pdf === "function") {
          generatePDF();
        } else {
          // Try alternative CDN
          const altScript = document.createElement("script");
          altScript.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
          altScript.onload = () => {
            setTimeout(() => generatePDF(), 200);
          };
          altScript.onerror = () => {
            toast.error("Failed to load PDF library. Please check your internet connection.");
          };
          document.head.appendChild(altScript);
        }
      }, 200);
    };
    
    script.onerror = () => {
      // Try alternative CDN
      const altScript = document.createElement("script");
      altScript.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      altScript.onload = () => {
        setTimeout(() => generatePDF(), 200);
      };
      altScript.onerror = () => {
        toast.error("Failed to load PDF library. Please check your internet connection.");
      };
      document.head.appendChild(altScript);
    };
    
    document.head.appendChild(script);
  };

  const handleReorder = (order) => {
    const cartItem = {
      productId: order.product._id,
      _id: order.product._id,
      name: order.product.name,
      price: order.originalPrice,
      images: order.product.images,
      size: order.size,
      area: order.area,
      city: order.city,
      deliveryType: order.deliveryType,
      deliveryDate: order.deliveryDate,
      deliveryTime: order.deliveryTime,
      instruction: order.instruction || "",
    };

    addToCart(cartItem);
    toast.success("Added to cart! Please review and checkout.");
    router.push("/cart");
  };

  const handleReviewSubmit = async (orderId) => {
    if (!rating || rating < 1 || rating > 5) {
      toast.error("Please select a rating (1-5 stars)");
      return;
    }

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
          rating,
          review: review.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to submit review");
        return;
      }

      toast.success("Review submitted successfully!");
      setReviewingOrder(null);
      setRating(0);
      setReview("");

      // Refresh orders
      const refreshResponse = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok) {
        setOrders(refreshData.orders || []);
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const renderStars = (currentRating, interactive = false, onStarClick = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive && onStarClick ? () => onStarClick(star) : undefined}
            className={interactive ? "cursor-pointer" : "cursor-default"}
            disabled={!interactive}
          >
            <svg
              className={`h-5 w-5 ${
                star <= currentRating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Header />
        <Container>
          <div className="py-12">
            <Loader/>
          </div>
        </Container>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedOrders = orders.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Header />
      <Container>
        <div className="sm:py-12 py-8">
          <h1 className="mb-6 sm:text-3xl text-2xl font-bold text-[#5b3a29]">My Orders</h1>

          {orders.length === 0 ? (
            <div className="rounded-2xl border border-[#f1e4d8] bg-white p-12 text-center">
              <p className="text-lg text-[#8a6a52]">No orders yet</p>
              <button
                onClick={() => router.push("/category/cake")}
                className="mt-4 rounded-full bg-[#5b3a29] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#3e261a]"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <>
            <div className="space-y-6">
                {paginatedOrders.map((order) => (
                <div
                  key={order._id}
                  className="overflow-hidden rounded-2xl border border-[#f1e4d8] bg-white shadow-sm relative"
                >
                  {/* Order ID at top left */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="rounded-full bg-[#5b3a29] px-3 py-1 text-xs font-semibold text-white">
                      Order ID: {order._id?.toString().slice(-8) || "N/A"}
                    </span>
                  </div>
                  <div className="grid gap-6 p-6 md:grid-cols-2 pt-12">
                    {/* Left: Product Info */}
                    <div>
                      <div className="mb-4 flex  sm:flex-row flex-col items-start gap-4">
                        {order.product?.images?.[0]?.url && (
                          <img
                            src={order.product.images[0]?.url}
                            alt={order.product?.name}
                            className="h-24 w-24 rounded-lg object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        )}
                        <div>
                          <h3 className="mb-1 text-lg font-semibold text-[#5b3a29]">
                            {order.product?.name || "Product"}
                          </h3>
                          <p className="text-sm text-[#8a6a52]">
                            Size: {order.size} kg
                          </p>
                          <p className="text-sm text-[#8a6a52]">
                            {order.city} - {order.area.charAt(0).toUpperCase() + order.area.slice(1)}
                          </p>
                          <p className="text-sm text-[#8a6a52]">
                            <span className="font-medium">Phone:</span> {order.phone || "N/A"}
                          </p>
                          <p className="text-sm text-[#8a6a52]">
                            <span className="font-medium">Address:</span> {order.address || "N/A"}
                          </p>
                        </div>
                      </div>

                      {order.customizeImage?.url && (
                        <div className="mb-2">
                          <p className="mb-1 text-xs font-medium text-[#8a6a52]">
                            Customize Image:
                          </p>
                          <img
                            src={order.customizeImage.url}
                            alt="Customize"
                            className="h-16 w-16 rounded border border-[#e5d4c4] object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      )}

                      {order.instruction && (
                        <p className="text-sm text-[#8a6a52]">
                          <span className="font-medium">Instruction:</span> {order.instruction}
                        </p>
                      )}
                       <div className="mt-4 space-y-2">
                          <button
                            onClick={() => setTrackingOrder(order)}
                            className="w-full rounded-full bg-[#5b3a29] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3e261a] flex items-center justify-center gap-2"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            Track My Order
                          </button>
                          
                          {/* Only show Cancel and Modify for pending orders */}
                          {/* Once admin updates status beyond pending, cancel option is removed */}
                          {order.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleModifyOrder(order)}
                                className="flex-1 rounded-full border border-[#5b3a29] bg-white px-4 py-2 text-sm font-semibold text-[#5b3a29] transition hover:bg-[#fff4ea]"
                              >
                                Modify
                              </button>
                              <button
                                onClick={() => handleCancelOrder(order._id)}
                                className="flex-1 rounded-full border border-red-600 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                          
                          {/* Show info message if order is being processed (beyond pending) */}
                          {(order.status === "approved" || 
                            order.status === "preparing" || 
                            order.status === "ready") && (
                            <div className="mt-2 rounded-lg bg-blue-50 border border-blue-200 p-2">
                              <p className="text-xs text-blue-800 text-center">
                                Order is being processed. Cancellation is no longer available.
                              </p>
                            </div>
                          )}
                          
                          {order.status === "delivered" && (
                            <div className="space-y-2">
                              <button
                                onClick={() => handleDownloadInvoice(order)}
                                className="w-full rounded-full bg-[#5b3a29] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3e261a] flex items-center justify-center gap-2"
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
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                Download Invoice
                              </button>
                              <button
                                onClick={() => handleReorder(order)}
                                className="w-full rounded-full border border-[#5b3a29] bg-white px-4 py-2 text-sm font-semibold text-[#5b3a29] transition hover:bg-[#fff4ea]"
                              >
                                Reorder
                              </button>
                            </div>
                          )}
                          
                          {order.status === "cancelled" && (
                            <button
                              onClick={() => handleReorder(order)}
                              className="w-full rounded-full border border-[#5b3a29] bg-white px-4 py-2 text-sm font-semibold text-[#5b3a29] transition hover:bg-[#fff4ea]"
                            >
                              Reorder
                            </button>
                          )}
                        </div>
                    </div>

                    {/* Right: Order Details */}
                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm text-[#8a6a52]">Status:</span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>

                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-[#8a6a52]">Delivery:</span>
                          <span className="font-medium text-[#5b3a29]">
                            {order.deliveryType === "delivery" ? "Home Delivery" : "Pick up from store"}
                          </span>
                        </div>
                        {order.deliveryDate && (
                          <div className="mb-2 flex justify-between text-sm">
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
                          <div className="mb-2 flex justify-between text-sm">
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
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-[#8a6a52]">Total Price:</span>
                          <span className="font-medium text-[#5b3a29]">
                            {order.deliveryType === "delivery"
                              ? "Home Delivery"
                              : "Pick up from store"}
                          </span>
                        </div>

                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-[#8a6a52]">Order Date:</span>
                          <span className="font-medium text-[#5b3a29]">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>

                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-[#8a6a52]">Base Price:</span>
                          <span className="font-medium text-[#5b3a29]">
                            ₹{order.originalPrice * order.sizeMultiplier}
                          </span>
                        </div>

                        {order.deliveryCharge > 0 && (
                          <div className="mb-2 flex justify-between text-sm">
                            <span className="text-[#8a6a52]">Delivery Charge:</span>
                            <span className="font-medium text-[#5b3a29]">
                              ₹{order.deliveryCharge}
                            </span>
                          </div>
                        )}

                        <div className="mt-3 flex justify-between border-t border-[#e5d4c4] pt-3">
                          <span className="font-semibold text-[#5b3a29]">Total:</span>
                          <span className="text-lg font-bold text-[#5b3a29]">
                            ₹{order.totalPrice}
                          </span>
                        </div>



                        {/* Action Buttons */}
                       

                        {/* Admin Message */}
                        {order.adminMessage && (
                          <div className="mt-3 rounded-lg bg-[#fff4ea] border border-[#f1e4d8] p-3">
                            <p className="mb-1 text-xs font-semibold text-[#8a6a52] uppercase tracking-wide">
                              Message from Admin:
                            </p>
                            <p className="text-sm text-[#5b3a29]">{order.adminMessage}</p>
                          </div>
                        )}

                        {/* Review Section - Show for all orders except pending and rejected */}
                        {order.status !== "pending" && order.status !== "rejected" && order.status !== "cancelled" && (
                          <div className="mt-4 border-t border-[#e5d4c4] pt-4">
                            <p className="mb-3 text-sm font-semibold text-[#5b3a29]">
                              Share Your Experience
                            </p>
                            {order.rating && order.review ? (
                              <div className="rounded-lg bg-[#fff4ea] border border-[#f1e4d8] p-3">
                                <p className="mb-2 text-sm font-medium text-[#5b3a29]">
                                  Your Review:
                                </p>
                                <div className="mb-2">{renderStars(order.rating)}</div>
                                <p className="text-sm text-[#8a6a52]">{order.review}</p>
                              </div>
                            ) : reviewingOrder === order._id ? (
                              <div className="rounded-lg border border-[#e5d4c4] bg-white p-4">
                                <p className="mb-2 text-sm font-medium text-[#5b3a29]">
                                  Rate Your Experience (1-5 stars):
                                </p>
                                <div className="mb-3">{renderStars(rating, true, setRating)}</div>
                                {rating > 0 && (
                                  <p className="mb-2 text-xs text-[#8a6a52]">
                                    Selected: {rating} {rating === 1 ? 'star' : 'stars'}
                                  </p>
                                )}
                                <label className="mb-2 block text-sm font-medium text-[#5b3a29]">
                                  Write Your Review:
                                </label>
                                <textarea
                                  value={review}
                                  onChange={(e) => setReview(e.target.value)}
                                  placeholder="Share your experience with this product..."
                                  rows={4}
                                  className="mb-3 w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleReviewSubmit(order._id)}
                                    disabled={!rating || rating < 1}
                                    className="rounded-full bg-[#5b3a29] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3e261a] disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Submit Review
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReviewingOrder(null);
                                      setRating(0);
                                      setReview("");
                                    }}
                                    className="rounded-full border border-[#5b3a29] px-4 py-2 text-xs font-semibold text-[#5b3a29] transition hover:bg-[#fff4ea]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setReviewingOrder(order._id);
                                  setRating(0);
                                  setReview("");
                                }}
                                className="w-full rounded-full bg-[#5b3a29] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3e261a]"
                              >
                                ⭐ Write a Review & Rating
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </Container>

      {/* Modify Order Modal */}
      {modifyingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e5d4c4] px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#5b3a29]">Modify Order</h2>
              <button
                onClick={() => {
                  setModifyingOrder(null);
                  setModifyData({});
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5b3a29] mb-1">Phone</label>
                <input
                  type="tel"
                  value={modifyData.phone}
                  onChange={(e) => setModifyData({ ...modifyData, phone: e.target.value })}
                  className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5b3a29] mb-1">Address</label>
                <textarea
                  value={modifyData.address}
                  onChange={(e) => setModifyData({ ...modifyData, address: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29]"
                />
              </div>
              <div className="grid sm:grid-cols-2 grid-cols-1 sm:gap-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#5b3a29] mb-1">Area</label>
                  <select
                    value={modifyData.area}
                    onChange={(e) => setModifyData({ ...modifyData, area: e.target.value })}
                    className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29]"
                  >
                    <option value="">Select area</option>
                    <option value="gomti nagar">Gomti Nagar</option>
                    <option value="chinnat">Chinnat</option>
                    <option value="kamta">Kamta</option>
                    <option value="matiyari">Matiyari</option>
                    <option value="charbagh">Charbagh</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5b3a29] mb-1">Size (kg)</label>
                  <select
                    value={modifyData.size}
                    onChange={(e) => setModifyData({ ...modifyData, size: e.target.value })}
                    className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29]"
                  >
                    <option value="">Select size</option>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                      <option key={s} value={s}>{s} kg</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5b3a29] mb-1">Delivery Type</label>
                <div className="flex sm:flex-row flex-col sm:gap-4 gap-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="pickup"
                      checked={modifyData.deliveryType === "pickup"}
                      onChange={(e) => setModifyData({ ...modifyData, deliveryType: e.target.value })}
                      className="mr-2"
                    />
                    <span className="text-sm text-[#5b3a29]">Pickup</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="delivery"
                      checked={modifyData.deliveryType === "delivery"}
                      onChange={(e) => setModifyData({ ...modifyData, deliveryType: e.target.value })}
                      className="mr-2"
                    />
                    <span className="text-sm text-[#5b3a29]">Delivery (+₹50)</span>
                  </label>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 grid-cols-1 sm:gap-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#5b3a29] mb-1">Delivery Date</label>
                  <input
                    type="date"
                    value={modifyData.deliveryDate}
                    onChange={(e) => setModifyData({ ...modifyData, deliveryDate: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5b3a29] mb-1">Delivery Time</label>
                  <input
                    type="time"
                    value={modifyData.deliveryTime}
                    onChange={(e) => setModifyData({ ...modifyData, deliveryTime: e.target.value })}
                    className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5b3a29] mb-1">Instructions</label>
                <textarea
                  value={modifyData.instruction}
                  onChange={(e) => setModifyData({ ...modifyData, instruction: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29]"
                />
              </div>
              <div className="flex gap-3 sm:pt-4 pt-2">
                <button
                  onClick={() => handleModifySubmit(modifyingOrder)}
                  className="flex-1 rounded-full bg-[#5b3a29] sm:px-4 px-3 sm:py-2 py-1 sm:text-sm text-xs font-semibold text-white transition hover:bg-[#3e261a]"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setModifyingOrder(null);
                    setModifyData({});
                  }}
                  className="flex-1 rounded-full border border-[#5b3a29] sm:px-4 px-3 sm:py-2 py-1 sm:text-sm text-xs font-semibold text-[#5b3a29] transition hover:bg-[#fff4ea]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Tracking Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e5d4c4] px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#5b3a29]">Order Tracking</h2>
              <button
                onClick={() => setTrackingOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <OrderTracking order={trackingOrder} />
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2000} theme="colored" />
      <Footer/>
    </div>
  );
};

export default OrdersPage;

