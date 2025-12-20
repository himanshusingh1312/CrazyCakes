"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "../../container";
import OrderTracking from "../../components/OrderTracking";
import Header from "../../header/page";
import AdminTrackingUpdate from "../../components/AdminTrackingUpdate";

const AdminOrdersPage = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
          toast.error("Failed to fetch orders");
        }
      } catch (err) {
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (user && user.type === "admin") {
      fetchOrders();
    }
  }, [user, router]);

  const handleEdit = (order) => {
    setEditingOrder(order._id);
    setStatus(order.status);
    setAdminMessage(order.adminMessage || "");
  };

  const handleCancel = () => {
    setEditingOrder(null);
    setStatus("");
    setAdminMessage("");
  };

  const handleSave = async (orderId) => {
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
          status,
          adminMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update order");
        return;
      }

      toast.success("Order updated successfully!");
      setEditingOrder(null);
      setStatus("");
      setAdminMessage("");

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

  const handleTrackingStatusUpdate = async (newStatus) => {
    if (!trackingOrder) return;

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
          orderId: trackingOrder._id,
          status: newStatus,
          adminMessage: trackingOrder.adminMessage || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update order");
        return;
      }

      toast.success(`Order status updated to: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`);

      // Refresh orders and update tracking order
      const refreshResponse = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok) {
        setOrders(refreshData.orders || []);
        // Update the tracking order with new status
        const updatedOrder = refreshData.orders.find(o => o._id === trackingOrder._id);
        if (updatedOrder) {
          setTrackingOrder(updatedOrder);
        }
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const handleDeleteClick = (order) => {
    setDeletingOrder(order);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingOrder) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login again");
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`/api/orders?orderId=${deletingOrder._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to delete order");
        return;
      }

      toast.success("Order deleted successfully!");
      setShowDeleteConfirm(false);
      setDeletingOrder(null);

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

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeletingOrder(null);
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
          <div className="py-8 md:py-12">
            <p className="text-center text-[#8a6a52]">Loading...</p>
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
          <h1 className="mb-5 md:mb-6 text-2xl md:text-3xl font-bold text-[#5b3a29]">All Orders</h1>

          {orders.length === 0 ? (
            <div className="rounded-2xl border border-[#f1e4d8] bg-white p-10 md:p-12 text-center">
              <p className="text-base md:text-lg text-[#8a6a52]">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-5 md:space-y-6">
              {orders.map((order) => (
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
                  <div className="grid gap-4 md:gap-6 p-5 md:p-6 lg:grid-cols-3 pt-12">
                    {/* Left: Product & User Info */}
                    <div className="lg:col-span-2">
                      <div className="mb-3 md:mb-4 flex  sm:flex-row flex-col items-start gap-3 md:gap-4">
                        {order.product?.images?.[0]?.url && (
                          <img
                            src={order.product.images[0].url}
                            alt={order.product?.name}
                            className="h-20 w-20 md:h-24 md:w-24 rounded-lg object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="mb-1 text-base md:text-lg font-semibold text-[#5b3a29]">
                            {order.product?.name || "Product"}
                          </h3>
                          <p className="text-xs md:text-sm text-[#8a6a52]">
                            Size: {order.size} kg
                          </p>
                          <p className="text-xs md:text-sm text-[#8a6a52]">
                            {order.city} - {order.area.charAt(0).toUpperCase() + order.area.slice(1)}
                          </p>
                          <p className="mt-2 text-xs md:text-sm text-[#8a6a52]">
                            <span className="font-medium">Customer:</span> {order.user?.name || "N/A"} ({order.user?.email || "N/A"})
                          </p>
                          <p className="text-xs md:text-sm text-[#8a6a52]">
                            <span className="font-medium">Phone:</span> {order.phone || "N/A"}
                          </p>
                          <p className="text-xs md:text-sm text-[#8a6a52]">
                            <span className="font-medium">Address:</span> {order.address || "N/A"}
                          </p>
                        </div>
                      </div>

                      {order.customizeImage?.url && (
                        <div className="mb-2">
                          <p className="mb-1 text-xs font-medium text-[#8a6a52]">
                            Customize Image:
                          </p>
                          <div className="flex items-center gap-2">
                            <img
                              src={order.customizeImage?.url}
                              alt="Customize"
                              className="h-14 w-14 md:h-16 md:w-16 rounded border border-[#e5d4c4] object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                            <button
                              onClick={() => setPreviewImage(order.customizeImage.url)}
                              className="rounded-full bg-[#5b3a29] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#3e261a]"
                            >
                              Preview
                            </button>
                          </div>
                        </div>
                      )}

                      {order.instruction && (
                        <p className="text-xs md:text-sm text-[#8a6a52]">
                          <span className="font-medium">Instruction:</span> {order.instruction}
                        </p>
                      )}
                    </div>

                    {/* Right: Order Details & Actions */}
                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="mb-3">
                          <span className="text-xs md:text-sm text-[#8a6a52]">Status:</span>
                          {editingOrder === order._id ? (
                            <select
                              value={status}
                              onChange={(e) => setStatus(e.target.value)}
                              className="ml-2 rounded-lg border border-[#e5d4c4] bg-white px-2 py-1 text-xs md:text-sm outline-none focus:border-[#5b3a29]"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          ) : (
                            <span
                              className={`ml-2 rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          )}
                        </div>

                        <div className="mb-2 flex justify-between text-xs md:text-sm">
                          <span className="text-[#8a6a52]">Delivery:</span>
                          <span className="font-medium text-[#5b3a29]">
                            {order.deliveryType === "delivery"
                              ? "Home Delivery"
                              : "Pick up from store"}
                          </span>
                        </div>
                        {order.deliveryDate && (
                          <div className="mb-2 flex justify-between text-xs md:text-sm">
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
                          <div className="mb-2 flex justify-between text-xs md:text-sm">
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

                        <div className="mb-2 flex justify-between text-xs md:text-sm">
                          <span className="text-[#8a6a52]">Order Date:</span>
                          <span className="font-medium text-[#5b3a29]">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>

                        <div className="mb-2 flex justify-between text-xs md:text-sm">
                          <span className="text-[#8a6a52]">Total:</span>
                          <span className="font-semibold text-[#5b3a29]">
                            ₹{order.totalPrice}
                          </span>
                        </div>

                        {/* Admin Message Section */}
                        {editingOrder === order._id ? (
                          <div className="mt-4">
                            <label className="mb-1 block text-sm font-medium text-[#5b3a29]">
                              Message to Customer:
                            </label>
                            <textarea
                              value={adminMessage}
                              onChange={(e) => setAdminMessage(e.target.value)}
                              rows={3}
                              className="w-full rounded-lg border border-[#e5d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b3a29] focus:ring-2 focus:ring-[#5b3a29]/20"
                              placeholder="Add a message for the customer..."
                            />
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => handleSave(order._id)}
                                className="rounded-full bg-[#5b3a29] px-4 py-1 text-xs font-semibold text-white transition hover:bg-[#3e261a]"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancel}
                                className="rounded-full border border-[#5b3a29] px-4 py-1 text-xs font-semibold text-[#5b3a29] transition hover:bg-[#fff4ea]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {order.adminMessage && (
                              <div className="mt-3 rounded-lg bg-[#fff4ea] p-2">
                                <p className="text-xs font-medium text-[#8a6a52]">Admin Message:</p>
                                <p className="text-sm text-[#5b3a29]">{order.adminMessage}</p>
                              </div>
                            )}

                            <div className="mt-3 space-y-2">
                              <button
                                onClick={() => handleEdit(order)}
                                className="w-full rounded-full bg-[#5b3a29] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3e261a]"
                              >
                                Update Status & Message
                              </button>
                              {/* Only show tracking update for delivery orders */}
                              {order.deliveryType === "delivery" && (
                                <button
                                  onClick={() => setTrackingOrder(order)}
                                  className="w-full rounded-full border border-[#5b3a29] bg-white px-4 py-2 text-sm font-semibold text-[#5b3a29] transition hover:bg-[#f9f4ee] flex items-center justify-center gap-2"
                                >
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                  </svg>
                                  Update Tracking
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteClick(order)}
                                className="w-full rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 flex items-center justify-center gap-2"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Order
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 rounded-full bg-white p-2 text-[#5b3a29] transition hover:bg-gray-100"
              aria-label="Close preview"
            >
              <svg
                className="h-6 w-6"
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
            <img
              src={previewImage}
              alt="Customize preview"
              className="max-h-[90vh] max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                e.target.src = "/placeholder-image.png";
              }}
            />
          </div>
        </div>
      )}

      {/* Order Tracking Update Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e5d4c4] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#5b3a29]">Update Order Tracking</h2>
                <p className="text-sm text-[#8a6a52] mt-1">
                  Order: {trackingOrder.product?.name || "Product"} - Order ID: {trackingOrder._id?.toString().slice(-8)}
                </p>
              </div>
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
              <AdminTrackingUpdate
                order={trackingOrder}
                currentStatus={trackingOrder.status}
                onStatusUpdate={handleTrackingStatusUpdate}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#5b3a29]">Delete Order</h3>
                <p className="text-sm text-[#8a6a52]">This action cannot be undone</p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-[#8a6a52] mb-2">
                Are you sure you want to delete this order?
              </p>
              <div className="bg-[#fff4ea] rounded-lg p-3 border border-[#e5d4c4]">
                <p className="text-xs font-semibold text-[#5b3a29] mb-1">
                  Order ID: {deletingOrder._id?.toString().slice(-8)}
                </p>
                <p className="text-xs text-[#8a6a52]">
                  Product: {deletingOrder.product?.name || "N/A"}
                </p>
                <p className="text-xs text-[#8a6a52]">
                  Customer: {deletingOrder.user?.name || "N/A"}
                </p>
                <p className="text-xs text-[#8a6a52]">
                  Total: ₹{deletingOrder.totalPrice}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 rounded-full border-2 border-[#5b3a29] bg-white px-4 py-2 text-sm font-semibold text-[#5b3a29] transition hover:bg-[#f9f4ee]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;

