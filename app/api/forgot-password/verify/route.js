import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { User } from "@/lib/schema/user";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user exists (for both user and admin types)
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "Email not found in our system" },
        { status: 404 }
      );
    }

    // Return success without exposing sensitive data
    return NextResponse.json(
      { 
        message: "Email verified successfully",
        userType: user.type // Return user type for reference
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

