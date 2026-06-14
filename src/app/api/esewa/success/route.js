import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Student from "@/models/Student";

export async function GET(req) {
  try {
    const { searchParams } = req.nextUrl;
    const encodedData = searchParams.get("data");

    if (!encodedData) {
      return NextResponse.redirect(new URL("/student/fees?payment=error", req.url));
    }

    const decodedJson = Buffer.from(encodedData, "base64").toString("utf-8");
    let data;
    try {
      data = JSON.parse(decodedJson);
    } catch {
      return NextResponse.redirect(new URL("/student/fees?payment=error", req.url));
    }

    const { status, total_amount, transaction_uuid, product_code } = data;

    if (status !== "COMPLETE") {
      const payment = await Payment.findById(transaction_uuid).catch(() => null);
      if (payment) {
        payment.status = "failed";
        await payment.save().catch(() => {});
      }
      return NextResponse.redirect(new URL(`/student/fees?payment=failed&ref=${transaction_uuid}`, req.url));
    }

    const productCode = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";
    const statusCheckUrl = process.env.ESEWA_STATUS_CHECK_URL || "https://rc.esewa.com.np/api/epay/transaction/status/";

    const totalAmountNum = String(Math.round(Number(total_amount)));
    const checkRes = await fetch(
      `${statusCheckUrl}?product_code=${productCode}&total_amount=${totalAmountNum}&transaction_uuid=${transaction_uuid}`
    );
    const checkData = await checkRes.json();

    if (checkData.status !== "COMPLETE") {
      return NextResponse.redirect(new URL("/student/fees?payment=failed", req.url));
    }

    await dbConnect();

    const payment = await Payment.findById(transaction_uuid);
    if (!payment || payment.status !== "pending") {
      return NextResponse.redirect(new URL("/student/fees?payment=error", req.url));
    }

    payment.status = "completed";
    payment.referenceId = checkData.ref_id || "";
    payment.transactionId = data.transaction_code || "";
    payment.date = new Date();
    await payment.save();

    const student = await Student.findById(payment.studentId);
    if (student) {
      student.paidAmount = (student.paidAmount || 0) + payment.amount;
      student.dueAmount = Math.max(0, (student.totalFee || 0) - student.paidAmount);
      student.feeStatus = student.paidAmount <= 0 ? "pending" : student.dueAmount <= 0 ? "completed" : "partial";
      await student.save();
    }

    return NextResponse.redirect(new URL("/student/fees?payment=success", req.url));
  } catch (err) {
    return NextResponse.redirect(new URL("/student/fees?payment=error", req.url));
  }
}
