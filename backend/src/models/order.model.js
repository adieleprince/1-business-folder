import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true
    },
    customerName: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    items: [
      {
        name: String,
        quantity: Number,
        price: Number,
        productId: mongoose.Schema.Types.ObjectId
      }
    ],
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      enum: ["NGN", "GHS"],
      default: "NGN"
    },
    paymentMethod: {
      type: String,
      default: "Paystack"
    },
    receipt: String,
    receiptOriginalName: String,
    status: {
      type: String,
      enum: [
        "Pending Verification",
        "Verified",
        "Processing",
        "Delivered",
        "Completed",
        "Cancelled"
      ],
      default: "Pending Verification"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Order", orderSchema);