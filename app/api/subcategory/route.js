import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { Subcategory } from "@/lib/schema/subcategory";
import cloudinary from "@/lib/cloudinary";

// Create subcategory (with Cloudinary image upload)
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

    // normalize category
    category = String(category).toLowerCase();
    if (category === "pastery") category = "pastry";

    if (!["cake", "pastry"].includes(category)) {
      return NextResponse.json(
        { error: "category must be 'cake' or 'pastry'" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "subcategories", resource_type: "auto" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const imagePath = result.secure_url;

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const subcategories = await Subcategory.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({ subcategories }, { status: 200 });
  } catch (error) {
    console.error("Get subcategories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    const updateData = {};
    if (name) updateData.name = name;

    if (category) {
      category = String(category).toLowerCase();
      if (category === "pastery") category = "pastry";
      if (["cake", "pastry"].includes(category)) updateData.category = category;
    }

    // Handle image update
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload new image
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "subcategories", resource_type: "auto" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      updateData.image = result.secure_url;

      // Optional: delete old image from Cloudinary
      if (subcategory.image) {
        try {
          const publicId = subcategory.image
            .split("/")
            .pop()
            .split(".")[0];
          await cloudinary.uploader.destroy(`subcategories/${publicId}`);
        } catch (err) {
          console.error("Error deleting old Cloudinary image:", err);
        }
      }
    }

    const updatedSubcategory = await Subcategory.findByIdAndUpdate(id, updateData, { new: true });

    return NextResponse.json(
      { message: "Subcategory updated", subcategory: updatedSubcategory },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update subcategory error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    // Delete image from Cloudinary
    if (subcategory.image) {
      try {
        const publicId = subcategory.image
          .split("/")
          .pop()
          .split(".")[0];
        await cloudinary.uploader.destroy(`subcategories/${publicId}`);
      } catch (err) {
        console.error("Error deleting Cloudinary image:", err);
      }
    }

    await Subcategory.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Subcategory deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete subcategory error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
