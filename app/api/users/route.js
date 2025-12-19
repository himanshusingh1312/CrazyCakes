import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { User } from "@/lib/schema/user";
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

// Get all users (admin only)
export async function GET(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || !decoded.userId) {
      console.error("Token verification failed or no userId in token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.error(`User not found with id: ${decoded.userId}`);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    if (user.type !== "admin") {
      console.error(`User ${user.email} (type: ${user.type}) tried to access admin users page`);
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get all users with type "user" (excluding password and admins)
    // This shows all users who signed up with type "user"
    const users = await User.find({ type: "user" })
      .select("-password")
      .sort({ createdAt: -1 });
    
    console.log(`Admin ${user.email} requested users. Found ${users.length} users with type "user"`);

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

