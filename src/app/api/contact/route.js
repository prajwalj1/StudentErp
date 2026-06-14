import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, department, subject, message } = body;

    // Validate data
    if (!name || !email || !department || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Use environment variables for production email sending
    const isProd = process.env.EMAIL_USER && process.env.EMAIL_PASS;

    if (isProd) {
      
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"School ERP Contact" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: `[${department.toUpperCase()}] New Inquiry: ${subject || "No Subject"}`,
        text: `Name: ${name}\nEmail: ${email}\nDepartment: ${department}\n\nMessage:\n${message}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2563eb;">New School Inquiry</h2>
            <p><strong>Department:</strong> ${department.toUpperCase()}</p>
            <p><strong>From:</strong> ${name} (${email})</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
        `,
      });

      return NextResponse.json(
        { message: "Email sent successfully" },
        { status: 200 }
      );
    }

    // FALLBACK: Simulation for development
    console.log("SIMULATION: New Contact Form Submission:", { name, email, department, message });
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return NextResponse.json(
      { message: "Email received (Simulation Mode)" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Contact API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
