import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Products",
      required: true,
    },
    city: { type: String, required: true, default: "Lucknow" },
    area: {
      type: String,
      required: true,
    },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    size: {
      type: Number,
      required: true,
      enum: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
    customizeImage: { type: String, default: "" }, // Path to uploaded customize image
    instruction: { type: String, default: "" },
    deliveryType: {
      type: String,
      required: true,
      enum: ["pickup", "delivery"],
    },
    deliveryDate: { type: String, required: true }, // Date selected by user
    deliveryTime: { type: String, required: true }, // Time selected by user
    originalPrice: { type: Number, required: true },
    sizeMultiplier: { type: Number, required: true }, // e.g., 2 for 2kg
    deliveryCharge: { type: Number, default: 0 }, // 50 if delivery, 0 if pickup
    discountAmount: { type: Number, default: 0 }, // Discount from coupon
    couponCode: { type: String, default: null }, // Coupon code used
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "preparing", "ready", "delivered", "cancelled"],
      default: "pending",
    },
    adminMessage: { type: String, default: "" }, // Message from admin to user
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    review: { type: String, default: "" }, // User review/feedback
    sentiment: {
      score: { type: Number, default: 0 }, // Sentiment score: -1 (negative) to 1 (positive)
      label: { type: String, default: "neutral" }, // "positive", "negative", "neutral"
    },
  },
  { timestamps: true }
);

// Delete old model if exists
if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

export const Order =
  mongoose.models.Order || mongoose.model("Order", OrderSchema);

