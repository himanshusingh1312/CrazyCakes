import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { Products } from "@/lib/schema/products";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// Create product (with 4 image uploads)
export async function POST(request) {
  try {
    const formData = await request.formData();

    const subcategory = formData.get("subcategory");
    const name = formData.get("name");
    const price = formData.get("price");
    const specification = formData.get("specification");
    const tag = formData.get("tag") || "";
    const files = formData.getAll("images");

    console.log("Received files count:", files.length);
    console.log("Files:", files.map(f => ({ name: f.name, size: f.size, type: f.type })));

    if (
      !subcategory ||
      !name ||
      price == null ||
      !specification ||
      !files ||
      files.length !== 4
    ) {
      return NextResponse.json(
        {
          error:
            "subcategory, name, price, specification and exactly 4 images are required",
        },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "products");
    await fs.mkdir(uploadsDir, { recursive: true });

    const imagePaths = [];

    for (const file of files) {
      if (!file || file.size === 0) {
        console.error("Invalid file:", file);
        continue;
      }
      
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const ext = path.extname(file.name || "") || ".jpg";
        const fileName = `${crypto.randomUUID()}${ext}`;
        const filePath = path.join(uploadsDir, fileName);

        await fs.writeFile(filePath, buffer);
        imagePaths.push(`/uploads/products/${fileName}`);
        console.log("Saved image:", fileName);
      } catch (fileError) {
        console.error("Error saving file:", fileError);
        throw fileError;
      }
    }

    console.log("Total image paths:", imagePaths.length);

    if (imagePaths.length !== 4) {
      return NextResponse.json(
        { error: `Expected 4 images but only processed ${imagePaths.length}` },
        { status: 400 }
      );
    }

    await connectDB();

    const productData = {
      subcategory,
      name,
      price: Number(price),
      specification,
      tag: tag || "",
      images: imagePaths,
    };

    console.log("Creating product with data:", { ...productData, images: imagePaths });

    const product = await Products.create(productData);

    console.log("Product created successfully:", product._id);

    return NextResponse.json(
      { message: "Product created", product },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// Get products
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const subcategory = searchParams.get("subcategory");
    const id = searchParams.get("id");

    const filter = {};
    if (id) {
      filter._id = id;
    } else if (subcategory) {
      filter.subcategory = subcategory;
    }

    const products = await Products.find(filter)
      .populate("subcategory")
      .sort({ createdAt: -1 });

    // Calculate average ratings for each product
    const { Order } = await import("@/lib/schema/order");
    const productsWithRatings = await Promise.all(
      products.map(async (product) => {
        const orders = await Order.find({
          product: product._id,
          rating: { $exists: true, $ne: null },
        });

        let averageRating = 0;
        let totalRatings = 0;

        if (orders.length > 0) {
          const sum = orders.reduce((acc, order) => acc + (order.rating || 0), 0);
          averageRating = sum / orders.length;
          totalRatings = orders.length;
        }

        return {
          ...product.toObject(),
          averageRating: averageRating > 0 ? Number(averageRating.toFixed(1)) : 0,
          totalRatings,
        };
      })
    );

    return NextResponse.json({ products: productsWithRatings }, { status: 200 });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update product
export async function PUT(request) {
  try {
    const formData = await request.formData();

    const id = formData.get("id");
    const subcategory = formData.get("subcategory");
    const name = formData.get("name");
    const price = formData.get("price");
    const specification = formData.get("specification");
    const tag = formData.get("tag") || "";
    const files = formData.getAll("images");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await connectDB();
    const product = await Products.findById(id);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const updateData = {};

    if (subcategory) updateData.subcategory = subcategory;
    if (name) updateData.name = name;
    if (price != null) updateData.price = Number(price);
    if (specification) updateData.specification = specification;
    if (tag !== null) updateData.tag = tag;

    // Handle image updates if provided
    if (files && files.length > 0 && files[0].size > 0) {
      if (files.length !== 4) {
        return NextResponse.json(
          { error: "Exactly 4 images are required" },
          { status: 400 }
        );
      }

      // Delete old images
      if (product.images && product.images.length > 0) {
        for (const oldImage of product.images) {
          try {
            const oldImagePath = path.join(process.cwd(), "public", oldImage);
            await fs.unlink(oldImagePath);
          } catch (err) {
            console.error("Error deleting old image:", err);
          }
        }
      }

      // Save new images
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "products");
      await fs.mkdir(uploadsDir, { recursive: true });

      const imagePaths = [];

      for (const file of files) {
        if (!file || file.size === 0) continue;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const ext = path.extname(file.name || "") || ".jpg";
        const fileName = `${crypto.randomUUID()}${ext}`;
        const filePath = path.join(uploadsDir, fileName);

        await fs.writeFile(filePath, buffer);
        imagePaths.push(`/uploads/products/${fileName}`);
      }

      if (imagePaths.length !== 4) {
        return NextResponse.json(
          { error: `Expected 4 images but only processed ${imagePaths.length}` },
          { status: 400 }
        );
      }

      updateData.images = imagePaths;
    }

    const updatedProduct = await Products.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("subcategory");

    return NextResponse.json(
      { message: "Product updated", product: updatedProduct },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// Delete product
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await connectDB();
    const product = await Products.findById(id);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Delete image files
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        try {
          const imagePath = path.join(process.cwd(), "public", image);
          await fs.unlink(imagePath);
        } catch (err) {
          console.error("Error deleting image:", err);
        }
      }
    }

    await Products.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


