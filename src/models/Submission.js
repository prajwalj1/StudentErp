import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  notes: { type: String, default: '' },
  grade: { type: Number, default: null },
  feedback: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["submitted", "graded", "returned"], default: "submitted" },
});

SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

if (mongoose.models.Submission) {
  delete mongoose.models.Submission;
}
export default mongoose.model("Submission", SubmissionSchema);
