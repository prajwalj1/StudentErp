import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import LessonPlan from "@/models/LessonPlan";
import Teacher from "@/models/Teacher";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await Teacher.findOne({ email: session.user.email });
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const classScheduleId = searchParams.get("classScheduleId");

    const query = { teacherId: teacher._id };
    if (classScheduleId) query.classScheduleId = classScheduleId;

    await dbConnect();
    const plans = await LessonPlan.find(query).sort({ weekStart: -1 }).lean();
    return NextResponse.json(plans);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await Teacher.findOne({ email: session.user.email });
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const body = await req.json();
    await dbConnect();

    const plan = await LessonPlan.create({
      ...body,
      teacherId: teacher._id
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
