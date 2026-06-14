import mongoose from "mongoose";

const ExamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  grade: { type: String, required: true },
  subject: { type: String, required: true },
  status: { type: String, enum: ["Upcoming", "Completed", "Published"], default: "Upcoming" },
  questionPaper: { type: String }
}, { timestamps: true });

if (mongoose.models.Exam) {
  delete mongoose.models.Exam;
}
export default mongoose.model("Exam", ExamSchema);
