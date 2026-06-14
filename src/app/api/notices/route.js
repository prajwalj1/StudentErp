import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Notice from "@/models/Notice";
import Student from "@/models/Student";
import Subscriber from "@/models/Subscriber";
import { sendNoticeEmail } from "@/lib/mail";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const target = searchParams.get("target");

    const filter = {};

    // Auto-filter expired notices
    filter.$or = [
      { expiryDate: { $exists: false } },
      { expiryDate: null },
      { expiryDate: { $gte: new Date() } },
    ];

    if (session.user.role === "STUDENT") {
      filter.targetAudience = { $in: ["all", "student"] };
      const student = await Student.findById(session.user.id).select("grade").lean();
      if (student?.grade) {
        filter.$or.push({ grade: "" }, { grade: student.grade });
      } else {
        filter.grade = "";
      }
    } else if (session.user.role === "TEACHER") {
      filter.targetAudience = { $in: ["all", "teacher"] };
      if (target) filter.targetAudience = target === "student" ? "student" : { $in: ["all", "teacher"] };
    } else if (session.user.role === "OWNER") {
      if (target) filter.targetAudience = target;
      // Owners see all notices including expired ones
      delete filter.$or;
    }

    const notices = await Notice.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json(notices);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "OWNER" && session.user.role !== "TEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { title, content, imageUrl, expiryDate, targetAudience, grade } = await req.json();

    if (!title && !content && !imageUrl) {
      return NextResponse.json({ error: "Provide at least an image, title, or content" }, { status: 400 });
    }

    const notice = await Notice.create({
      title: title || "",
      content: content || "",
      imageUrl: imageUrl || "",
      expiryDate: expiryDate || null,
      targetAudience: targetAudience || "all",
      grade: grade || "",
      createdByName: session.user.name,
      createdByRole: session.user.role,
    });

    if (session.user.role === "OWNER") {
      try {
        const subscribers = await Subscriber.find({}).lean();
        if (subscribers.length > 0) {
          await Promise.allSettled(
            subscribers.map((sub) =>
              sendNoticeEmail({
                to: sub.email,
                title: notice.title,
                content: notice.content,
                createdByName: notice.createdByName,
              })
            )
          );
        }
      } catch (emailErr) {
        console.error("Failed to send notice emails:", emailErr);
      }
    }

    return NextResponse.json(notice, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Notice ID is required" }, { status: 400 });
    }

    await Notice.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
