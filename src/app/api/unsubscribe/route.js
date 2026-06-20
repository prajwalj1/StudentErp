import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Subscriber from "@/models/Subscriber";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        `<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;">
          <div style="text-align:center;background:#fff;padding:40px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            <h1 style="color:#dc2626;">Invalid Request</h1>
            <p style="color:#64748b;">No valid email provided.</p>
          </div>
        </body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    await dbConnect();

    const result = await Subscriber.findOneAndDelete({ email: email.toLowerCase().trim() });

    if (result) {
      return new Response(
        `<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;">
          <div style="text-align:center;background:#fff;padding:40px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            <div style="font-size:48px;margin-bottom:16px;">&#10003;</div>
            <h1 style="color:#166534;margin:0 0 8px;">Unsubscribed Successfully</h1>
            <p style="color:#64748b;margin:0;">${email} has been removed from our mailing list.</p>
          </div>
        </body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    return new Response(
      `<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;">
        <div style="text-align:center;background:#fff;padding:40px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          <h1 style="color:#2563eb;margin:0 0 8px;">Already Unsubscribed</h1>
          <p style="color:#64748b;margin:0;">${email} was not found in our mailing list.</p>
        </div>
      </body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
