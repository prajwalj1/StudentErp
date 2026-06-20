import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb"; 
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import Payment from "@/models/Payment";
import Attendance from "@/models/Attendance";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const [
      studentCount,
      teacherCount,
      revenueAgg,
      attendanceAgg,
      feeAgg,
      gradeDist,
      gradeFeeAgg,
      gradeAttendanceAgg,
      teacherSubjectAgg,
    ] = await Promise.all([
      Student.countDocuments({ status: { $ne: 'graduated' } }),
      Teacher.countDocuments(),

      // Total revenue from all payments
      Payment.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      // Overall avg attendance (from real Attendance records)
      Attendance.aggregate([
        { $unwind: "$students" },
        { $group: { _id: "$students.studentId", present: { $sum: { $cond: [{ $eq: ["$students.status", "Present"] }, 1, 0] } }, total: { $sum: 1 } } },
        { $group: { _id: null, avg: { $avg: { $cond: [{ $gt: ["$total", 0] }, { $divide: ["$present", "$total"] }, 0] } } } },
      ]),

      // Overall fee totals
      Student.aggregate([
        { $match: { status: { $ne: 'graduated' } } },
        { $group: { _id: null, totalFee: { $sum: "$totalFee" }, totalPaid: { $sum: "$paidAmount" }, totalDue: { $sum: "$dueAmount" }, totalPreviousDue: { $sum: "$previousDue" } } }
      ]),

      // Students per grade with count
      Student.aggregate([
        { $match: { status: { $ne: 'graduated' } } },
        { $group: { _id: "$grade", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Fee stats per grade
      Student.aggregate([
        { $match: { status: { $ne: 'graduated' } } },
        {
          $group: {
            _id: "$grade",
            totalFee: { $sum: "$totalFee" },
            totalPaid: { $sum: "$paidAmount" },
            totalDue: { $sum: "$dueAmount" },
            totalPreviousDue: { $sum: "$previousDue" },
          }
        },
        { $sort: { _id: 1 } },
      ]),

      // Avg attendance per grade (from real Attendance records)
      Attendance.aggregate([
        { $unwind: "$students" },
        { $lookup: { from: "students", localField: "students.studentId", foreignField: "_id", as: "student" } },
        { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
        { $group: { _id: "$student.grade", present: { $sum: { $cond: [{ $eq: ["$students.status", "Present"] }, 1, 0] } }, total: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $project: { grade: "$_id", avgAttendance: { $cond: [{ $gt: ["$total", 0] }, { $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 0] } } },
        { $sort: { _id: 1 } },
      ]),

      // Teachers per subject area (using teacherId prefix or just all)
      Teacher.aggregate([
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
    ]);

    const feeData = feeAgg[0] || { totalFee: 0, totalPaid: 0, totalDue: 0, totalPreviousDue: 0 };

    // Merge grade data into a single array
    const gradeMap = {};
    gradeDist.forEach(g => { gradeMap[g._id] = { grade: g._id, count: g.count, totalFee: 0, totalPaid: 0, totalDue: 0, totalPreviousDue: 0, avgAttendance: 0 }; });
    gradeFeeAgg.forEach(g => { if (gradeMap[g._id]) { gradeMap[g._id].totalFee = g.totalFee; gradeMap[g._id].totalPaid = g.totalPaid; gradeMap[g._id].totalDue = g.totalDue; gradeMap[g._id].totalPreviousDue = g.totalPreviousDue; } });
    gradeAttendanceAgg.forEach(g => { if (gradeMap[g.grade]) { gradeMap[g.grade].avgAttendance = Math.round(g.avgAttendance); } });
    const gradeDistribution = Object.values(gradeMap).sort((a, b) => a.grade.localeCompare(b.grade, undefined, { numeric: true }));

    // Recent 5 students
    const recentStudents = await Student.find({ status: { $ne: 'graduated' } })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Recent 5 payments
    const recentPayments = await Payment.find()
      .sort({ date: -1 })
      .limit(5)
      .populate("studentId", "name")
      .lean();

    // Recent 3 teachers
    const recentTeachers = await Teacher.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    return NextResponse.json({
      students: studentCount,
      teachers: teacherCount,
      revenue: revenueAgg[0]?.total ?? 0,
      attendance: studentCount > 0 ? Math.round((attendanceAgg[0]?.avg ?? 0) * 100) : 0,
      totalFee: feeData.totalFee,
      totalPaid: feeData.totalPaid,
      totalDue: feeData.totalDue,
      totalPreviousDue: feeData.totalPreviousDue,
      gradeDistribution,
      recentStudents,
      recentPayments,
      recentTeachers,
    });
  } catch (err) {
    console.error("Stats API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
