import mongoose from "mongoose";

const LessonPlanSchema = new mongoose.Schema({
  classScheduleId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassSchedule", required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  grade: { type: String, required: true },
  section: { type: String },
  subject: { type: String, required: true },
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },
  topic: { type: String, required: true },
  objectives: { type: String },
  activities: { type: String },
  materials: { type: String },
  assessment: { type: String },
  status: { type: String, enum: ["draft", "published"], default: "draft" }
}, { timestamps: true });

if (mongoose.models.LessonPlan) {
  delete mongoose.models.LessonPlan;
}
export default mongoose.model("LessonPlan", LessonPlanSchema);
