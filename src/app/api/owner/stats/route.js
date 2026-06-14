import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb"; 
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import Payment from "@/models/Payment";

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
      feeAgg
    ] = await Promise.all([
      Student.countDocuments({ status: { $ne: 'graduated' } }),
      Teacher.countDocuments(),
      Payment.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Student.aggregate([
        { $match: { status: { $ne: 'graduated' } } },
        { $group: { _id: null, avg: { $avg: "$attendance" } } },
      ]),
      Student.aggregate([
        { $match: { status: { $ne: 'graduated' } } },
        { $group: { _id: null, totalFee: { $sum: "$totalFee" }, totalPaid: { $sum: "$paidAmount" }, totalDue: { $sum: "$dueAmount" } } }
      ]),
    ]);

    const feeData = feeAgg[0] || { totalFee: 0, totalPaid: 0, totalDue: 0 };

    // Recent 5 students
    const recentStudents = await Student.find({ status: { $ne: 'graduated' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Recent 5 payments
    const recentPayments = await Payment.find()
      .sort({ date: -1 })
      .limit(5)
      .populate("studentId", "name")
      .lean();

    return NextResponse.json({
      students: studentCount,
      teachers: teacherCount,
      revenue: revenueAgg[0]?.total ?? 0,
      attendance: Math.round(attendanceAgg[0]?.avg ?? 0),
      totalFee: feeData.totalFee,
      totalPaid: feeData.totalPaid,
      totalDue: feeData.totalDue,
      recentStudents,
      recentPayments,
    });
  } catch (err) {
    console.error("Stats API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
