import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const filter = {};

    if (session.user.role === "STUDENT") {
      filter.recipientRole = "STUDENT";
      filter.recipientId = session.user.id;
    } else if (session.user.role === "TEACHER") {
      filter.$or = [
        { recipientRole: "TEACHER", recipientId: session.user.id },
        { recipientRole: "TEACHER", recipientId: null },
      ];
    } else {
      filter.recipientRole = "OWNER";
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json(notifications);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const { id } = await req.json();

    if (id === "all") {
      const filter = { recipientRole: session.user.role };
      if (session.user.role === "STUDENT") {
        filter.recipientId = session.user.id;
      }
      await Notification.updateMany(filter, { $set: { read: true } });
    } else if (id) {
      await Notification.findByIdAndUpdate(id, { $set: { read: true } });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
