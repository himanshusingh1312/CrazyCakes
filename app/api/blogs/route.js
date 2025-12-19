import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { Blog } from "@/lib/schema/blog";
import { User } from "@/lib/schema/user";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
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

// Get all blogs (public)
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Get single blog
      const blog = await Blog.findById(id).populate("authorId", "name email photo");
      if (!blog) {
        return NextResponse.json(
          { error: "Blog not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ blog });
    }

    // Get all blogs, sorted by newest first
    const blogs = await Blog.find()
      .populate("authorId", "name email photo")
      .sort({ createdAt: -1 });

    return NextResponse.json({ blogs });
  } catch (error) {
    console.error("Get blogs error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// Create blog (admin only)
export async function POST(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user || user.type !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const title = formData.get("title");
    const description = formData.get("description");
    const category = formData.get("category") || "Cake";
    const imageFile = formData.get("image");

    if (!title || !description || !imageFile) {
      return NextResponse.json(
        { error: "Title, description, and image are required" },
        { status: 400 }
      );
    }

    // Handle image upload
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "blogs");
    await fs.mkdir(uploadsDir, { recursive: true });

    let imagePath = "";

    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(imageFile.name || "") || ".jpg";
      const fileName = `${crypto.randomUUID()}${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      await fs.writeFile(filePath, buffer);
      imagePath = `/uploads/blogs/${fileName}`;
    }

    const blogData = {
      title,
      description,
      image: imagePath,
      category,
      author: user.name,
      authorId: user._id,
    };

    const blog = await Blog.create(blogData);

    return NextResponse.json(
      { message: "Blog created successfully", blog },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create blog error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// Update blog (admin only)
export async function PUT(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user || user.type !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const id = formData.get("id");
    const title = formData.get("title");
    const description = formData.get("description");
    const category = formData.get("category");
    const imageFile = formData.get("image");

    if (!id) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 }
      );
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    const updateData = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;

    // Handle image update if provided
    if (imageFile && imageFile.size > 0) {
      // Delete old image
      if (blog.image) {
        try {
          const oldImagePath = path.join(process.cwd(), "public", blog.image);
          await fs.unlink(oldImagePath);
        } catch (err) {
          console.error("Error deleting old image:", err);
        }
      }

      // Save new image
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "blogs");
      await fs.mkdir(uploadsDir, { recursive: true });

      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(imageFile.name || "") || ".jpg";
      const fileName = `${crypto.randomUUID()}${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      await fs.writeFile(filePath, buffer);
      updateData.image = `/uploads/blogs/${fileName}`;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("authorId", "name email photo");

    return NextResponse.json(
      { message: "Blog updated successfully", blog: updatedBlog },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update blog error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// Delete blog (admin only)
export async function DELETE(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user || user.type !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 }
      );
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    // Delete image file
    if (blog.image) {
      try {
        const imagePath = path.join(process.cwd(), "public", blog.image);
        await fs.unlink(imagePath);
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }

    await Blog.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Blog deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete blog error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

