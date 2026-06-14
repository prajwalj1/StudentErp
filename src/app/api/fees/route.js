import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Payment from "@/models/Payment";
import ClassFee from "@/models/ClassFee";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Students see only their own fee info
    if (session.user.role === "STUDENT") {
      const [student, payments, rawClassFee] = await Promise.all([
        Student.findById(session.user.id).lean(),
        Payment.find({ studentId: session.user.id }).sort({ date: -1 }).lean(),
        ClassFee.findOne({ grade: (await Student.findById(session.user.id).select("grade").lean())?.grade }).lean(),
      ]);
      if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
      const classFee = rawClassFee
        ? rawClassFee.terms?.length > 0
          ? rawClassFee
          : rawClassFee.categories?.length > 0
            ? { ...rawClassFee, terms: [{ name: 'General', categories: rawClassFee.categories, totalFee: rawClassFee.totalFee || 0 }] }
            : rawClassFee
        : null;
      return NextResponse.json({
        student: { totalFee: student.totalFee, paidAmount: student.paidAmount, dueAmount: student.dueAmount, feeStatus: student.feeStatus },
        payments,
        classFee
      });
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let [students, payments, classFees] = await Promise.all([
      Student.find().sort({ name: 1 }).lean(),
      Payment.find().populate('studentId', 'name grade').sort({ date: -1 }).lean(),
      ClassFee.find().sort({ grade: 1 }).lean(),
    ]);
    classFees = classFees.map(f => {
      if (f.terms && f.terms.length > 0) return f;
      if (f.categories && f.categories.length > 0) {
        return { ...f, terms: [{ name: 'General', categories: f.categories, totalFee: f.totalFee || 0 }] };
      }
      return f;
    });

    const feeMap = {};
    classFees.forEach(cf => { feeMap[cf.grade] = cf.totalFee; });

    const bulkOps = [];
    const synced = students.map(s => {
      const classTotal = feeMap[s.grade];
      if (classTotal != null && s.totalFee !== classTotal) {
        const paidAmount = s.paidAmount || 0;
        const dueAmount = Math.max(0, classTotal - paidAmount);
        const feeStatus = paidAmount <= 0 ? "pending" : dueAmount <= 0 ? "completed" : "partial";
        bulkOps.push({
          updateOne: {
            filter: { _id: s._id },
            update: { $set: { totalFee: classTotal, dueAmount, feeStatus } }
          }
        });
        return { ...s, totalFee: classTotal, dueAmount, feeStatus };
      }
      if (classTotal != null) {
        const paidAmount = s.paidAmount || 0;
        const dueAmount = Math.max(0, classTotal - paidAmount);
        const feeStatus = paidAmount <= 0 ? "pending" : dueAmount <= 0 ? "completed" : "partial";
        if (s.dueAmount !== dueAmount || s.feeStatus !== feeStatus) {
          bulkOps.push({
            updateOne: {
              filter: { _id: s._id },
              update: { $set: { dueAmount, feeStatus } }
            }
          });
        }
        return { ...s, dueAmount, feeStatus };
      }
      return s;
    });

    if (bulkOps.length > 0) {
      await Student.bulkWrite(bulkOps);
    }

    return NextResponse.json({ students: synced, payments, classFees });
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
    const { studentId, amount } = body;

    if (!studentId || !amount) {
      return NextResponse.json({ error: "studentId and amount are required" }, { status: 400 });
    }

    const payment = await Payment.create({ studentId, amount, date: body.date || new Date() });

    const student = await Student.findById(studentId);
    if (student) {
      student.paidAmount = (student.paidAmount || 0) + amount;
      student.dueAmount = Math.max(0, (student.totalFee || 0) - student.paidAmount);
      student.feeStatus = student.paidAmount <= 0 ? "pending" : student.dueAmount <= 0 ? "completed" : "partial";
      await student.save();
    }

    const populated = await payment.populate('studentId', 'name grade');
    return NextResponse.json(populated, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
