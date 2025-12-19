import mongoose from "mongoose";

const ProductsSchema = new mongoose.Schema(
  {
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    // exactly 4 images stored as paths
    images: {
      type: [String],
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

// Delete old model if exists to ensure fresh schema
if (mongoose.models.Products) {
  delete mongoose.models.Products;
}

export const Products =
  mongoose.models.Products || mongoose.model("Products", ProductsSchema);

