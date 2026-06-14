import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import ExamRoutine from "@/models/ExamRoutine";
import Student from "@/models/Student";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get("grade");
    const studentId = searchParams.get("studentId");

    const findRoutine = async (g) => {
      const candidates = [g];
      const digits = g?.replace(/[^0-9]/g, '');
      if (digits && digits !== g) candidates.push(digits);
      if (digits && `Grade ${digits}` !== g) candidates.push(`Grade ${digits}`);
      for (const c of candidates) {
        const r = await ExamRoutine.findOne({ grade: c }).lean();
        if (r) return r;
      }
      return null;
    };

    if (studentId) {
      const student = await Student.findOne({ studentId }).select("grade").lean();
      if (student && student.grade) {
        const routine = await findRoutine(student.grade);
        return NextResponse.json(routine || null);
      }
      return NextResponse.json(null);
    }

    if (grade) {
      const routine = await findRoutine(grade);
      return NextResponse.json(routine || null);
    }

    const routines = await ExamRoutine.find().sort({ grade: 1 }).lean();
    return NextResponse.json(routines);
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
    const { grade, terms } = body;

    if (!grade) {
      return NextResponse.json({ error: "Grade is required" }, { status: 400 });
    }

    const routine = await ExamRoutine.findOneAndUpdate(
      { grade },
      { grade, terms: terms || [] },
      { upsert: true, new: true }
    );

    return NextResponse.json(routine, { status: 201 });
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
    const grade = searchParams.get("grade");

    if (!grade) {
      return NextResponse.json({ error: "Grade is required" }, { status: 400 });
    }

    await ExamRoutine.findOneAndDelete({ grade });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
