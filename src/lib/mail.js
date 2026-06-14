import nodemailer from "nodemailer";

const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export async function sendNoticeEmail({ to, title, content, createdByName }) {
  const transporter = getTransporter();
  if (!transporter) return;

  const subject = title
    ? `[School Notice] ${title}`
    : "New Notice from Everest View School";

  await transporter.sendMail({
    from: `"Everest View School" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <div style="background:#2563eb;padding:20px 24px;border-radius:10px 10px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;">Everest View School</h1>
        </div>
        <div style="background:#fff;padding:24px;border-radius:0 0 10px 10px;border:1px solid #e2e8f0;">
          ${title ? `<h2 style="color:#0f172a;margin:0 0 12px;">${title}</h2>` : ""}
          ${content ? `<p style="color:#475569;line-height:1.6;margin:0 0 16px;">${content.replace(/\n/g, "<br>")}</p>` : ""}
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            Sent by ${createdByName} · Everest View Secondary Boarding School<br>
            To unsubscribe, contact the school administration.
          </p>
        </div>
      </div>
    `,
  });
}
