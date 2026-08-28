import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Perfumes",
        "Deodorants",
        "BodyLotions",
        "BodyMists",
        "rollons",
        "LipBalm",
        "Soap"
      ]
    },
    brand: {
      type: String,
      default: "Royal Dynasty"
    },
    priceNGN: {
      type: Number,
      required: true,
      min: 0
    },
    priceGHS: {
      type: Number,
      required: true,
      min: 0
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
        image: {
      type: String,
      default: "images/placeholder.png"
    },
    imagePublicId: {
      type: String,
      default: ""
    },
    tag: {
      type: String,
      enum: ["Bestseller", "New Arrival", "Limited", "Featured", ""],
      default: ""
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviews: {
      type: Number,
      default: 0
    },
    active: {
      type: Boolean,
      default: true
    },
    featured: {
      type: Boolean,
      default: false
    },
    catLabel: {
      type: String,
      default: ""
    },
    details: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Product", productSchema);