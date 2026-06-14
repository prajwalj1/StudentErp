import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Student from "@/models/Student";

function generateSignature(totalAmount, transactionUuid, productCode, secretKey) {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(message);
  return hmac.digest("base64");
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const student = await Student.findById(session.user.id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (amount > student.dueAmount) {
      return NextResponse.json({ error: "Amount exceeds due amount" }, { status: 400 });
    }

    const payment = await Payment.create({
      studentId: student._id,
      amount,
      method: "esewa",
      status: "pending",
    });

    const paymentId = payment._id.toString();
    const transactionUuid = paymentId;
    const totalAmount = String(amount);
    const productCode = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";
    const secretKey = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
    const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const signature = generateSignature(totalAmount, transactionUuid, productCode, secretKey);

    return NextResponse.json({
      success: true,
      formData: {
        amount: totalAmount,
        tax_amount: "0",
        total_amount: totalAmount,
        transaction_uuid: transactionUuid,
        product_code: productCode,
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url: `${siteUrl}/api/esewa/success`,
        failure_url: `${siteUrl}/student/fees?payment=failed`,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature,
      },
      gatewayUrl: process.env.ESEWA_GATEWAY_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
