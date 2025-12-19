import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { User } from "@/lib/schema/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, address, pincode, phone, type } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      type: type || "user",
      address: address || "",
      pincode: pincode ? Number(pincode) : 0,
      phone: phone ? Number(phone) : 0,
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, type: user.type },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json(
      {
        message: "User created successfully",
        token,
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          type: user.type,
          photo: user.photo || "",
          address: user.address || "",
          pincode: user.pincode || 0,
          phone: user.phone || 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

