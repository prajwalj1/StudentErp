import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Mark from "@/models/Mark";
import Student from "@/models/Student";
import ClassSchedule from "@/models/ClassSchedule";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const classScheduleId = searchParams.get("classScheduleId");
    const examType = searchParams.get("examType");
    const grade = searchParams.get("grade");

    await dbConnect();

    const filter = {};
    if (classScheduleId) filter.classScheduleId = classScheduleId;
    if (examType) filter.examType = examType;
    if (session.user.role === "STUDENT") {
      filter.studentId = session.user.id;
    }
    
    let marks = await Mark.find(filter)
      .populate("studentId", "name grade section rollNumber fatherName fatherMobile")
      .populate("classScheduleId", "subject grade section teacherId")
      .lean();

    if (grade && grade !== "All") {
      marks = marks.filter(m => m.studentId && m.studentId.grade === grade);
    }

    return NextResponse.json(marks);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { classScheduleId, examType, marksData } = await req.json();

    if (!classScheduleId || !examType || !Array.isArray(marksData)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Process marksData [{ studentId, marksObtained, totalMarks }]
    const operations = marksData.map(data => ({
      updateOne: {
        filter: { studentId: data.studentId, classScheduleId, examType },
        update: { $set: { marksObtained: data.marksObtained, totalMarks: data.totalMarks || 100 } },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await Mark.bulkWrite(operations);
    }

    return NextResponse.json({ message: "Marks saved successfully" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
