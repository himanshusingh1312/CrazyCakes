import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { Order } from "@/lib/schema/order";


// Get all testimonials (reviews with ratings)
export async function GET(request) {
  try {
    await connectDB();

    // Get all orders that have reviews
    const orders = await Order.find({
      review: { $exists: true, $ne: "" },
      rating: { $exists: true, $ne: null },
    })
      .populate("product", "name images")
      .populate("user", "name")
      .sort({ createdAt: -1 });

    const testimonials = orders.map((order) => ({
      _id: order._id,
      userName: order.user?.name || "Anonymous",
      productName: order.product?.name || "Product",
      productImage: order.product?.images?.[0].url || "",
      rating: order.rating,
      review: order.review,
      sentiment: order.sentiment || null,
      createdAt: order.createdAt,
    }));

    return NextResponse.json({ testimonials }, { status: 200 });
  } catch (error) {
    console.error("Get testimonials error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

