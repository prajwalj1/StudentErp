import mongoose from "mongoose";
const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  grade: { type: String, required: true },
  section: { type: String, required: false },
  fatherName: { type: String, default: '' },
  fatherMobile: { type: String, default: '' },
  dob: { type: String, default: '' },
  address: { type: String, default: '' },
  attendance: { type: Number, default: 100 },
  rollNumber: { type: Number },
  totalFee: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  feeStatus: { type: String, enum: ["pending", "partial", "completed"], default: "pending" },
  status: { type: String, enum: ["active", "graduated"], default: "active" },
  graduatedYear: { type: String, default: '' },
});
// Ensure fresh schema on hot-reload (never use cached old schema)
if (mongoose.models.Student) {
  delete mongoose.models.Student;
}
export default mongoose.model("Student", StudentSchema);
