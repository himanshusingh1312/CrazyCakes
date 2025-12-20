import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { Products } from "@/lib/schema/products";
import cloudinary from "@/lib/cloudinary";

// Helper function to upload multiple images to Cloudinary
const uploadImagesToCloudinary = async (files, folder = "products") => {
  const uploadedImages = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "auto" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    uploadedImages.push({
      url: result.secure_url,
      public_id: result.public_id, // for deletion later
    });
  }
  return uploadedImages;
};

// CREATE PRODUCT
export async function POST(request) {
  try {
    const formData = await request.formData();
    const subcategory = formData.get("subcategory");
    const name = formData.get("name");
    const price = formData.get("price");
    const specification = formData.get("specification");
    const tag = formData.get("tag") || "";
    const files = formData.getAll("images");

    if (!subcategory || !name || !price || !specification || files.length !== 4) {
      return NextResponse.json(
        { error: "subcategory, name, price, specification and exactly 4 images are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const uploadedImages = await uploadImagesToCloudinary(files);

    if (uploadedImages.length !== 4) {
      return NextResponse.json(
        { error: `Expected 4 images but only uploaded ${uploadedImages.length}` },
        { status: 400 }
      );
    }

    const product = await Products.create({
      subcategory,
      name,
      price: Number(price),
      specification,
      tag,
      images: uploadedImages,
    });

    return NextResponse.json({ message: "Product created", product }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}

// GET PRODUCTS
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const subcategory = searchParams.get("subcategory");
    const id = searchParams.get("id");

    const filter = {};
    if (id) filter._id = id;
    else if (subcategory) filter.subcategory = subcategory;

    const products = await Products.find(filter).populate("subcategory").sort({ createdAt: -1 });

    // Calculate average ratings for each product
    const { Order } = await import("@/lib/schema/order");
    const productsWithRatings = await Promise.all(
      products.map(async (product) => {
        const orders = await Order.find({ product: product._id, rating: { $exists: true, $ne: null } });
        const totalRatings = orders.length;
        const averageRating = totalRatings
          ? Number((orders.reduce((acc, o) => acc + o.rating, 0) / totalRatings).toFixed(1))
          : 0;
        return { ...product.toObject(), averageRating, totalRatings };
      })
    );

    return NextResponse.json({ products: productsWithRatings }, { status: 200 });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// UPDATE PRODUCT
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

    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    await connectDB();
    const product = await Products.findById(id);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const updateData = {};
    if (subcategory) updateData.subcategory = subcategory;
    if (name) updateData.name = name;
    if (price != null) updateData.price = Number(price);
    if (specification) updateData.specification = specification;
    if (tag !== null) updateData.tag = tag;

    if (files && files.length > 0) {
      if (files.length !== 4) return NextResponse.json({ error: "Exactly 4 images are required" }, { status: 400 });

      // Delete old images from Cloudinary
      if (product.images && product.images.length > 0) {
        for (const img of product.images) {
          try {
            await cloudinary.uploader.destroy(img.public_id);
          } catch (err) {
            console.error("Error deleting old image:", err);
          }
        }
      }

      const uploadedImages = await uploadImagesToCloudinary(files);
      if (uploadedImages.length !== 4)
        return NextResponse.json({ error: `Expected 4 images but only uploaded ${uploadedImages.length}` }, { status: 400 });

      updateData.images = uploadedImages;
    }

    const updatedProduct = await Products.findByIdAndUpdate(id, updateData, { new: true }).populate("subcategory");
    return NextResponse.json({ message: "Product updated", product: updatedProduct }, { status: 200 });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}

// DELETE PRODUCT
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    await connectDB();
    const product = await Products.findById(id);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        try {
          await cloudinary.uploader.destroy(img.public_id);
        } catch (err) {
          console.error("Error deleting image:", err);
        }
      }
    }

    await Products.findByIdAndDelete(id);
    return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
