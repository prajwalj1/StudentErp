import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

function getLogoDataUri() {
  try {
    const p = path.join(process.cwd(), "public", "images", "logo.png");
    if (!fs.existsSync(p)) return null;
    const bytes = fs.readFileSync(p);
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

function buildEmailHtml({ name, email, department, message, logoDataUri }) {
  const logoImg = logoDataUri
    ? `<img src="${logoDataUri}" alt="Everest View School" style="height:56px;width:auto;margin-bottom:12px;" />`
    : "";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#1e40af,#7c3aed);padding:32px 40px 24px;border-radius:16px 16px 0 0;text-align:center;">
              ${logoImg}
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.5px;">New Contact Inquiry</h1>
              <p style="color:#c4b5fd;margin:4px 0 0;font-size:13px;">Everest View Secondary Boarding School</p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:36px 40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:20px;">
                    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0;">You have received a new inquiry from the school contact form.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:24px;">
                    <span style="display:inline-block;background:#ede9fe;color:#6d28d9;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${department}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                      <tr>
                        <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:90px;">Name</td>
                              <td style="color:#0f172a;font-size:14px;font-weight:600;">${name}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:90px;">Email</td>
                              <td style="color:#2563eb;font-size:14px;"><a href="mailto:${email}" style="color:#2563eb;text-decoration:none;font-weight:500;">${email}</a></td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 20px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:90px;vertical-align:top;">Department</td>
                              <td style="color:#0f172a;font-size:14px;font-weight:500;text-transform:capitalize;">${department.replace("-", " ")}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:8px;">
                    <h3 style="color:#0f172a;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Message</h3>
                    <div style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:20px;">
                      <p style="color:#334155;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${message}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#1e293b;padding:24px 40px;border-radius:0 0 16px 16px;text-align:center;">
              <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0 0 4px;">
                <strong style="color:#f8fafc;">Everest View Secondary Boarding School</strong><br>
                <span style="color:#64748b;">Dhulabari, Jhapa | +977 023-562430 | support@everestview.edu.np</span>
              </p>
              <p style="color:#475569;font-size:11px;margin:12px 0 0;border-top:1px solid #334155;padding-top:12px;">
                This email was sent from the school contact form. Please respond within 24 hours.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, department, subject, message } = body;

    if (!name || !email || !department || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

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
        attachDataUrls: true,
      });

      const logoDataUri = getLogoDataUri();

      await transporter.sendMail({
        from: `"Everest View School" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: `[${department.toUpperCase()}] New Inquiry: ${subject || "No Subject"}`,
        text: `Name: ${name}\nEmail: ${email}\nDepartment: ${department}\n\nMessage:\n${message}`,
        html: buildEmailHtml({ name, email, department, message, logoDataUri }),
      });

      return NextResponse.json(
        { message: "Email sent successfully" },
        { status: 200 }
      );
    }

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
