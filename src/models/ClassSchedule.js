import mongoose from "mongoose";

const ClassScheduleSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  subject: { type: String, required: true },
  grade: { type: String, required: true },
  section: { type: String, required: false },
  time: { type: String, required: true },
  room: { type: String, required: false }
}, { timestamps: true });

if (mongoose.models.ClassSchedule) {
  delete mongoose.models.ClassSchedule;
}
export default mongoose.model("ClassSchedule", ClassScheduleSchema);
