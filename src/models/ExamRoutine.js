import mongoose from "mongoose";

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String },
  fullMarks: { type: Number, default: 100 },
  passMarks: { type: Number, default: 40 },
});

const TermSchema = new mongoose.Schema({
  name: { type: String, enum: ["First Term", "Second Term", "Third Term"], required: true },
  startTime: { type: String },
  endTime: { type: String },
  subjects: [SubjectSchema],
});

const ExamRoutineSchema = new mongoose.Schema({
  grade: { type: String, required: true, unique: true },
  terms: [TermSchema],
}, { timestamps: true });

if (mongoose.models.ExamRoutine) {
  delete mongoose.models.ExamRoutine;
}
export default mongoose.model("ExamRoutine", ExamRoutineSchema);
