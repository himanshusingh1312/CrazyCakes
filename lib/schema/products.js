import mongoose from "mongoose";

const ProductsSchema = new mongoose.Schema(
  {
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    images: {
      type: [
        {
          url: { type: String, required: true },
          public_id: { type: String, required: true }, // used for Cloudinary deletion
        },
      ],
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length === 4;
        },
        message: "Exactly 4 images are required",
      },
      required: true,
    },
    price: { type: Number, required: true },
    specification: { type: String, required: true },
    tag: { type: String, default: "" }, // optional
  },
  { timestamps: true }
);

// Remove old model if exists
if (mongoose.models.Products) {
  delete mongoose.models.Products;
}

export const Products =
  mongoose.models.Products || mongoose.model("Products", ProductsSchema);
