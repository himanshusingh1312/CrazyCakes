"use client";

import React from "react";

const OrderTracking = ({ order }) => {
  // Map order status to tracking steps
  const getTrackingSteps = () => {
    const steps = [
      {
        id: 1,
        name: "Accept Order",
        status: "approved",
        icon: "✓",
        description: "Order has been accepted",
      },
      {
        id: 2,
        name: "Preparing",
        status: "preparing",
        icon: "🍰",
        description: "Your product is being prepared",
      },
      {
        id: 3,
        name: "Out for Delivery",
        status: "ready",
        icon: "🚚",
        description: "Product is on the way",
      },
      {
        id: 4,
        name: "Delivered",
        status: "delivered",
        icon: "📦",
        description: "Order has been delivered",
      },
    ];

    // Determine which steps are completed based on order status
    const currentStatus = order?.status || "pending";
    
    let completedSteps = 0;
    // Map statuses to tracking steps
    if (currentStatus === "approved") completedSteps = 1; // Step 1: Accept Order
    else if (currentStatus === "preparing") completedSteps = 2; // Step 2: Preparing
    else if (currentStatus === "ready") completedSteps = 3; // Step 3: Out for Delivery
    else if (currentStatus === "delivered") completedSteps = 4; // Step 4: Delivered
    else if (currentStatus === "rejected" || currentStatus === "cancelled") completedSteps = 0;
    // pending status = 0 (no steps completed)

    return steps.map((step, index) => ({
      ...step,
      isCompleted: index < completedSteps,
      isActive: index === completedSteps - 1,
      isPending: index >= completedSteps,
    }));
  };

  const trackingSteps = getTrackingSteps();
  const currentStatus = order?.status || "pending";
  const isPickup = order?.deliveryType === "pickup";

  // If order is rejected or cancelled, show special message
  if (currentStatus === "rejected" || currentStatus === "cancelled") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 text-red-800">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p className="font-semibold">
            Order {currentStatus === "rejected" ? "Rejected" : "Cancelled"}
          </p>
        </div>
        {order?.adminMessage && (
          <p className="mt-2 text-sm text-red-700">{order.adminMessage}</p>
        )}
      </div>
    );
  }

  // If pickup order, show simplified status without tracking
  if (isPickup) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[#5b3a29]">Order Status</h3>
          <p className="text-sm text-[#8a6a52]">Order ID: {order?._id?.toString().slice(-8) || "N/A"}</p>
        </div>

        <div className="rounded-lg border border-[#e5d4c4] bg-[#f9f4ee] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-[#5b3a29]">Current Status</h4>
              <p className="text-sm text-[#8a6a52] mt-1">
                {currentStatus === "pending" && "⏳ Pending"}
                {currentStatus === "approved" && "✓ Approved"}
                {currentStatus === "preparing" && "🍰 Preparing"}
                {currentStatus === "ready" && "✅ Ready for Pickup"}
                {currentStatus === "delivered" && "📦 Picked Up"}
                {currentStatus === "rejected" && "❌ Rejected"}
                {currentStatus === "cancelled" && "🚫 Cancelled"}
              </p>
            </div>
            <div className={`rounded-full px-4 py-2 text-sm font-semibold ${
              currentStatus === "pending" ? "bg-yellow-100 text-yellow-800" :
              currentStatus === "approved" ? "bg-green-100 text-green-800" :
              currentStatus === "preparing" ? "bg-purple-100 text-purple-800" :
              currentStatus === "ready" ? "bg-blue-100 text-blue-800" :
              currentStatus === "delivered" ? "bg-green-200 text-green-900" :
              currentStatus === "rejected" ? "bg-red-100 text-red-800" :
              currentStatus === "cancelled" ? "bg-gray-100 text-gray-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-2">
            <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-yellow-800">Pickup Order</p>
              <p className="text-xs text-yellow-700 mt-1">
                Tracking is not available for pickup orders. Please check the order status above.
              </p>
            </div>
          </div>
        </div>

        {order?.deliveryDate && order?.deliveryTime && (
          <div className="mt-4 rounded-lg border border-[#e5d4c4] bg-[#f9f4ee] p-4">
            <h4 className="mb-2 font-semibold text-[#5b3a29]">Pickup Information</h4>
            <p className="text-sm text-[#8a6a52]">
              Date: {new Date(order.deliveryDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-sm text-[#8a6a52]">Time: {order.deliveryTime}</p>
            <p className="text-sm text-[#8a6a52]">Type: Pick up from store</p>
          </div>
        )}

        {order?.adminMessage && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h4 className="mb-1 font-semibold text-yellow-800">Admin Message</h4>
            <p className="text-sm text-yellow-700">{order.adminMessage}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="sm:text-lg text-md font-semibold text-[#5b3a29]">Order Tracking</h3>
        <p className="text-sm text-[#8a6a52]">Order ID: {order?._id?.toString().slice(-8) || "N/A"}</p>
      </div>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-8 top-0 h-full w-0.5 bg-gray-200">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{
              height: `${((trackingSteps.filter(s => s.isCompleted).length - 1) / (trackingSteps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        <div className="sm:space-y-6 space-y-4">
          {trackingSteps.map((step, index) => (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Step Icon */}
              <div
                className={`relative z-10 flex sm:h-16 sm:w-16 h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  step.isCompleted
                    ? "border-green-500 bg-green-500 text-white"
                    : step.isActive
                    ? "border-[#5b3a29] bg-[#5b3a29] text-white animate-pulse"
                    : "border-gray-300 bg-gray-100 text-gray-400"
                }`}
              >
                {step.isCompleted ? (
                  <svg className="sm:h-8 sm:w-8 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="sm:text-xl text-lg">{step.icon}</span>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 pt-2">
                <h4
                  className={`font-semibold ${
                    step.isCompleted || step.isActive
                      ? "text-[#5b3a29]"
                      : "text-gray-400"
                  }`}
                >
                  {step.name}
                </h4>
                <p
                  className={`text-sm ${
                    step.isCompleted || step.isActive
                      ? "text-[#8a6a52]"
                      : "text-gray-400"
                  }`}
                >
                  {step.description}
                </p>
                {step.isActive && (
                  <span className="mt-1 inline-block rounded-full bg-[#5b3a29] px-2 py-0.5 text-xs text-white">
                    In Progress
                  </span>
                )}
                {step.isCompleted && (
                  <span className="mt-1 inline-block rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
                    Completed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      {order?.deliveryDate && order?.deliveryTime && (
        <div className="mt-6 rounded-lg border border-[#e5d4c4] bg-[#f9f4ee] p-4">
          <h4 className="mb-2 font-semibold text-[#5b3a29]">Expected Delivery</h4>
          <p className="text-sm text-[#8a6a52]">
            Date: {new Date(order.deliveryDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="text-sm text-[#8a6a52]">Time: {order.deliveryTime}</p>
          <p className="text-sm text-[#8a6a52]">
            Type: {order.deliveryType === "delivery" ? "Home Delivery" : "Pick up from store"}
          </p>
        </div>
      )}

      {order?.adminMessage && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h4 className="mb-1 font-semibold text-yellow-800">Admin Message</h4>
          <p className="text-sm text-yellow-700">{order.adminMessage}</p>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;

