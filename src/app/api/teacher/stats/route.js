import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Assignment from "@/models/Assignment";
import Submission from "@/models/Submission";
import Exam from "@/models/Exam";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const grade = searchParams.get("grade");
    if (!grade) {
      return NextResponse.json({ error: "Grade is required" }, { status: 400 });
    }

    await dbConnect();

    const teacher = await Teacher.findOne({ email: session.user.email }).select('-password').lean();
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // 1. Avg Attendance — average student present % across all attendance records for this grade
    const attendanceAgg = await Attendance.aggregate([
      { $match: { grade, teacherId: teacher._id } },
      { $unwind: "$students" },
      {
        $group: {
          _id: null,
          present: { $sum: { $cond: [{ $eq: ["$students.status", "Present"] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
    ]);
    const avgAttendance =
      attendanceAgg.length > 0
        ? Math.round((attendanceAgg[0].present / attendanceAgg[0].total) * 100)
        : 0;

    // 2. Assignment Completion — submissions received vs total expected (students × assignments)
    const assignments = await Assignment.find({
      teacherId: teacher._id,
      classId: { $regex: `^${grade}` },
    }).lean();

    const studentCount = await Student.countDocuments({ grade, status: { $ne: "graduated" } });

    let assignmentCompletion = 0;
    if (assignments.length > 0 && studentCount > 0) {
      const assignmentIds = assignments.map((a) => a._id);
      const submissionCount = await Submission.countDocuments({
        assignmentId: { $in: assignmentIds },
        status: { $ne: "returned" },
      });
      assignmentCompletion = Math.round((submissionCount / (assignments.length * studentCount)) * 100);
    }

    // 3. Exams Prepared — completed/published exams vs total exams for this grade
    const totalExams = await Exam.countDocuments({ grade });
    const completedExams = await Exam.countDocuments({
      grade,
      status: { $in: ["Completed", "Published"] },
    });
    const examsPrepared = totalExams > 0 ? Math.round((completedExams / totalExams) * 100) : 0;

    return NextResponse.json({
      attendance: avgAttendance,
      assignmentCompletion,
      examsPrepared,
    });
  } catch (err) {
    console.error("Teacher stats API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
