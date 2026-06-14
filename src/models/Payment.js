import mongoose from "mongoose";
const PaymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  method: { type: String, enum: ["cash", "esewa"], default: "cash" },
  status: { type: String, enum: ["completed", "pending", "failed"], default: "completed" },
  referenceId: { type: String, default: "" },
  transactionId: { type: String, default: "" },
  installment: { type: String, default: "" },
});
if (mongoose.models.Payment) {
  delete mongoose.models.Payment;
}
export default mongoose.model("Payment", PaymentSchema);