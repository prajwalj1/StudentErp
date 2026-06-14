import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import bcrypt from "bcryptjs";

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const body = await req.json();

    const updateFields = {};
    const allowedFields = ["name", "studentId", "email", "grade", "section", "fatherName", "fatherMobile", "dob", "address"];
    allowedFields.forEach(f => {
      if (body[f] !== undefined) updateFields[f] = body[f];
    });

    if (body.password && body.password.trim() !== "") {
      updateFields.password = await bcrypt.hash(body.password, 10);
    }

    const updated = await Student.findByIdAndUpdate(id, { $set: updateFields }, { new: true, runValidators: true }).lean();
    if (!updated) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "Student ID or Email already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
