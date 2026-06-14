import mongoose from "mongoose";

const MarkSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  classScheduleId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassSchedule", required: true },
  examType: { type: String, required: true }, // e.g. "Final Term", "Mid Term"
  marksObtained: { type: Number, required: true },
  totalMarks: { type: Number, required: true, default: 100 }
}, { timestamps: true });

if (mongoose.models.Mark) {
  delete mongoose.models.Mark;
}
export default mongoose.model("Mark", MarkSchema);
