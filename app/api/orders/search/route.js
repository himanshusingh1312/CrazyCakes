import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { Order } from "@/lib/schema/order";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Helper to verify token and get user
const verifyToken = (request) => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
};

// Search orders by product name (case-insensitive, ignoring spaces)
export async function POST(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchQuery } = await request.json();

    if (!searchQuery || typeof searchQuery !== "string") {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Normalize search query: remove spaces, convert to lowercase
    const normalizedQuery = searchQuery.replace(/\s+/g, "").toLowerCase();
    const searchQueryTrimmed = searchQuery.trim();

    // Get user's orders
    const orders = await Order.find({ user: decoded.userId })
      .populate("product")
      .sort({ createdAt: -1 });

    // Filter orders by product name OR order ID
    const filteredOrders = orders.filter((order) => {
      // Check if search query matches order ID (last 8 characters or full ID)
      const orderIdString = order._id.toString();
      const orderIdLast8 = orderIdString.slice(-8).toLowerCase();
      const fullOrderId = orderIdString.toLowerCase();
      
      if (searchQueryTrimmed.toLowerCase() === orderIdLast8 || 
          fullOrderId.includes(searchQueryTrimmed.toLowerCase())) {
        return true;
      }

      // Check if search query matches product name (case-insensitive, ignoring spaces)
      if (order.product && order.product.name) {
        const productName = order.product.name.replace(/\s+/g, "").toLowerCase();
        if (productName.includes(normalizedQuery)) {
          return true;
        }
      }

      return false;
    });

    return NextResponse.json({ orders: filteredOrders }, { status: 200 });
  } catch (error) {
    console.error("Search orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

