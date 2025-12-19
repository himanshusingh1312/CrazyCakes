import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { Subcategory } from "@/lib/schema/subcategory";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// Create subcategory (with image upload)
export async function POST(request) {
  try {
    const formData = await request.formData();

    const name = formData.get("name");
    let category = formData.get("category");
    const file = formData.get("image");

    if (!name || !category || !file) {
      return NextResponse.json(
        { error: "name, image and category are required" },
        { status: 400 }
      );
    }

    // normalise category, accept 'pastery' but store 'pastry'
    category = String(category).toLowerCase();
    if (category === "pastery") category = "pastry";

    if (!["cake", "pastry"].includes(category)) {
      return NextResponse.json(
        { error: "category must be 'cake' or 'pastry'" },
        { status: 400 }
      );
    }

    // Save image to public/uploads/subcategories
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "subcategories"
    );
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name || "") || ".jpg";
    const fileName = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    await fs.writeFile(filePath, buffer);

    const imagePath = `/uploads/subcategories/${fileName}`;

    await connectDB();

    const subcategory = await Subcategory.create({
      name,
      image: imagePath,
      category,
    });

    return NextResponse.json(
      { message: "Subcategory created", subcategory },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create subcategory error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get all subcategories (optional filter by category)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    let category = searchParams.get("category");

    const filter = {};
    if (category) {
      category = String(category).toLowerCase();
      if (category === "pastery") category = "pastry";
      filter.category = category;
    }

    const subcategories = await Subcategory.find(filter).sort({
      createdAt: -1,
    });

    return NextResponse.json({ subcategories }, { status: 200 });
  } catch (error) {
    console.error("Get subcategories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update subcategory
export async function PUT(request) {
  try {
    const formData = await request.formData();
    const id = formData.get("id");
    const name = formData.get("name");
    let category = formData.get("category");
    const file = formData.get("image");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await connectDB();
    const subcategory = await Subcategory.findById(id);

    if (!subcategory) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 }
      );
    }

    const updateData = {};

    if (name) updateData.name = name;

    if (category) {
      category = String(category).toLowerCase();
      if (category === "pastery") category = "pastry";
      if (["cake", "pastry"].includes(category)) {
        updateData.category = category;
      }
    }

    // Handle image update if provided
    if (file && file.size > 0) {
      // Delete old image
      if (subcategory.image) {
        try {
          const oldImagePath = path.join(process.cwd(), "public", subcategory.image);
          await fs.unlink(oldImagePath);
        } catch (err) {
          console.error("Error deleting old image:", err);
        }
      }

      // Save new image
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "subcategories"
      );
      await fs.mkdir(uploadsDir, { recursive: true });

      const ext = path.extname(file.name || "") || ".jpg";
      const fileName = `${crypto.randomUUID()}${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      await fs.writeFile(filePath, buffer);
      updateData.image = `/uploads/subcategories/${fileName}`;
    }

    const updatedSubcategory = await Subcategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    return NextResponse.json(
      { message: "Subcategory updated", subcategory: updatedSubcategory },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update subcategory error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete subcategory
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await connectDB();
    const subcategory = await Subcategory.findById(id);

    if (!subcategory) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 }
      );
    }

    // Delete image file
    if (subcategory.image) {
      try {
        const imagePath = path.join(process.cwd(), "public", subcategory.image);
        await fs.unlink(imagePath);
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }

    await Subcategory.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Subcategory deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete subcategory error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


