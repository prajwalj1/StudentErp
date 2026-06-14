import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const students = await Student.find().lean();
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
        promoteUpdates.push({
          updateOne: {
            filter: { _id: student._id },
            update: { $set: { grade: nextGrade, rollNumber: null } }
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

    if (parts.length === 0) {
      return NextResponse.json({ message: "No students to promote." });
    }

    return NextResponse.json({ message: parts.join(', ') + '.' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
