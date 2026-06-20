import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const profile = { id: session.user.id, name: session.user.name, email: session.user.email, role: session.user.role };

    if (session.user.role === "STUDENT") {
      const student = await Student.findOne({ studentId: session.user.studentId }).select('-password').lean();
      if (student) {
        profile.grade = student.grade;
        profile.studentId = student.studentId;
        profile.section = student.section;
      }
    }

    if (session.user.role === "TEACHER") {
      const teacher = await Teacher.findById(session.user.id).select('-password').lean();
      if (teacher) {
        profile.teacherId = teacher.teacherId;
      }
    }

    return NextResponse.json(profile);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
