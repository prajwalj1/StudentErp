import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import ClassFee from "@/models/ClassFee";
import Student from "@/models/Student";

const calcTotal = (terms) =>
  (terms || []).reduce((sum, t) => sum + (Number(t.totalFee) || 0), 0);

const syncStudents = async (grade, totalFee) => {
  const students = await Student.find({ grade });
  const ops = students.map(s => {
    const paidAmount = s.paidAmount || 0;
    const prevDue = s.previousDue || 0;
    const scholarship = s.scholarship || 0;
    const dueAmount = Math.max(0, totalFee + prevDue - scholarship - paidAmount);
    const feeStatus = dueAmount <= 0 ? "completed" : (paidAmount > 0 || prevDue > 0) ? "partial" : "pending";
    return {
      updateOne: {
        filter: { _id: s._id },
        update: { $set: { totalFee, dueAmount, feeStatus } }
      }
    };
  });
  if (ops.length > 0) await Student.bulkWrite(ops);
};

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();
    let fees = await ClassFee.find().sort({ grade: 1 }).lean();
    fees = fees.map(f => {
      if (f.terms && f.terms.length > 0) return f;
      if (f.categories && f.categories.length > 0) {
        return { ...f, terms: [{ name: 'General', categories: f.categories, totalFee: f.totalFee || 0 }] };
      }
      return f;
    });
    return NextResponse.json(fees);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();
    const body = await req.json();
    const terms = (body.terms || []).map(t => ({
      ...t,
      totalFee: (t.categories || []).reduce((s, c) => s + (Number(c.amount) || 0), 0)
    }));
    const totalFee = calcTotal(terms);

    const classFee = await ClassFee.create({ grade: body.grade, terms, totalFee });
    await syncStudents(body.grade, totalFee);

    return NextResponse.json(classFee, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();
    const body = await req.json();
    const { grade, terms } = body;

    if (!grade) {
      return NextResponse.json({ error: "grade is required" }, { status: 400 });
    }

    const updatedTerms = (terms || []).map(t => ({
      ...t,
      totalFee: (t.categories || []).reduce((s, c) => s + (Number(c.amount) || 0), 0)
    }));
    const totalFee = calcTotal(updatedTerms);

    const classFee = await ClassFee.findOneAndUpdate(
      { grade },
      { terms: updatedTerms, totalFee },
      { new: true, runValidators: true }
    );

    if (!classFee) {
      return NextResponse.json({ error: "Class fee not found" }, { status: 404 });
    }

    await syncStudents(grade, totalFee);

    return NextResponse.json(classFee);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get("grade");

    if (!grade) {
      return NextResponse.json({ error: "grade query param is required" }, { status: 400 });
    }

    await dbConnect();
    const deleted = await ClassFee.findOneAndDelete({ grade });
    if (!deleted) {
      return NextResponse.json({ error: "Class fee not found" }, { status: 404 });
    }

    const students = await Student.find({ grade });
    const ops = students.map(s => ({
      updateOne: {
        filter: { _id: s._id },
        update: { $set: { totalFee: 0, previousDue: 0, paidAmount: 0, scholarship: 0, dueAmount: 0, feeStatus: "pending" } }
      }
    }));
    if (ops.length > 0) await Student.bulkWrite(ops);

    return NextResponse.json({ message: "Class fee deleted" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
