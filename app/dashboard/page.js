"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "../container";
import Header from "../header/page";
import Link from "next/link";
import Footer from '../footer/page';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Loader from "../loader";

const DashboardPage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    deliveredOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    ordersByMonth: [],
    ordersByStatus: [],
    dailyShopping: [],
  });
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const updateScreen = () => {
      if (typeof window !== "undefined") {
        setIsSmallScreen(window.innerWidth < 640);
      }
    };

    updateScreen();
    window.addEventListener("resize", updateScreen);
    return () => window.removeEventListener("resize", updateScreen);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
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
    const fetchDashboardData = async () => {
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
          const userOrders = data.orders || [];
          setOrders(userOrders);

          // Calculate statistics
          const totalOrders = userOrders.length;
          const pendingOrders = userOrders.filter(
            (o) => o.status === "pending"
          ).length;
          const approvedOrders = userOrders.filter(
            (o) => o.status === "approved" || o.status === "preparing" || o.status === "ready"
          ).length;
          const deliveredOrders = userOrders.filter(
            (o) => o.status === "delivered"
          ).length;
          const totalSpent = userOrders.reduce(
            (sum, order) => sum + (order.totalPrice || 0),
            0
          );
          const averageOrderValue =
            totalOrders > 0 ? totalSpent / totalOrders : 0;

          // Orders by month (last 6 months)
          const ordersByMonth = [];
          const now = new Date();
          for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleDateString("en-US", {
              month: "short",
            });
            const monthOrders = userOrders.filter((order) => {
              const orderDate = new Date(order.createdAt);
              return (
                orderDate.getMonth() === date.getMonth() &&
                orderDate.getFullYear() === date.getFullYear()
              );
            });
            ordersByMonth.push({
              month: monthName,
              orders: monthOrders.length,
              revenue: monthOrders.reduce(
                (sum, o) => sum + (o.totalPrice || 0),
                0
              ),
            });
          }

          // Orders by status
          const statusCounts = {};
          userOrders.forEach((order) => {
            const status = order.status || "pending";
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          });
          const ordersByStatus = Object.entries(statusCounts).map(
            ([status, count]) => ({
              name: status.charAt(0).toUpperCase() + status.slice(1),
              value: count,
            })
          );

          // Daily shopping (last 30 days)
          const dailyShopping = [];
          for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            const dayOrders = userOrders.filter((order) => {
              const orderDate = new Date(order.createdAt);
              return (
                orderDate.toDateString() === date.toDateString()
              );
            });
            dailyShopping.push({
              date: dateStr,
              orders: dayOrders.length,
              amount: dayOrders.reduce(
                (sum, o) => sum + (o.totalPrice || 0),
                0
              ),
            });
          }

          setDashboardStats({
            totalOrders,
            pendingOrders,
            approvedOrders,
            deliveredOrders,
            totalSpent,
            averageOrderValue,
            ordersByMonth,
            ordersByStatus,
            dailyShopping,
          });
        } else {
          toast.error("Failed to fetch dashboard data");
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, router]);

  const COLORS = ["#8B4513", "#D2B48C", "#C19A6B", "#A0522D", "#CD853F"];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5dc]">
        <Header />
        <Container>
          <div className="py-4 lg:py-8 flex items-center justify-center">
            <Loader/>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5dc]">
      <Header />
      <Container>
        <div className="py-8">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#8B4513] mb-3 lg:mb-6">
            {user?.type === "admin" ? "Admin Dashboard" : "My Dashboard"}
          </h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4 mb-4 lg:mb-8">
            <div className="bg-white rounded-lg shadow-md p-3 md:p-4 lg:p-6">
              <div className="text-xs md:text-sm text-gray-600 mb-2">
                {user?.type === "admin" ? "Total Orders" : "Total Orders"}
              </div>
              <div className="text-xl md:text-2xl lg:text-3xl font-bold text-[#8B4513]">
                {dashboardStats.totalOrders}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-3 md:p-4 lg:p-6">
              <div className="text-xs md:text-sm text-gray-600 mb-2">
                {user?.type === "admin" ? "Total Pending Orders" : "Pending Orders"}
              </div>
              <div className="text-xl md:text-2xl lg:text-3xl font-bold text-yellow-600">
                {dashboardStats.pendingOrders}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-3 md:p-4 lg:p-6">
              <div className="text-xs md:text-sm text-gray-600 mb-2">
                {user?.type === "admin" ? "Total Delivered Orders" : "Delivered Orders"}
              </div>
              <div className="text-xl md:text-2xl lg:text-3xl font-bold text-green-600">
                {dashboardStats.deliveredOrders}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-3 md:p-4 lg:p-6">
              <div className="text-xs md:text-sm text-gray-600 mb-2">
                {user?.type === "admin" ? "Total Revenue" : "Total Spent"}
              </div>
              <div className="text-xl md:text-2xl lg:text-3xl font-bold text-[#8B4513]">
                ₹{dashboardStats.totalSpent.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 mb-4 lg:mb-8">
            <h2 className="text-base md:text-lg lg:text-xl font-bold text-[#8B4513] mb-3 lg:mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
              <Link
                href="/orders"
                className="flex flex-col items-center justify-center p-3 lg:p-4 bg-[#fff4ea] rounded-lg hover:bg-[#f1e4d8] transition-colors"
              >
                <svg
                  className="h-6 w-6 lg:h-8 lg:w-8 text-[#8B4513] mb-2"
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
                <span className="text-xs md:text-sm font-semibold text-[#8B4513]">
                  My Orders
                </span>
              </Link>
              {user?.type === "user" && (
                <>
                  <Link
                    href="/cart"
                    className="flex flex-col items-center justify-center p-3 lg:p-4 bg-[#fff4ea] rounded-lg hover:bg-[#f1e4d8] transition-colors"
                  >
                    <svg
                      className="h-6 w-6 lg:h-8 lg:w-8 text-[#8B4513] mb-2"
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
                    <span className="text-xs md:text-sm font-semibold text-[#8B4513]">
                      Shopping Cart
                    </span>
                  </Link>
                  <Link
                    href="/wishlist"
                    className="flex flex-col items-center justify-center p-3 lg:p-4 bg-[#fff4ea] rounded-lg hover:bg-[#f1e4d8] transition-colors"
                  >
                    <svg
                      className="h-6 w-6 lg:h-8 lg:w-8 text-[#8B4513] mb-2"
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
                    <span className="text-xs md:text-sm font-semibold text-[#8B4513]">
                      Wishlist
                    </span>
                  </Link>
                </>
              )}
              <Link
                href="/profile"
                className="flex flex-col items-center justify-center p-3 lg:p-4 bg-[#fff4ea] rounded-lg hover:bg-[#f1e4d8] transition-colors"
              >
                <svg
                  className="h-6 w-6 lg:h-8 lg:w-8 text-[#8B4513] mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-xs md:text-sm font-semibold text-[#8B4513]">
                  Profile
                </span>
              </Link>
              {user?.type === "admin" && (
                <>
                  <Link
                    href="/admin/subcategory"
                    className="flex flex-col items-center justify-center p-3 lg:p-4 bg-[#fff4ea] rounded-lg hover:bg-[#f1e4d8] transition-colors"
                  >
                    <svg
                      className="h-6 w-6 lg:h-8 lg:w-8 text-[#8B4513] mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span className="text-xs md:text-sm font-semibold text-[#8B4513]">
                      Add Subcategory
                    </span>
                  </Link>
                  <Link
                    href="/admin/products"
                    className="flex flex-col items-center justify-center p-3 lg:p-4 bg-[#fff4ea] rounded-lg hover:bg-[#f1e4d8] transition-colors"
                  >
                    <svg
                      className="h-6 w-6 lg:h-8 lg:w-8 text-[#8B4513] mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span className="text-xs md:text-sm font-semibold text-[#8B4513]">
                      Add Products
                    </span>
                  </Link>
                  <Link
                    href="/admin/orders"
                    className="flex flex-col items-center justify-center p-3 lg:p-4 bg-[#fff4ea] rounded-lg hover:bg-[#f1e4d8] transition-colors"
                  >
                    <svg
                      className="h-6 w-6 lg:h-8 lg:w-8 text-[#8B4513] mb-2"
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
                    <span className="text-xs md:text-sm font-semibold text-[#8B4513]">
                      Admin Orders
                    </span>
                  </Link>
                  <Link
                    href="/admin/reviews"
                    className="flex flex-col items-center justify-center p-3 lg:p-4 bg-[#fff4ea] rounded-lg hover:bg-[#f1e4d8] transition-colors"
                  >
                    <svg
                      className="h-6 w-6 lg:h-8 lg:w-8 text-[#8B4513] mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                    <span className="text-xs md:text-sm font-semibold text-[#8B4513]">
                      Reviews
                    </span>
                  </Link>
                  <Link
                    href="/admin/users"
                    className="flex flex-col items-center justify-center p-3 lg:p-4 bg-[#fff4ea] rounded-lg hover:bg-[#f1e4d8] transition-colors"
                  >
                    <svg
                      className="h-6 w-6 lg:h-8 lg:w-8 text-[#8B4513] mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span className="text-xs md:text-sm font-semibold text-[#8B4513]">
                      All Users
                    </span>
                  </Link>
                  <Link
                    href="/admin/blogs"
                    className="flex flex-col items-center justify-center p-3 lg:p-4 bg-[#fff4ea] rounded-lg hover:bg-[#f1e4d8] transition-colors"
                  >
                    <svg
                      className="h-6 w-6 lg:h-8 lg:w-8 text-[#8B4513] mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span className="text-xs md:text-sm font-semibold text-[#8B4513]">
                      Admin Blogs
                    </span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-8">
            {/* Monthly Orders Bar Chart */}
            <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
              <h2 className="text-base md:text-lg lg:text-xl font-bold text-[#8B4513] mb-3 lg:mb-4">
                Orders by Month
              </h2>
              <ResponsiveContainer width="100%" height={isSmallScreen ? 220 : 300}>
                <BarChart data={dashboardStats.ordersByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="#8B4513" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Orders by Status Pie Chart */}
            <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
              <h2 className="text-base md:text-lg lg:text-xl font-bold text-[#8B4513] mb-3 lg:mb-4">
                Orders by Status
              </h2>
              <ResponsiveContainer width="100%" height={isSmallScreen ? 220 : 300}>
                <PieChart>
                  <Pie
                    data={dashboardStats.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={isSmallScreen ? 60 : 80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardStats.ordersByStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Shopping Line Chart - Only for Admin */}
          {user?.type === "admin" && (
            <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 mb-4 lg:mb-8">
              <h2 className="text-base md:text-lg lg:text-xl font-bold text-[#8B4513] mb-3 lg:mb-4">
                Daily Shopping (Last 30 Days)
              </h2>
              <ResponsiveContainer width="100%" height={isSmallScreen ? 300 : 400}>
                <LineChart data={dashboardStats.dailyShopping}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#8B4513"
                    strokeWidth={isSmallScreen ? 1.5 : 2}
                    name="Orders"
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#D2B48C"
                    strokeWidth={isSmallScreen ? 1.5 : 2}
                    name="Amount (₹)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monthly Revenue Bar Chart - Only for Admin */}
          {user?.type === "admin" && (
            <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 mb-4 lg:mb-8">
              <h2 className="text-base md:text-lg lg:text-xl font-bold text-[#8B4513] mb-3 lg:mb-4">
                Monthly Revenue
              </h2>
              <ResponsiveContainer width="100%" height={isSmallScreen ? 220 : 300}>
                <BarChart data={dashboardStats.ordersByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#C19A6B" name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-bold text-[#8B4513] mb-3 lg:mb-4">
              Recent Orders
            </h2>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No orders found. Start shopping to see your orders here!
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 3).map((order) => (
                  <div
                    key={order._id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {order.product?.images?.[0] && (
                          <img
                            src={order.product.images[0]}
                            alt={order.product?.name}
                            className="h-12 w-12 lg:h-16 lg:w-16 rounded-lg object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        )}
                        <div> 
                          <h3 className="font-semibold  sm:text-md text-sm text-[#8B4513]">
                            {order.product?.name || "Product"}
                          </h3>
                          <p className="sm:text-sm text-xs text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                          <p className="sm:text-sm text-xs text-gray-600">
                            Size: {order.size} kg
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === "approved"
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
                        <p className="sm:text-base text-sm lg:text-lg font-bold text-[#8B4513] mt-2">
                          ₹{order.totalPrice}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            )}
          </div>
        </div>
      </Container>
      <ToastContainer />
      <Footer />
    </div>
  );
};

export default DashboardPage;

