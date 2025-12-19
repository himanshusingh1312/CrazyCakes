import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { User } from "@/lib/schema/user";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

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

// Get current user profile
export async function GET(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure photo field is included (even if empty)
    const userData = {
      ...user.toObject(),
      photo: user.photo || "",
    };

    return NextResponse.json({ user: userData }, { status: 200 });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Allow both "user" and "admin" types to update their profile
    if (user.type !== "user" && user.type !== "admin") {
      return NextResponse.json(
        { error: "Invalid user type" },
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let name, email, address, pincode, phone, password;
    let photoFile = null;

    // Check if request is FormData (for photo upload) or JSON
    // FormData requests have content-type starting with "multipart/form-data"
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      name = formData.get("name");
      email = formData.get("email");
      address = formData.get("address");
      pincode = formData.get("pincode");
      phone = formData.get("phone");
      password = formData.get("password");
      photoFile = formData.get("photo");
    } else {
      // JSON request
      const body = await request.json();
      name = body.name;
      email = body.email;
      address = body.address;
      pincode = body.pincode;
      phone = body.phone;
      password = body.password;
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: decoded.userId } });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
      updateData.email = email;
    }
    if (address !== undefined) updateData.address = address;
    if (pincode !== undefined) updateData.pincode = Number(pincode) || 0;
    if (phone !== undefined) updateData.phone = Number(phone) || 0;

    // Handle password update if provided
    if (password && password.trim()) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Handle photo upload if provided
    if (photoFile && photoFile.size > 0) {
      // Delete old photo if exists
      if (user.photo && user.photo.trim() !== "") {
        try {
          const oldPhotoPath = path.join(process.cwd(), "public", user.photo);
          const stats = await fs.stat(oldPhotoPath).catch(() => null);
          if (stats) {
            await fs.unlink(oldPhotoPath);
          }
        } catch (err) {
          console.error("Error deleting old photo:", err);
        }
      }

      // Save new photo
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "profiles");
      await fs.mkdir(uploadsDir, { recursive: true });

      const bytes = await photoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(photoFile.name || "") || ".jpg";
      const fileName = `${crypto.randomUUID()}${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      await fs.writeFile(filePath, buffer);
      updateData.photo = `/uploads/profiles/${fileName}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { new: true }
    ).select("-password");

    // Ensure photo field is included in response
    const userData = {
      ...updatedUser.toObject(),
      photo: updatedUser.photo || "",
    };

    return NextResponse.json(
      { message: "Profile updated successfully", user: userData },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

