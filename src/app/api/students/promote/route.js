import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Mark from "@/models/Mark";
import ClassSchedule from "@/models/ClassSchedule";
import ClassFee from "@/models/ClassFee";

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const students = await Student.find().select('-password').lean();

    // Collect unique old grades before promotion (for mark deletion)
    const oldGrades = [...new Set(students.map(s => s.grade).filter(Boolean))];

    const promoteUpdates = [];
    const graduateUpdates = [];

    for (const student of students) {
      const digits = (student.grade || '').replace(/[^0-9]/g, '');
      const gradeNum = parseInt(digits, 10);
      if (isNaN(gradeNum)) continue;

      if (gradeNum >= 12) {
        graduateUpdates.push({
          updateOne: {
            filter: { _id: student._id },
            update: { $set: { status: 'graduated', graduatedYear: String(new Date().getFullYear()), rollNumber: null } }
          }
        });
      } else {
        const nextGrade = student.grade.replace(digits, String(gradeNum + 1));
        const oldPreviousDue = student.previousDue || 0;
        const currentUnpaid = Math.max(0, (student.totalFee || 0) - (student.scholarship || 0) - (student.paidAmount || 0));
        const newPreviousDue = oldPreviousDue + currentUnpaid;
        promoteUpdates.push({
          updateOne: {
            filter: { _id: student._id },
            update: { $set: { grade: nextGrade, rollNumber: null, paidAmount: 0, previousDue: newPreviousDue, scholarship: 0 } }
          }
        });
      }
    }

    const parts = [];
    if (promoteUpdates.length > 0) {
      await Student.bulkWrite(promoteUpdates);
      parts.push(`${promoteUpdates.length} promoted`);
    }
    if (graduateUpdates.length > 0) {
      await Student.bulkWrite(graduateUpdates);
      parts.push(`${graduateUpdates.length} graduated (Grade 12)`);
    }

    // Sync promoted students' fees with their new grade's fee structure
    if (promoteUpdates.length > 0) {
      const classFees = await ClassFee.find().lean();
      const feeMap = {};
      classFees.forEach(cf => { feeMap[cf.grade] = cf.totalFee; });

      const feeUpdates = [];
      for (const update of promoteUpdates) {
        const nextGrade = update.updateOne.update.$set.grade;
        const classTotal = feeMap[nextGrade];
        if (classTotal != null) {
          feeUpdates.push({
            updateOne: {
              filter: update.updateOne.filter,
              update: { $set: { totalFee: classTotal } }
            }
          });
        }
      }

      if (feeUpdates.length > 0) {
        await Student.bulkWrite(feeUpdates);
        parts.push(`${feeUpdates.length} fees synced`);
      }

      // Recalculate due/fee-status for all promoted students
      const promotedStudents = await Student.find({
        _id: { $in: promoteUpdates.map(u => u.updateOne.filter._id) }
      }).lean();

      const statusUpdates = [];
      for (const s of promotedStudents) {
        const paid = s.paidAmount || 0;
        const total = s.totalFee || 0;
        const prevDue = s.previousDue || 0;
        const due = Math.max(0, total + prevDue - paid);
        const status = due <= 0 ? "completed" : (paid > 0 || prevDue > 0) ? "partial" : "pending";
        statusUpdates.push({
          updateOne: {
            filter: { _id: s._id },
            update: { $set: { dueAmount: due, feeStatus: status } }
          }
        });
      }
      if (statusUpdates.length > 0) {
        await Student.bulkWrite(statusUpdates);
      }
    }

    // Delete marks for old grades after promotion
    if (oldGrades.length > 0) {
      const classSchedules = await ClassSchedule.find({ grade: { $in: oldGrades } }).select('_id').lean();
      const csIds = classSchedules.map(cs => cs._id);
      if (csIds.length > 0) {
        const deleteResult = await Mark.deleteMany({ classScheduleId: { $in: csIds } });
        if (deleteResult.deletedCount > 0) {
          parts.push(`${deleteResult.deletedCount} old marks cleared`);
        }
      }
    }

    if (parts.length === 0) {
      return NextResponse.json({ message: "No students to promote." });
    }

    return NextResponse.json({ message: parts.join(', ') + '.' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
