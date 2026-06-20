import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Payment from "@/models/Payment";
import ClassFee from "@/models/ClassFee";
import { validate, feeSchema } from "@/lib/validate";

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

      // Sync student's fee data with current grade's fee structure
      let { totalFee, paidAmount, dueAmount, feeStatus } = student;
      if (classFee && classFee.totalFee != null) {
        totalFee = classFee.totalFee;
        paidAmount = student.paidAmount || 0;
        const prevDue = student.previousDue || 0;
        const scholarship = student.scholarship || 0;
        dueAmount = Math.max(0, totalFee + prevDue - scholarship - paidAmount);
        feeStatus = dueAmount <= 0 ? "completed" : (paidAmount > 0 || prevDue > 0) ? "partial" : "pending";
        await Student.updateOne(
          { _id: student._id },
          { $set: { totalFee, dueAmount, feeStatus } }
        );
      }

      return NextResponse.json({
        student: { totalFee, paidAmount, previousDue: student.previousDue || 0, dueAmount, feeStatus },
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
      if (classTotal != null) {
        const paidAmount = s.paidAmount || 0;
        const prevDue = s.previousDue || 0;
        const scholarship = s.scholarship || 0;
        const dueAmount = Math.max(0, classTotal + prevDue - scholarship - paidAmount);
        const feeStatus = dueAmount <= 0 ? "completed" : (paidAmount > 0 || prevDue > 0) ? "partial" : "pending";
        if (s.totalFee !== classTotal || s.dueAmount !== dueAmount || s.feeStatus !== feeStatus) {
          bulkOps.push({
            updateOne: {
              filter: { _id: s._id },
              update: { $set: { totalFee: classTotal, dueAmount, feeStatus } }
            }
          });
        }
        return { ...s, totalFee: classTotal, dueAmount, feeStatus };
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

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const { studentId, amount } = payment;
    await Payment.findByIdAndDelete(id);

    // Recalculate student's paidAmount from remaining payments
    const remaining = await Payment.find({ studentId, status: "completed" });
    const totalPaid = remaining.reduce((sum, p) => sum + (p.amount || 0), 0);

    const student = await Student.findById(studentId).select("totalFee scholarship previousDue").lean();
    if (student) {
      const netTotal = (student.totalFee || 0) + (student.previousDue || 0) - (student.scholarship || 0);
      const newDue = Math.max(0, netTotal - totalPaid);
      const newStatus = newDue <= 0 ? "completed" : (totalPaid > 0 || (student.previousDue || 0) > 0) ? "partial" : "pending";
      await Student.updateOne({ _id: studentId }, { $set: { paidAmount: totalPaid, dueAmount: newDue, feeStatus: newStatus } });
    }

    return NextResponse.json({ success: true, deletedAmount: amount });
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const { totalFee, scholarship, paidAmount, previousDue } = await req.json();
    const student = await Student.findById(id).select("totalFee scholarship paidAmount previousDue").lean();
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const newTotal = totalFee !== undefined ? totalFee : student.totalFee;
    const newScholarship = scholarship !== undefined ? scholarship : student.scholarship;
    const newPaid = paidAmount !== undefined ? paidAmount : student.paidAmount;
    const newPreviousDue = previousDue !== undefined ? previousDue : student.previousDue;
    const netTotal = (newTotal || 0) + (newPreviousDue || 0) - (newScholarship || 0);
    const newDue = Math.max(0, netTotal - (newPaid || 0));
    const newStatus = newDue <= 0 ? "completed" : ((newPaid || 0) > 0 || (newPreviousDue || 0) > 0) ? "partial" : "pending";

    await Student.updateOne({ _id: id }, { $set: { totalFee: newTotal, scholarship: newScholarship, paidAmount: newPaid || 0, previousDue: newPreviousDue, dueAmount: newDue, feeStatus: newStatus } });

    return NextResponse.json({
      totalFee: newTotal,
      scholarship: newScholarship,
      paidAmount: newPaid || 0,
      previousDue: newPreviousDue,
      dueAmount: newDue,
      feeStatus: newStatus,
    });
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
    const validation = validate(feeSchema)(body);
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
    }
    const { studentId, amount } = body;

    if (!studentId || !amount) {
      return NextResponse.json({ error: "studentId and amount are required" }, { status: 400 });
    }

    const payment = await Payment.create({ studentId, amount, date: body.date || new Date() });

    const student = await Student.findById(studentId).select("totalFee scholarship paidAmount previousDue").lean();
    if (student) {
      const newPaid = (student.paidAmount || 0) + amount;
      const prevDue = student.previousDue || 0;
      const netTotal = (student.totalFee || 0) + prevDue - (student.scholarship || 0);
      const newDue = Math.max(0, netTotal - newPaid);
      const newStatus = newDue <= 0 ? "completed" : (newPaid > 0 || prevDue > 0) ? "partial" : "pending";
      await Student.updateOne({ _id: studentId }, { $set: { paidAmount: newPaid, dueAmount: newDue, feeStatus: newStatus } });
    }

    const populated = await payment.populate('studentId', 'name grade');
    return NextResponse.json(populated, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
