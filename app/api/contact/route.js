import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const { name, phone, description } = await request.json();

    // Validation
    if (!name || !phone || !description) {
      return NextResponse.json(
        { error: "Name, phone, and description are required" },
        { status: 400 }
      );
    }

    // Email configuration - using Gmail SMTP
    // You need to set these in your .env file:
    // SMTP_HOST=smtp.gmail.com
    // SMTP_PORT=587
    // SMTP_USER=your-email@gmail.com
    // SMTP_PASS=your-app-password (not regular password, use App Password from Google)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Get admin email from .env
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || "himanshu094405@gmail.com";

    // Email content
    const mailOptions = {
      from: process.env.SMTP_USER || "noreply@crazycakes.com",
      to: adminEmail,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5b3a29;">New Contact Form Submission</h2>
          <div style="background-color: #f9f4ee; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; background-color: white; padding: 15px; border-radius: 4px;">${description}</p>
          </div>
          <p style="color: #8a6a52; font-size: 12px;">This message was sent from the Crazy Cakes contact form.</p>
        </div>
      `,
      text: `
New Contact Form Submission

Name: ${name}
Phone: ${phone}

Message:
${description}

---
This message was sent from the Crazy Cakes contact form.
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send email. Please try again later." },
      { status: 500 }
    );
  }
}

