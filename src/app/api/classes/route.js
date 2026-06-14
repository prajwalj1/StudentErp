import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import ClassSchedule from "@/models/ClassSchedule";
import Student from "@/models/Student";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    if (session.user.role === "STUDENT") {
      const student = await Student.findById(session.user.id).select("grade section").lean();
      if (!student) return NextResponse.json([]);
      const filter = { grade: student.grade };
      if (student.section) filter.section = student.section;
      const schedules = await ClassSchedule.find(filter).populate('teacherId', 'name').sort({ time: 1 }).lean();
      return NextResponse.json(schedules);
    }

    // Populate teacher details
    const schedules = await ClassSchedule.find().populate('teacherId', 'name email department').sort({ _id: -1 }).lean();
    return NextResponse.json(schedules);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const newSchedule = await ClassSchedule.create(body);
    const populated = await newSchedule.populate('teacherId', 'name email department');
    return NextResponse.json(populated, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
