import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Exam from "@/models/Exam";
import Student from "@/models/Student";
import { validate, examSchema } from "@/lib/validate";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (session.user.role === "STUDENT") {
      const student = await Student.findById(session.user.id).select("grade").lean();
      if (!student) return NextResponse.json([]);
      const exams = await Exam.find({ grade: student.grade, date: { $gte: today } }).sort({ date: 1 }).lean();
      return NextResponse.json(exams);
    }

    const exams = await Exam.find().sort({ date: 1 }).lean();
    return NextResponse.json(exams);
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
    const body = await req.json();

    if (!Array.isArray(body)) {
      const validation = validate(examSchema)(body);
      if (!validation.valid) {
        return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
      }
    }

    // Support bulk insertion for routines
    if (Array.isArray(body)) {
      const newExams = await Exam.insertMany(body);
      return NextResponse.json(newExams, { status: 201 });
    }

    const newExam = await Exam.create(body);
    return NextResponse.json(newExam, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('id');
    if (!examId) return NextResponse.json({ error: "Exam ID required" }, { status: 400 });

    const body = await req.json();
    const updated = await Exam.findByIdAndUpdate(examId, body, { new: true });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "OWNER" && session.user.role !== "TEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('id');
    if (!examId) return NextResponse.json({ error: "Exam ID required" }, { status: 400 });

    await Exam.findByIdAndDelete(examId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
