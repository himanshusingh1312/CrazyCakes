import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { Order } from "@/lib/schema/order";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { analyzeSentiment } from "../sentiment/route";

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

// Create order
export async function POST(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const productId = formData.get("productId");
    const city = formData.get("city") || "Lucknow";
    const area = formData.get("area");
    const size = formData.get("size");
    const instruction = formData.get("instruction") || "";
    const deliveryType = formData.get("deliveryType");
    const deliveryDate = formData.get("deliveryDate");
    const deliveryTime = formData.get("deliveryTime");
    const originalPrice = formData.get("originalPrice");
    const sizeMultiplier = formData.get("sizeMultiplier");
    const phone = formData.get("phone");
    const address = formData.get("address");

    if (!productId || !area || !size || !deliveryType || !deliveryDate || !deliveryTime || !originalPrice || !sizeMultiplier || !phone || !address) {
      return NextResponse.json(
        { error: "Missing required fields (phone and address are required)" },
        { status: 400 }
      );
    }

    // Handle customize image upload (optional)
    let customizeImagePath = "";
    const customizeFile = formData.get("customizeImage");
    if (customizeFile && customizeFile.size > 0) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "customize");
      await fs.mkdir(uploadsDir, { recursive: true });

      const bytes = await customizeFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(customizeFile.name || "") || ".jpg";
      const fileName = `${crypto.randomUUID()}${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      await fs.writeFile(filePath, buffer);
      customizeImagePath = `/uploads/customize/${fileName}`;
    }

    const deliveryCharge = deliveryType === "delivery" ? 50 : 0;
    const basePrice = Number(originalPrice) * Number(sizeMultiplier);
    const subtotal = basePrice + deliveryCharge;
    
    // Handle coupon code if provided
    const couponCode = formData.get("couponCode");
    let discountAmount = 0;
    let finalPrice = subtotal;
    let couponId = null;

    await connectDB();

    if (couponCode) {
      const { Coupon } = await import("@/lib/schema/coupon");
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
        user: decoded.userId,
        isUsed: false,
      });

      if (coupon) {
        // Check if expired
        if (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date()) {
          discountAmount = Math.round((subtotal * coupon.discountPercent) / 100);
          finalPrice = subtotal - discountAmount;
          couponId = coupon._id;
          
          // Mark coupon as used
          coupon.isUsed = true;
          coupon.usedAt = new Date();
          await coupon.save();
        }
      }
    }

    const order = await Order.create({
      user: decoded.userId,
      product: productId,
      city,
      area,
      phone,
      address,
      size: Number(size),
      customizeImage: customizeImagePath,
      instruction,
      deliveryType,
      deliveryDate,
      deliveryTime,
      originalPrice: Number(originalPrice),
      sizeMultiplier: Number(sizeMultiplier),
      deliveryCharge,
      discountAmount,
      couponCode: couponCode || null,
      totalPrice: finalPrice,
    });

    // Populate order with product and user details for email
    const populatedOrder = await Order.findById(order._id)
      .populate("product")
      .populate("user", "name email");

    // Send email notification to admin
    try {
      const { Products } = await import("@/lib/schema/products");
      const product = await Products.findById(productId);
      const { User } = await import("@/lib/schema/user");
      const customer = await User.findById(decoded.userId);
      const admin = await User.findOne({ type: "admin" });

      if (admin && admin.email) {
        // Check if SMTP credentials are configured
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
          console.error("SMTP credentials not configured. Email will not be sent.");
          console.error("Please set SMTP_USER and SMTP_PASS in .env file");
        } else {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: false,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

        const deliveryDateFormatted = new Date(deliveryDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        const deliveryTimeFormatted = new Date(`2000-01-01T${deliveryTime}`).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        const mailOptions = {
          from: process.env.SMTP_USER || "noreply@crazycakes.com",
          to: admin.email,
          subject: `New Order Received - Order #${order._id.toString().slice(-8)}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fffaf3; padding: 20px;">
              <div style="background-color: #5b3a29; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin: 0;">🎂 Crazy Cakes</h1>
                <p style="margin: 5px 0 0 0;">New Order Notification</p>
              </div>
              
              <div style="background-color: white; padding: 20px; border: 1px solid #e5d4c4;">
                <h2 style="color: #5b3a29; margin-top: 0;">New Order Received</h2>
                <p style="color: #8a6a52;">Dear Administrator,</p>
                <p style="color: #8a6a52;">A new order has been placed and requires your attention. Please review the order details below:</p>
                
                <div style="background-color: #f9f4ee; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #5b3a29; margin-top: 0;">Order Information</h3>
                  <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order._id.toString().slice(-8)}</p>
                  <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date().toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}</p>
                  <p style="margin: 5px 0;"><strong>Order Status:</strong> Pending</p>
                </div>

                <div style="background-color: #f9f4ee; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #5b3a29; margin-top: 0;">Customer Information</h3>
                  <p style="margin: 5px 0;"><strong>Name:</strong> ${customer?.name || "N/A"}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${customer?.email || "N/A"}</p>
                  <p style="margin: 5px 0;"><strong>Phone:</strong> ${phone}</p>
                </div>

                <div style="background-color: #f9f4ee; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #5b3a29; margin-top: 0;">Product Details</h3>
                  <p style="margin: 5px 0;"><strong>Product:</strong> ${product?.name || "N/A"}</p>
                  <p style="margin: 5px 0;"><strong>Size:</strong> ${size} kg</p>
                  <p style="margin: 5px 0;"><strong>Price per kg:</strong> ₹${originalPrice}</p>
                  <p style="margin: 5px 0;"><strong>Base Price:</strong> ₹${basePrice}</p>
                  ${deliveryCharge > 0 ? `<p style="margin: 5px 0;"><strong>Delivery Charge:</strong> ₹${deliveryCharge}</p>` : ""}
                  ${discountAmount > 0 ? `<p style="margin: 5px 0; color: green;"><strong>Discount:</strong> -₹${discountAmount} ${couponCode ? `(Coupon: ${couponCode})` : ""}</p>` : ""}
                  <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #5b3a29;"><strong>Total Price:</strong> ₹${finalPrice}</p>
                </div>

                <div style="background-color: #f9f4ee; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #5b3a29; margin-top: 0;">Delivery Information</h3>
                  <p style="margin: 5px 0;"><strong>Delivery Type:</strong> ${deliveryType === "delivery" ? "Home Delivery" : "Pick up from store"}</p>
                  <p style="margin: 5px 0;"><strong>City:</strong> ${city}</p>
                  <p style="margin: 5px 0;"><strong>Area:</strong> ${area.charAt(0).toUpperCase() + area.slice(1)}</p>
                  <p style="margin: 5px 0;"><strong>Address:</strong> ${address}</p>
                  <p style="margin: 5px 0;"><strong>Delivery Date:</strong> ${deliveryDateFormatted}</p>
                  <p style="margin: 5px 0;"><strong>Delivery Time:</strong> ${deliveryTimeFormatted}</p>
                  ${instruction ? `<p style="margin: 5px 0;"><strong>Special Instructions:</strong> ${instruction}</p>` : ""}
                </div>

                ${customizeImagePath ? `<div style="margin: 20px 0;">
                  <p style="color: #5b3a29; font-weight: bold;">Custom Image:</p>
                  <p style="color: #8a6a52; font-size: 12px;">A custom image has been uploaded with this order.</p>
                </div>` : ""}

                <div style="background-color: #fff4ea; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #5b3a29;">
                  <p style="margin: 0; color: #5b3a29;"><strong>Action Required:</strong> Please review and process this order through the admin panel.</p>
                </div>

                <p style="color: #8a6a52; margin-top: 30px;">Please log in to the admin panel to manage this order.</p>
                <p style="color: #8a6a52; margin: 5px 0;">Best regards,<br>Crazy Cakes System</p>
              </div>
              
              <div style="background-color: #5b3a29; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">© ${new Date().getFullYear()} Crazy Cakes. All rights reserved.</p>
              </div>
            </div>
          `,
          text: `
New Order Received - Order #${order._id.toString().slice(-8)}

Dear Administrator,

A new order has been placed and requires your attention. Please review the order details below:

ORDER INFORMATION
Order ID: ${order._id.toString().slice(-8)}
Order Date: ${new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
Order Status: Pending

CUSTOMER INFORMATION
Name: ${customer?.name || "N/A"}
Email: ${customer?.email || "N/A"}
Phone: ${phone}

PRODUCT DETAILS
Product: ${product?.name || "N/A"}
Size: ${size} kg
Price per kg: ₹${originalPrice}
Base Price: ₹${basePrice}
${deliveryCharge > 0 ? `Delivery Charge: ₹${deliveryCharge}\n` : ""}${discountAmount > 0 ? `Discount: -₹${discountAmount} ${couponCode ? `(Coupon: ${couponCode})` : ""}\n` : ""}Total Price: ₹${finalPrice}

DELIVERY INFORMATION
Delivery Type: ${deliveryType === "delivery" ? "Home Delivery" : "Pick up from store"}
City: ${city}
Area: ${area.charAt(0).toUpperCase() + area.slice(1)}
Address: ${address}
Delivery Date: ${deliveryDateFormatted}
Delivery Time: ${deliveryTimeFormatted}
${instruction ? `Special Instructions: ${instruction}\n` : ""}${customizeImagePath ? "Custom Image: A custom image has been uploaded with this order.\n" : ""}
Action Required: Please review and process this order through the admin panel.

Please log in to the admin panel to manage this order.

Best regards,
Crazy Cakes System

© ${new Date().getFullYear()} Crazy Cakes. All rights reserved.
          `,
          };

          await transporter.sendMail(mailOptions);
          console.log(`Order notification email sent successfully to admin: ${admin.email}`);
        }
      } else {
        console.log("Admin email not found, skipping email send");
      }
    } catch (emailError) {
      // Log email error but don't fail the order creation
      console.error("Error sending order confirmation email:", emailError);
      console.error("Email error details:", {
        message: emailError.message,
        code: emailError.code,
        response: emailError.response,
      });
    }

    return NextResponse.json(
      { message: "Order created successfully", order },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// Get orders (for logged-in user or all orders for admin)
export async function GET(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Import User to check if admin
    const { User } = await import("@/lib/schema/user");
    const user = await User.findById(decoded.userId);

    let orders;
    if (user && user.type === "admin") {
      // Admin sees all orders
      orders = await Order.find({})
        .populate("product")
        .populate("user", "name email phone")
        .sort({ createdAt: -1 });
    } else {
      // Regular user sees only their orders
      orders = await Order.find({ user: decoded.userId })
        .populate("product")
        .sort({ createdAt: -1 });
    }

    // Convert to plain objects to ensure all fields (including phone and address) are serialized
    const ordersData = orders.map(order => {
      const orderObj = order.toObject ? order.toObject() : order;
      // Explicitly ensure phone and address are included
      return {
        ...orderObj,
        phone: orderObj.phone || order.phone || null,
        address: orderObj.address || order.address || null,
        rating: orderObj.rating || null,
        review: orderObj.review || "",
        sentiment: orderObj.sentiment || null,
      };
    });

    return NextResponse.json({ orders: ordersData }, { status: 200 });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update order status and message (admin only) OR add review/rating (user)
export async function PUT(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { User } = await import("@/lib/schema/user");
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { orderId, status, adminMessage, rating, review } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    // Check if order exists and belongs to user (for reviews) or if admin (for status)
    const order = await Order.findById(orderId)
      .populate("product")
      .populate("user", "name email phone");
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if status is being changed to "delivered" (for email notification)
    const isStatusChangedToDelivered = user.type === "admin" && status === "delivered" && order.status !== "delivered";

    const updateData = {};

    // Admin can update status and message
    if (user.type === "admin") {
      if (status) {
        updateData.status = status;
      }
      if (adminMessage !== undefined) {
        updateData.adminMessage = adminMessage;
      }
    }

    // User can cancel/modify orders (only pending orders)
    // Handle both populated and non-populated user field
    const orderUserIdForModify = order.user._id ? String(order.user._id) : String(order.user);
    if (orderUserIdForModify === String(decoded.userId) && user.type !== "admin") {
      if (status === "cancelled") {
        // Only allow cancellation if order is pending
        if (order.status !== "pending") {
          return NextResponse.json(
            { error: "Only pending orders can be cancelled" },
            { status: 400 }
          );
        }
        updateData.status = "cancelled";
      }
      
      // Allow modification of pending orders
      const { phone, address, deliveryDate, deliveryTime, deliveryType, area, size, instruction } = body;
      if (order.status === "pending") {
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (deliveryDate !== undefined) updateData.deliveryDate = deliveryDate;
        if (deliveryTime !== undefined) updateData.deliveryTime = deliveryTime;
        if (deliveryType !== undefined) {
          updateData.deliveryType = deliveryType;
          // Recalculate delivery charge
          updateData.deliveryCharge = deliveryType === "delivery" ? 50 : 0;
        }
        if (area !== undefined) updateData.area = area;
        if (size !== undefined) {
          updateData.size = Number(size);
          updateData.sizeMultiplier = Number(size);
          // Recalculate price
          const basePrice = order.originalPrice * Number(size);
          const deliveryCharge = updateData.deliveryCharge !== undefined ? updateData.deliveryCharge : order.deliveryCharge;
          updateData.totalPrice = basePrice + deliveryCharge - (order.discountAmount || 0);
        }
        if (instruction !== undefined) updateData.instruction = instruction;
      } else if (phone !== undefined || address !== undefined || deliveryDate !== undefined || deliveryTime !== undefined || deliveryType !== undefined || area !== undefined || size !== undefined || instruction !== undefined) {
        return NextResponse.json(
          { error: "Only pending orders can be modified" },
          { status: 400 }
        );
      }
    }

    // User can add review and rating (only for their own orders)
    // Admin can edit/delete any review
    if (rating !== undefined || review !== undefined) {
      // Allow admin to edit/delete any review, or user to edit their own review
      // Handle both populated and non-populated user field
      const orderUserId = order.user._id ? String(order.user._id) : String(order.user);
      if (user.type !== "admin" && orderUserId !== String(decoded.userId)) {
        return NextResponse.json(
          { error: "You can only review your own orders" },
          { status: 403 }
        );
      }
      if (rating !== undefined) {
        // Allow null to delete rating (admin only)
        if (rating === null) {
          updateData.rating = null;
        } else {
          if (rating < 1 || rating > 5) {
            return NextResponse.json(
              { error: "Rating must be between 1 and 5" },
              { status: 400 }
            );
          }
          updateData.rating = rating;
        }
      }
      if (review !== undefined) {
        updateData.review = review;
        
        // Analyze sentiment if review text is provided
        if (review && review.trim() !== "") {
          try {
            const sentimentResult = analyzeSentiment(review);
            updateData.sentiment = {
              score: sentimentResult.score,
              label: sentimentResult.label,
            };
          } catch (error) {
            console.error("Sentiment analysis error:", error);
            // If sentiment analysis fails, set default neutral sentiment
            updateData.sentiment = {
              score: 0,
              label: "neutral",
            };
          }
        } else {
          // Clear sentiment if review is deleted
          updateData.sentiment = {
            score: 0,
            label: "neutral",
          };
        }
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    )
      .populate("product")
      .populate("user", "name email phone");

    // Send email to customer when order is delivered
    if (isStatusChangedToDelivered && updatedOrder.user && updatedOrder.user.email) {
      try {
        // Check if SMTP credentials are configured
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
          console.error("SMTP credentials not configured. Email will not be sent.");
        } else {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: false,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          const deliveryDateFormatted = updatedOrder.deliveryDate 
            ? new Date(updatedOrder.deliveryDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "N/A";

          const deliveryTimeFormatted = updatedOrder.deliveryTime
            ? new Date(`2000-01-01T${updatedOrder.deliveryTime}`).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : "N/A";

          const mailOptions = {
            from: process.env.SMTP_USER || "noreply@crazycakes.com",
            to: updatedOrder.user.email,
            subject: `🎉 Your Order Has Been Delivered - Order #${updatedOrder._id.toString().slice(-8)}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fffaf3; padding: 20px;">
                <div style="background-color: #5b3a29; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                  <h1 style="margin: 0;">🎂 Crazy Cakes</h1>
                  <p style="margin: 5px 0 0 0;">Order Delivered</p>
                </div>
                
                <div style="background-color: white; padding: 20px; border: 1px solid #e5d4c4;">
                  <h2 style="color: #5b3a29; margin-top: 0;">🎉 Your Order Has Been Delivered!</h2>
                  <p style="color: #8a6a52;">Dear ${updatedOrder.user.name || "Valued Customer"},</p>
                  <p style="color: #8a6a52;">We are delighted to inform you that your order has been successfully delivered. We hope you enjoy your delicious cake!</p>
                  
                  <div style="background-color: #f9f4ee; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #5b3a29; margin-top: 0;">Order Information</h3>
                    <p style="margin: 5px 0;"><strong>Order ID:</strong> ${updatedOrder._id.toString().slice(-8)}</p>
                    <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(updatedOrder.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}</p>
                    <p style="margin: 5px 0;"><strong>Order Status:</strong> <span style="color: green; font-weight: bold;">Delivered ✓</span></p>
                  </div>

                  <div style="background-color: #f9f4ee; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #5b3a29; margin-top: 0;">Product Details</h3>
                    <p style="margin: 5px 0;"><strong>Product:</strong> ${updatedOrder.product?.name || "N/A"}</p>
                    <p style="margin: 5px 0;"><strong>Size:</strong> ${updatedOrder.size} kg</p>
                    <p style="margin: 5px 0;"><strong>Total Price:</strong> ₹${updatedOrder.totalPrice}</p>
                  </div>

                  <div style="background-color: #f9f4ee; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #5b3a29; margin-top: 0;">Delivery Information</h3>
                    <p style="margin: 5px 0;"><strong>Delivery Type:</strong> ${updatedOrder.deliveryType === "delivery" ? "Home Delivery" : "Pick up from store"}</p>
                    <p style="margin: 5px 0;"><strong>Area:</strong> ${updatedOrder.area ? updatedOrder.area.charAt(0).toUpperCase() + updatedOrder.area.slice(1) : "N/A"}</p>
                    <p style="margin: 5px 0;"><strong>Address:</strong> ${updatedOrder.address || "N/A"}</p>
                    <p style="margin: 5px 0;"><strong>Delivery Date:</strong> ${deliveryDateFormatted}</p>
                    <p style="margin: 5px 0;"><strong>Delivery Time:</strong> ${deliveryTimeFormatted}</p>
                  </div>

                  <div style="background-color: #fff4ea; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #5b3a29;">
                    <p style="margin: 0; color: #5b3a29;"><strong>Thank You!</strong> We hope you enjoyed your cake. Your feedback is valuable to us!</p>
                  </div>

                  <p style="color: #8a6a52; margin-top: 30px;">If you have any questions or concerns, please feel free to contact us.</p>
                  <p style="color: #8a6a52; margin: 5px 0;">Best regards,<br>Crazy Cakes Team</p>
                </div>
                
                <div style="background-color: #5b3a29; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px;">
                  <p style="margin: 0;">© ${new Date().getFullYear()} Crazy Cakes. All rights reserved.</p>
                </div>
              </div>
            `,
            text: `
🎉 Your Order Has Been Delivered - Order #${updatedOrder._id.toString().slice(-8)}

Dear ${updatedOrder.user.name || "Valued Customer"},

We are delighted to inform you that your order has been successfully delivered. We hope you enjoy your delicious cake!

ORDER INFORMATION
Order ID: ${updatedOrder._id.toString().slice(-8)}
Order Date: ${new Date(updatedOrder.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
Order Status: Delivered ✓

PRODUCT DETAILS
Product: ${updatedOrder.product?.name || "N/A"}
Size: ${updatedOrder.size} kg
Total Price: ₹${updatedOrder.totalPrice}

DELIVERY INFORMATION
Delivery Type: ${updatedOrder.deliveryType === "delivery" ? "Home Delivery" : "Pick up from store"}
Area: ${updatedOrder.area ? updatedOrder.area.charAt(0).toUpperCase() + updatedOrder.area.slice(1) : "N/A"}
Address: ${updatedOrder.address || "N/A"}
Delivery Date: ${deliveryDateFormatted}
Delivery Time: ${deliveryTimeFormatted}

Thank You! We hope you enjoyed your cake. Your feedback is valuable to us!

If you have any questions or concerns, please feel free to contact us.

Best regards,
Crazy Cakes Team

© ${new Date().getFullYear()} Crazy Cakes. All rights reserved.
            `,
          };

          await transporter.sendMail(mailOptions);
          console.log(`Delivery notification email sent successfully to customer: ${updatedOrder.user.email}`);
        }
      } catch (emailError) {
        console.error("Error sending delivery email to customer:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(
      { message: "Order updated successfully", order: updatedOrder },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// Delete order (admin only)
export async function DELETE(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { User } = await import("@/lib/schema/user");
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admins can delete orders
    if (user.type !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete orders" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Delete customize image if it exists
    if (order.customizeImage) {
      try {
        const imagePath = path.join(process.cwd(), "public", order.customizeImage);
        await fs.unlink(imagePath);
      } catch (imageError) {
        // Log error but don't fail deletion if image doesn't exist
        console.error("Error deleting customize image:", imageError);
      }
    }

    // Delete the order
    await Order.findByIdAndDelete(orderId);

    return NextResponse.json(
      { message: "Order deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete order error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

