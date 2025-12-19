import mongoose from "mongoose";

const SubcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true }, // URL or path to image
    category: {
      type: String,
      required: true,
      enum: ["cake", "pastry"], // only two options
    },
  },
  { timestamps: true }
);

export const Subcategory =
  mongoose.models.Subcategory ||
  mongoose.model("Subcategory", SubcategorySchema);


