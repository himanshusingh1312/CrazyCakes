import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { User } from "@/lib/schema/user";
import { Order } from "@/lib/schema/order";
import { Coupon } from "@/lib/schema/coupon";

export async function DELETE(request) {
  try {
    await connectDB();

    // ✅ Get ID from URL (MOST RELIABLE)
    const url = new URL(request.url);
    const userId = url.pathname.split("/").pop();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID missing in request" },
        { status: 400 }
      );
    }

    // Prevent deleting admin users
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.type === "admin") {
      return NextResponse.json(
        { error: "Cannot delete admin users" },
        { status: 400 }
      );
    }

    await Order.deleteMany({ user: userId });
    await Coupon.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
