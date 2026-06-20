import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Assignment from "@/models/Assignment";
import Submission from "@/models/Submission";
import Student from "@/models/Student";

function parseClassId(classId) {
  const parts = classId.split('-');
  const gradeRaw = parts[0] || '';
  const section = parts[1] || '';
  const digits = gradeRaw.replace(/[^0-9]/g, '');
  return { grade: digits, section };
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    if (session.user.role === "STUDENT") {
      const student = await Student.findById(session.user.id).select("grade").lean();
      if (!student) return NextResponse.json([]);
      const escapedGrade = student.grade.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const assignments = await Assignment.find({
        $or: [
          { classId: student.grade },
          { classId: { $regex: `^${escapedGrade}-` } },
        ]
      })
        .populate("teacherId", "name")
        .sort({ dueDate: 1 })
        .lean();
      const assignmentIds = assignments.map(a => a._id);
      const submissions = await Submission.find({
        studentId: session.user.id,
        assignmentId: { $in: assignmentIds }
      }).select("assignmentId status grade feedback submittedAt fileName").lean();
      const subMap = {};
      submissions.forEach(s => { subMap[s.assignmentId.toString()] = s; });
      const result = assignments.map(a => ({
        ...a,
        submission: subMap[a._id.toString()] || null,
      }));
      return NextResponse.json(result);
    }

    if (session.user.role === "TEACHER") {
      const assignments = await Assignment.find({ teacherId: session.user.id }).sort({ _id: -1 }).lean();
      const withDynamicData = await Promise.all(assignments.map(async (a) => {
        const { grade, section } = parseClassId(a.classId || '');
        const studentFilter = {};
        if (grade) studentFilter.grade = { $regex: new RegExp(`\\b${grade}$`) };
        if (section) studentFilter.section = section;
        const currentStudents = await Student.find({ ...studentFilter, status: { $ne: 'graduated' } }).select('_id').lean();
        const currentIds = currentStudents.map(s => s._id);
        const total = currentIds.length || 1;
        const submissions = await Submission.countDocuments({
          assignmentId: a._id,
          studentId: { $in: currentIds },
          status: { $ne: 'returned' }
        });
        return { ...a, total, submissions };
      }));
      return NextResponse.json(withDynamicData);
    }

    const assignments = await Assignment.find().sort({ _id: -1 }).lean();
    return NextResponse.json(assignments);
  } catch (err) {
    return NextResponse.json([]);
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();
    const body = await req.json();
    const { id, status } = body;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const update = {};
    if (status) update.status = status;
    const updated = await Assignment.findByIdAndUpdate(id, update, { new: true });
    return NextResponse.json(updated);
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

    await dbConnect();
    const body = await req.json();
    body.teacherId = session.user.id;
    body.status = 'Active';
    body.submissions = 0;

    // Dynamic student count
    const { grade, section } = parseClassId(body.classId || '');
    const studentFilter = {};
    if (grade) {
      studentFilter.grade = { $regex: new RegExp(`\\b${grade}$`) };
    }
    if (section) {
      studentFilter.section = section;
    }
    const totalStudents = await Student.countDocuments({ ...studentFilter, status: { $ne: 'graduated' } });
    body.total = totalStudents || 1;

    const newAssignment = await Assignment.create(body);
    return NextResponse.json(newAssignment, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    if (assignment.teacherId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await Submission.deleteMany({ assignmentId: id });
    await Assignment.findByIdAndDelete(id);
    return NextResponse.json({ message: "Assignment deleted" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
