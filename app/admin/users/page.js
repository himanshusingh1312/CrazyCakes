"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "../../container";
import Header from "../../header/page";

const AdminUsersPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showViewCouponsModal, setShowViewCouponsModal] = useState(false);
  const [showViewOrdersModal, setShowViewOrdersModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userCoupons, setUserCoupons] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [couponData, setCouponData] = useState({
    code: "",
    message: "",
    discountPercent: "",
    expiresAt: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteCouponConfirm, setDeleteCouponConfirm] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]); // Array of selected user IDs

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
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        const response = await fetch("/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          // Users are already filtered by API to only return type "user"
          console.log("Fetched users:", data.users);
          setUsers(data.users || []);
        } else {
          console.error("Error fetching users:", data.error);
          toast.error(data.error || "Failed to fetch users");
        }
      } catch (err) {
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (user && user.type === "admin") {
      fetchUsers();
    }
  }, [user, router]);

  const handleDeleteUser = async (userId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Unauthorized");
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("User deleted successfully");
        setUsers(users.filter((u) => u._id !== userId));
        setDeleteConfirm(null);
      } else {
        toast.error(data.error || "Failed to delete user");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const handleOpenCouponModal = (userId) => {
    setSelectedUserId(userId);
    setSelectedUsers([]); // Clear bulk selection when opening for single user
    setCouponData({
      code: "",
      message: "",
      discountPercent: "",
      expiresAt: "",
    });
    setShowCouponModal(true);
  };

  const handleViewCoupons = async (userId) => {
    setSelectedUserId(userId);
    setLoadingCoupons(true);
    setShowViewCouponsModal(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized");
        return;
      }

      const response = await fetch(`/api/coupons?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUserCoupons(data.coupons || []);
      } else {
        toast.error(data.error || "Failed to fetch coupons");
        setUserCoupons([]);
      }
    } catch (err) {
      toast.error("Something went wrong");
      setUserCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Unauthorized");
      return;
    }

    if (!couponId) {
      toast.error("Coupon ID is missing");
      return;
    }

    try {
      console.log("Deleting coupon with ID:", couponId);
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Coupon deleted successfully");
        // Refresh coupons list
        if (selectedUserId) {
          handleViewCoupons(selectedUserId);
        }
        setDeleteCouponConfirm(null);
      } else {
        console.error("Delete coupon error:", data.error);
        toast.error(data.error || "Failed to delete coupon");
      }
    } catch (err) {
      console.error("Delete coupon exception:", err);
      toast.error("Something went wrong");
    }
  };

  const handleViewOrders = async (userId) => {
    setSelectedUserId(userId);
    setLoadingOrders(true);
    setShowViewOrdersModal(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized");
        return;
      }

      const response = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Filter orders for this specific user
        const filteredOrders = (data.orders || []).filter(
          (order) => order.user?._id === userId || order.user === userId
        );
        setUserOrders(filteredOrders);
      } else {
        toast.error(data.error || "Failed to fetch orders");
        setUserOrders([]);
      }
    } catch (err) {
      toast.error("Something went wrong");
      setUserOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCouponChange = (e) => {
    const { name, value } = e.target;
    setCouponData({ ...couponData, [name]: value });
  };

  const generateCouponCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouponData({ ...couponData, code });
  };

  const generateUniqueCouponCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateCoupon = async () => {
    if (!couponData.message || !couponData.discountPercent) {
      toast.error("Please fill all required fields");
      return;
    }

    if (
      couponData.discountPercent < 1 ||
      couponData.discountPercent > 100
    ) {
      toast.error("Discount must be between 1% and 100%");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Unauthorized");
      return;
    }

    // Determine which users to create coupons for
    const usersToProcess = selectedUsers.length > 0 ? selectedUsers : (selectedUserId ? [selectedUserId] : []);
    
    if (usersToProcess.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;
      const failedUsers = [];

      // Create coupon for each selected user with unique code
      for (const userId of usersToProcess) {
        try {
          // Generate unique code for each user (or use provided code for single user)
          let couponCode = couponData.code;
          
          // If multiple users, generate unique code for each
          // If single user and code provided, use it; otherwise generate
          if (usersToProcess.length > 1) {
            // For bulk creation, always generate unique codes
            couponCode = generateUniqueCouponCode();
          } else if (!couponCode) {
            // For single user, generate if not provided
            couponCode = generateUniqueCouponCode();
          }

          const response = await fetch("/api/coupons", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              code: couponCode,
              message: couponData.message,
              discountPercent: couponData.discountPercent,
              userId: userId,
              expiresAt: couponData.expiresAt || null,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            const user = users.find(u => u._id === userId);
            failedUsers.push(user?.name || user?.email || userId);
            console.error(`Failed to create coupon for user ${userId}:`, data.error);
          }
        } catch (err) {
          failCount++;
          const user = users.find(u => u._id === userId);
          failedUsers.push(user?.name || user?.email || userId);
          console.error(`Error creating coupon for user ${userId}:`, err);
        }
      }

      if (successCount > 0) {
        toast.success(`Coupon created successfully for ${successCount} user(s)!`);
        if (failCount > 0) {
          toast.warning(`${failCount} coupon(s) failed to create. ${failedUsers.length > 0 ? `Failed for: ${failedUsers.slice(0, 3).join(', ')}${failedUsers.length > 3 ? '...' : ''}` : ''}`);
        }
        setShowCouponModal(false);
        setCouponData({
          code: "",
          message: "",
          discountPercent: "",
          expiresAt: "",
        });
        setSelectedUserId(null);
        setSelectedUsers([]); // Clear selection after creating coupons
      } else {
        toast.error("Failed to create coupons for all selected users");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  // Checkbox handlers
  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u._id));
    }
  };

  const handleBulkOpenCouponModal = () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }
    setSelectedUserId(null); // Clear single user selection
    setCouponData({
      code: "",
      message: "",
      discountPercent: "",
      expiresAt: "",
    });
    setShowCouponModal(true);
  };

  const handleBulkViewCoupons = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }
    setLoadingCoupons(true);
    setShowViewCouponsModal(true);
    setSelectedUserId(null); // Clear single user selection

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized");
        return;
      }

      // Fetch coupons for all selected users
      const allCoupons = [];
      for (const userId of selectedUsers) {
        try {
          const response = await fetch(`/api/coupons?userId=${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.ok && data.coupons) {
            // Add user info to each coupon
            const user = users.find((u) => u._id === userId);
            const couponsWithUser = data.coupons.map((coupon) => ({
              ...coupon,
              userName: user?.name || "Unknown",
              userEmail: user?.email || "Unknown",
            }));
            allCoupons.push(...couponsWithUser);
          }
        } catch (err) {
          console.error(`Error fetching coupons for user ${userId}:`, err);
        }
      }

      setUserCoupons(allCoupons);
    } catch (err) {
      toast.error("Something went wrong");
      setUserCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5dc]">
      <Header />
      <Container>
        <div className="py-8 md:py-10">
          <h1 className="text-2xl md:text-3xl font-bold text-[#8B4513] mb-5 md:mb-6">
            All Users Management
          </h1>

          {/* Bulk Actions Bar */}
          {selectedUsers.length > 0 && (
            <div className="mb-4 bg-white rounded-lg shadow-md p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[#8B4513]">
                {selectedUsers.length} user(s) selected
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleBulkOpenCouponModal}
                  className="px-3 md:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
                >
                  Generate Coupon for Selected
                </button>
                <button
                  onClick={handleBulkViewCoupons}
                  className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold flex items-center gap-1"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  View Coupons
                </button>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="px-3 md:px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm font-semibold"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#8B4513] text-white">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold w-12">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                        title="Select All"
                      />
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold">
                      Name
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold">
                      Email
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold">
                      Phone
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold">
                      Address
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold">
                      Pincode
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 md:px-6 py-8 text-center text-gray-500"
                      >
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50">
                        <td className="px-4 md:px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(u._id)}
                            onChange={() => handleSelectUser(u._id)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 md:px-6 py-4 text-xs md:text-sm">{u.name}</td>
                        <td className="px-4 md:px-6 py-4 text-xs md:text-sm break-words">{u.email}</td>
                        <td className="px-4 md:px-6 py-4 text-xs md:text-sm">
                          {u.phone || "N/A"}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-xs md:text-sm">
                          {u.address?.addressLine1 || "N/A"}
                          {u.address?.addressLine2 && `, ${u.address.addressLine2}`}
                          {u.address?.city && `, ${u.address.city}`}
                          {u.address?.state && `, ${u.address.state}`}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-xs md:text-sm">
                          {u.address?.pincode || "N/A"}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-xs md:text-sm">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleOpenCouponModal(u._id)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                            >
                              Create Coupon
                            </button>
                            <button
                              onClick={() => handleViewCoupons(u._id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center gap-1"
                              title="View Coupons"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              View
                            </button>
                            <button
                              onClick={() => handleViewOrders(u._id)}
                              className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs flex items-center gap-1"
                              title="View Orders"
                            >
                              <svg
                                className="h-4 w-4"
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
                              Orders
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(u._id)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Container>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-[#8B4513] mb-4">
              Confirm Delete
            </h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Creation Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-[#8B4513] mb-4">
              Create Discount Coupon
              {selectedUsers.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  (for {selectedUsers.length} selected user{selectedUsers.length > 1 ? 's' : ''})
                </span>
              )}
              {selectedUserId && !selectedUsers.length && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  (for selected user)
                </span>
              )}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coupon Code {selectedUsers.length > 1 ? "(Auto-generated for each user)" : "*"}
                </label>
                {selectedUsers.length > 1 ? (
                  <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                    <p>Unique coupon codes will be automatically generated for each selected user.</p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="code"
                      value={couponData.code}
                      onChange={handleCouponChange}
                      placeholder="Enter or generate code"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                    />
                    <button
                      onClick={generateCouponCode}
                      className="px-3 py-2 bg-[#8B4513] text-white rounded hover:bg-[#6B3410] text-sm whitespace-nowrap"
                    >
                      Generate
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={couponData.message}
                  onChange={handleCouponChange}
                  placeholder="Enter coupon message for user"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage * (1-100)
                </label>
                <input
                  type="number"
                  name="discountPercent"
                  value={couponData.discountPercent}
                  onChange={handleCouponChange}
                  placeholder="e.g., 10 for 10%"
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  name="expiresAt"
                  value={couponData.expiresAt}
                  onChange={handleCouponChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowCouponModal(false);
                  setCouponData({
                    code: "",
                    message: "",
                    discountPercent: "",
                    expiresAt: "",
                  });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCoupon}
                className="px-4 py-2 bg-[#8B4513] text-white rounded hover:bg-[#6B3410]"
              >
                Create Coupon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Coupons Modal */}
      {showViewCouponsModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#8B4513]">
                User Coupons
              </h2>
              <button
                onClick={() => {
                  setShowViewCouponsModal(false);
                  setUserCoupons([]);
                  setSelectedUserId(null);
                }}
                className="text-gray-500 hover:text-gray-700"
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
            </div>

            {loadingCoupons ? (
              <div className="text-center py-8">Loading coupons...</div>
            ) : userCoupons.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {selectedUsers.length > 0 
                  ? "No coupons found for selected users."
                  : "No coupons found for this user."}
              </div>
            ) : (
              <div className="space-y-3">
                {userCoupons.map((coupon) => (
                  <div
                    key={coupon._id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {(coupon.userName || coupon.userEmail) && (
                          <div className="mb-2 text-xs text-gray-600">
                            <span className="font-semibold">User:</span> {coupon.userName || coupon.userEmail}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-[#8B4513]">
                            Code: {coupon.code}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            {coupon.discountPercent}% OFF
                          </span>
                          {coupon.isUsed && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                              Used
                            </span>
                          )}
                          {coupon.expiresAt &&
                            new Date(coupon.expiresAt) < new Date() && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                Expired
                              </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {coupon.message}
                        </p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>
                            Created:{" "}
                            {new Date(coupon.createdAt).toLocaleDateString()}
                          </p>
                          {coupon.expiresAt && (
                            <p>
                              Expires:{" "}
                              {new Date(coupon.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                          {coupon.isUsed && coupon.usedAt && (
                            <p>
                              Used on:{" "}
                              {new Date(coupon.usedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteCouponConfirm(coupon._id)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete coupon"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Coupon Confirmation Modal */}
      {deleteCouponConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-[#8B4513] mb-4">
              Confirm Delete
            </h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this coupon? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteCouponConfirm(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCoupon(deleteCouponConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Orders Modal */}
      {showViewOrdersModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-[#8B4513]">
                User Orders
              </h2>
              <button
                onClick={() => {
                  setShowViewOrdersModal(false);
                  setUserOrders([]);
                  setSelectedUserId(null);
                }}
                className="text-gray-500 hover:text-gray-700"
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
            </div>

            <div className="p-6 overflow-y-auto flex-1" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              {loadingOrders ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : userOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No orders found for this user.
                </div>
              ) : (
                <div className="space-y-4">
                  {userOrders.map((order) => (
                    <div
                      key={order._id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-start gap-3 mb-3">
                          {order.product?.images?.[0] && (
                            <img
                              src={order.product.images[0]}
                              alt={order.product?.name}
                              className="h-20 w-20 rounded-lg object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#8B4513] mb-1">
                              {order.product?.name || "Product"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Size: {order.size} kg
                            </p>
                            <p className="text-sm text-gray-600">
                              Price: ₹{order.originalPrice} per kg
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-semibold">Area:</span>{" "}
                            {order.area}
                          </p>
                          <p>
                            <span className="font-semibold">Delivery:</span>{" "}
                            {order.deliveryType === "delivery"
                              ? "Home Delivery"
                              : "Pick up from store"}
                          </p>
                          <p>
                            <span className="font-semibold">Date:</span>{" "}
                            {order.deliveryDate
                              ? new Date(order.deliveryDate).toLocaleDateString()
                              : "N/A"}
                          </p>
                          <p>
                            <span className="font-semibold">Time:</span>{" "}
                            {order.deliveryTime || "N/A"}
                          </p>
                          {order.customizeImage && (
                            <p>
                              <span className="font-semibold">Custom Image:</span>{" "}
                              <a
                                href={order.customizeImage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View Image
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="mb-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : order.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : order.status === "delivered"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {order.status?.toUpperCase() || "PENDING"}
                          </span>
                        </div>
                        <div className="text-sm space-y-1 mb-3">
                          <p>
                            <span className="font-semibold text-gray-600">
                              Base Price:
                            </span>{" "}
                            ₹{order.originalPrice * order.sizeMultiplier}
                          </p>
                          {order.deliveryCharge > 0 && (
                            <p>
                              <span className="font-semibold text-gray-600">
                                Delivery:
                              </span>{" "}
                              ₹{order.deliveryCharge}
                            </p>
                          )}
                          {order.discountAmount > 0 && (
                            <p className="text-green-600">
                              <span className="font-semibold">Discount:</span> -
                              ₹{order.discountAmount}
                            </p>
                          )}
                          <p className="text-lg font-bold text-[#8B4513] border-t pt-2 mt-2">
                            Total: ₹{order.totalPrice}
                          </p>
                        </div>
                        {order.adminMessage && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                            <span className="font-semibold">Admin Message:</span>{" "}
                            {order.adminMessage}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-3">
                          Ordered:{" "}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default AdminUsersPage;

