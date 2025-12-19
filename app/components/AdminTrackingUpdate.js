"use client";

import React from "react";

const AdminTrackingUpdate = ({ order, currentStatus, onStatusUpdate }) => {
  const trackingSteps = [
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

  // Determine which steps are completed
  let completedSteps = 0;
  if (currentStatus === "approved") completedSteps = 1;
  else if (currentStatus === "preparing") completedSteps = 2;
  else if (currentStatus === "ready") completedSteps = 3;
  else if (currentStatus === "delivered") completedSteps = 4;
  else if (currentStatus === "rejected" || currentStatus === "cancelled") completedSteps = 0;

  const handleStepClick = (step) => {
    // Allow updating to any step (admin can go forward or backward)
    onStatusUpdate(step.status);
  };

  return (
    <div className="sm:space-y-4 space-y-3">
      <div className="text-center bg-white">
        <h3 className="sm:text-lg text-md font-semibold text-[#5b3a29]">Update Order Tracking</h3>
        <p className="text-sm text-[#8a6a52]">Click on a step to update the order status</p>
      </div>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-8 top-0 h-full w-0.5 bg-gray-200">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{
              height: `${completedSteps > 0 ? ((completedSteps - 1) / (trackingSteps.length - 1)) * 100 : 0}%`,
            }}
          />
        </div>

        {/* Steps */}
        <div className="sm:space-y-6 space-y-4">
          {trackingSteps.map((step, index) => {
            const isCompleted = index < completedSteps;
            const isActive = index === completedSteps - 1;
            const isPending = index >= completedSteps;

            return (
              <div key={step.id} className="relative flex items-start gap-4">
                {/* Step Icon - Clickable */}
                <button
                  onClick={() => handleStepClick(step)}
                  className={`relative z-10 flex lg:h-16 lg:w-16 sm:h-12 sm:w-12 h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    isCompleted
                      ? "border-green-500 bg-green-500 text-white cursor-pointer hover:bg-green-600 hover:scale-110"
                      : isActive
                      ? "border-[#5b3a29] bg-[#5b3a29] text-white cursor-pointer hover:bg-[#4c3022] hover:scale-110"
                      : "border-gray-300 bg-gray-100 text-gray-400 cursor-pointer hover:border-[#5b3a29] hover:bg-[#f9f4ee] hover:text-[#5b3a29]"
                  }`}
                  title={`Click to update to: ${step.name}`}
                >
                  {isCompleted ? (
                    <svg className="sm:h-8 sm:w-8 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="sm:text-xl text-lg">{step.icon}</span>
                  )}
                </button>

                {/* Step Content */}
                <div className="flex-1 pt-2">
                  <h4
                    className={`font-semibold ${
                      isCompleted || isActive
                        ? "text-[#5b3a29]"
                        : "text-gray-600"
                    }`}
                  >
                    {step.name}
                  </h4>
                  <p
                    className={`text-sm ${
                      isCompleted || isActive
                        ? "text-[#8a6a52]"
                        : "text-gray-500"
                    }`}
                  >
                    {step.description}
                  </p>
                  {isActive && (
                    <span className="mt-1 inline-block rounded-full bg-[#5b3a29] px-2 py-0.5 text-xs text-white">
                      Current Status
                    </span>
                  )}
                  {isCompleted && (
                    <span className="mt-1 inline-block rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
                      Completed
                    </span>
                  )}
                  {!isCompleted && !isActive && (
                    <span className="mt-1 inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                      Click to update
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Status Update Buttons */}
      <div className="mt-6 rounded-lg border border-[#e5d4c4] bg-[#f9f4ee] p-4">
        <h4 className="mb-3 font-semibold text-[#5b3a29]">Quick Update:</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onStatusUpdate("approved")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              currentStatus === "approved"
                ? "bg-green-500 text-white"
                : "bg-white text-[#5b3a29] border border-[#e5d4c4] hover:bg-green-50"
            }`}
          >
            ✓ Accept Order
          </button>
          <button
            onClick={() => onStatusUpdate("preparing")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              currentStatus === "preparing"
                ? "bg-green-500 text-white"
                : "bg-white text-[#5b3a29] border border-[#e5d4c4] hover:bg-green-50"
            }`}
          >
            🍰 Preparing
          </button>
          <button
            onClick={() => onStatusUpdate("ready")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              currentStatus === "ready"
                ? "bg-green-500 text-white"
                : "bg-white text-[#5b3a29] border border-[#e5d4c4] hover:bg-green-50"
            }`}
          >
            🚚 Out for Delivery
          </button>
          <button
            onClick={() => onStatusUpdate("delivered")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              currentStatus === "delivered"
                ? "bg-green-500 text-white"
                : "bg-white text-[#5b3a29] border border-[#e5d4c4] hover:bg-green-50"
            }`}
          >
            📦 Delivered
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminTrackingUpdate;

