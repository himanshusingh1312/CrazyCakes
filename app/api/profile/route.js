import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { User } from "@/lib/schema/user";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cloudinary from "@/lib/cloudinary";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Verify JWT
const verifyToken = (request) => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  try {
    return jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
  } catch {
    return null;
  }
};

/* ======================
   GET PROFILE
====================== */
export async function GET(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        user: {
          ...user.toObject(),
          photo: user.photo || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ======================
   UPDATE PROFILE
====================== */
export async function PUT(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();

    const name = formData.get("name");
    const email = formData.get("email");
    const address = formData.get("address");
    const pincode = formData.get("pincode");
    const phone = formData.get("phone");
    const password = formData.get("password");
    const photoFile = formData.get("photo");

    const updateData = {};

    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (pincode) updateData.pincode = Number(pincode);
    if (phone) updateData.phone = Number(phone);

    if (email) {
      const exists = await User.findOne({
        email,
        _id: { $ne: decoded.userId },
      });
      if (exists) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
      updateData.email = email;
    }

    if (password?.trim()) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    /* ======================
       PHOTO → CLOUDINARY
    ====================== */
    if (photoFile && photoFile.size > 0) {
      // delete old photo
      if (user.photo?.public_id) {
        await cloudinary.uploader.destroy(user.photo.public_id);
      }

      const buffer = Buffer.from(await photoFile.arrayBuffer());

      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "profiles",
              resource_type: "image",
            },
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          )
          .end(buffer);
      });

      updateData.photo = {
        url: upload.secure_url,
        public_id: upload.public_id,
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { new: true }
    ).select("-password");

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: updatedUser,
      },
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
