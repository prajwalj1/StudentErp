import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import bcrypt from "bcryptjs";
import { validate, studentSchema } from "@/lib/validate";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "OWNER" && session.user.role !== "TEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const students = await Student.find().select('-password').sort({ name: 1 }).lean();

    try {
      const groups = {};
      students.forEach(s => {
        const key = `${s.grade}|${s.section || ''}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(s);
      });

      const bulkOps = [];
      Object.values(groups).forEach(group => {
        group.forEach((s, idx) => {
          const roll = idx + 1;
          if (!s.rollNumber || s.rollNumber !== roll) {
            bulkOps.push({
              updateOne: {
                filter: { _id: s._id },
                update: { $set: { rollNumber: roll } }
              }
            });
            s.rollNumber = roll;
          }
        });
      });

      if (bulkOps.length > 0) {
        await Student.bulkWrite(bulkOps);
      }
    } catch (_) {
      // Roll number backfill is non-critical; serve students regardless
    }

    return NextResponse.json(students);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "OWNER" && session.user.role !== "TEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    let { name, studentId, email, password, grade, section, fatherName, fatherMobile, dob, address } = body;

    // Auto-generate studentId, email, password when missing (teacher add)
    if (!studentId) {
      studentId = `STU${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }
    if (!email) {
      email = `${studentId.toLowerCase()}@school.com`;
    }
    if (!password) {
      password = 'student123';
    }

    const validation = validate(studentSchema)({ name, studentId, email, grade, password, section });
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const q = { grade: body.grade };
    if (body.section) {
      q.section = body.section;
    }

    const existing = await Student.find(q).sort({ name: 1 });
    const all = [...existing.map(s => ({ _id: s._id, name: s.name })), { _id: null, name: body.name }];
    all.sort((a, b) => a.name.localeCompare(b.name));

    const updates = [];
    let rollNumber = null;
    all.forEach((entry, idx) => {
      const roll = idx + 1;
      if (entry._id === null) {
        rollNumber = roll;
      } else {
        updates.push(Student.findByIdAndUpdate(entry._id, { rollNumber: roll }));
      }
    });

    await Promise.all(updates);

    const newStudent = await Student.create({
      name,
      studentId,
      email,
      password: hashedPassword,
      grade,
      section,
      fatherName,
      fatherMobile,
      dob,
      address,
      rollNumber,
      attendance: 100,
    });

    return NextResponse.json(newStudent, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "Student ID or Email already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
