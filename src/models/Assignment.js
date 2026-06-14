import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  classId: { type: String, required: true }, // Using string for Grade/Class reference
  dueDate: { type: Date, required: true },
  submissions: { type: Number, default: 0 },
  total: { type: Number, default: 30 },
  status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' }
}, { timestamps: true });

if (mongoose.models.Assignment) {
  delete mongoose.models.Assignment;
}
export default mongoose.model("Assignment", AssignmentSchema);
