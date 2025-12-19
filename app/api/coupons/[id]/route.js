import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { User } from "@/lib/schema/user";
import { Coupon } from "@/lib/schema/coupon";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Verify token helper
function verifyToken(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

// Delete coupon (admin only)
export async function DELETE(request, { params }) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || !decoded.userId) {
      console.error("Token verification failed or no userId in token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Check if user is admin
    const admin = await User.findById(decoded.userId);
    if (!admin) {
      console.error(`Admin not found with id: ${decoded.userId}`);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    if (admin.type !== "admin") {
      console.error(`User ${admin.email} (type: ${admin.type}) tried to delete coupon`);
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get coupon ID from params - handle both async and sync params (Next.js 15+)
    let couponId;
    if (params && typeof params.then === 'function') {
      // Params is a Promise (Next.js 15+)
      const resolvedParams = await params;
      couponId = resolvedParams.id;
    } else {
      // Params is an object (Next.js 13/14)
      couponId = params?.id;
    }
    
    if (!couponId) {
      console.error("Coupon ID not provided in params", params);
      return NextResponse.json(
        { error: "Coupon ID is required" },
        { status: 400 }
      );
    }

    console.log(`Attempting to delete coupon with ID: ${couponId}`);

    // Check if coupon exists
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      console.error(`Coupon not found with ID: ${couponId}`);
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Delete coupon
    await Coupon.findByIdAndDelete(couponId);
    console.log(`Coupon ${couponId} deleted successfully`);

    return NextResponse.json(
      { message: "Coupon deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete coupon error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

