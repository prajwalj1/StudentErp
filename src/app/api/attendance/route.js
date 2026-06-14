import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Teacher from "@/models/Teacher";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "OWNER" && session.user.role !== "TEACHER" && session.user.role !== "STUDENT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    let query = {};
    if (session.user.role === "TEACHER") {
      const teacher = await Teacher.findOne({ email: session.user.email });
      if (!teacher) return NextResponse.json([]);
      query.teacherId = teacher._id;
    } else if (session.user.role === "STUDENT") {
      query["students.studentId"] = session.user.id;
    }

    const records = await Attendance.find(query)
      .populate('teacherId', 'name')
      .populate('students.studentId', 'name')
      .sort({ date: -1 })
      .lean();
      
    return NextResponse.json(records);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Only teachers and owners can mark attendance" }, { status: 401 });
    }

    await dbConnect();
    
    const body = await req.json();
    const { date, grade, section, students } = body;

    if (!date || !grade) {
      return NextResponse.json({ error: "Date and grade are required" }, { status: 400 });
    }

    // Normalize date to start of day (avoid timezone shift)
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: "Invalid date value" }, { status: 400 });
    }
    const normalizedDate = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));

    // Prevent future dates
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    if (normalizedDate > todayUTC) {
      return NextResponse.json({ error: "Cannot mark attendance for a future date" }, { status: 400 });
    }

    // Check if attendance already exists for this class/date
    const existing = await Attendance.findOne({ date: normalizedDate, grade, section });
    if (existing) {
      existing.students = students;
      existing.date = normalizedDate;
      await existing.save();
      return NextResponse.json(existing);
    }

    const recordData = { date: normalizedDate, grade, section, students };
    if (session.user.role === "TEACHER") {
      const teacher = await Teacher.findOne({ email: session.user.email });
      if (!teacher) return NextResponse.json({ error: "Teacher record not found" }, { status: 404 });
      recordData.teacherId = teacher._id;
    }

    const newRecord = await Attendance.create(recordData);

    return NextResponse.json(newRecord, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
