import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Assignment from "@/models/Assignment";
import Student from "@/models/Student";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();

    const { searchParams } = req.nextUrl;
    const assignmentId = searchParams.get("assignmentId");

    if (session.user.role === "STUDENT") {
      const query = { studentId: session.user.id };
      if (assignmentId) query.assignmentId = assignmentId;
      const subs = await Submission.find(query)
        .populate("assignmentId", "title dueDate")
        .sort({ submittedAt: -1 })
        .lean();
      return NextResponse.json(subs);
    }

    if (session.user.role === "TEACHER") {
      if (!assignmentId) {
        return NextResponse.json({ error: "assignmentId required" }, { status: 400 });
      }
      const assignment = await Assignment.findById(assignmentId).select('classId').lean();
      const expectedGrade = (assignment?.classId || '').split('-')[0].replace(/\D/g, '');
      const subs = await Submission.find({ assignmentId })
        .populate("studentId", "name studentId grade section status")
        .sort({ submittedAt: -1 })
        .lean();
      const filtered = subs.filter(sub => {
        const s = sub.studentId;
        if (!s) return false;
        if (s.status === 'graduated') return false;
        const studentGradeNum = (s.grade || '').replace(/\D/g, '');
        return studentGradeNum === expectedGrade;
      });
      return NextResponse.json(filtered);
    }

    return NextResponse.json([]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();

    const body = await req.json();
    const { assignmentId, fileUrl, fileName, notes } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: "assignmentId required" }, { status: 400 });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const existing = await Submission.findOne({ assignmentId, studentId: session.user.id });
    if (existing && existing.status !== "returned") {
      return NextResponse.json({ error: "Already submitted. Wait for teacher to return it." }, { status: 400 });
    }

    const subData = {
      assignmentId,
      studentId: session.user.id,
      fileUrl: fileUrl || "",
      fileName: fileName || "",
      notes: notes || "",
      status: "submitted",
      submittedAt: new Date(),
    };

    let submission;
    if (existing) {
      submission = await Submission.findByIdAndUpdate(existing._id, subData, { new: true });
    } else {
      submission = await Submission.create(subData);
    }

    await Assignment.findByIdAndUpdate(assignmentId, { $inc: { submissions: 1 } });

    return NextResponse.json(submission, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();

    const { searchParams } = req.nextUrl;
    const subId = searchParams.get("id");
    if (!subId) {
      return NextResponse.json({ error: "Submission id required" }, { status: 400 });
    }

    const body = await req.json();
    const update = {};
    if (body.grade !== undefined) update.grade = body.grade;
    if (body.feedback !== undefined) update.feedback = body.feedback;
    if (body.status) update.status = body.status;

    const sub = await Submission.findByIdAndUpdate(subId, update, { new: true });
    if (!sub) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json(sub);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
