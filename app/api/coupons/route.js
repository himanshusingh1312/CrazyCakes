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

// Create coupon (admin only)
export async function POST(request) {
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
      console.error(`User ${admin.email} (type: ${admin.type}) tried to create coupon`);
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { code, message, discountPercent, userId, expiresAt } = body;

    // Validation
    if (!code || !message || !discountPercent || !userId) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (discountPercent < 1 || discountPercent > 100) {
      return NextResponse.json(
        { error: "Discount must be between 1% and 100%" },
        { status: 400 }
      );
    }

    // Check if user exists and is type "user" (not admin)
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Only allow creating coupons for regular users (type "user")
    if (user.type !== "user") {
      return NextResponse.json(
        { error: "Coupons can only be created for regular users" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 400 }
      );
    }

    // Create coupon
    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      message,
      discountPercent: Number(discountPercent),
      user: userId,
      createdBy: decoded.userId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    return NextResponse.json(
      { message: "Coupon created successfully", coupon },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create coupon error:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get user's coupons
export async function GET(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // If userId is provided and user is admin, get that user's coupons
    // Otherwise, get current user's coupons
    const targetUserId = userId && decoded.userId ? userId : decoded.userId;

    if (userId && userId !== decoded.userId) {
      // Check if current user is admin
      const admin = await User.findById(decoded.userId);
      if (!admin || admin.type !== "admin") {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
    }

    const coupons = await Coupon.find({ user: targetUserId })
      .populate("user", "name email")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({ coupons }, { status: 200 });
  } catch (error) {
    console.error("Get coupons error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

