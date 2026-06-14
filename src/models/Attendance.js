import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  grade: { type: String, required: true },
  section: { type: String, required: false },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  students: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    status: { type: String, enum: ['Present', 'Absent'], required: true }
  }]
}, { timestamps: true });

if (mongoose.models.Attendance) {
  delete mongoose.models.Attendance;
}
export default mongoose.model("Attendance", AttendanceSchema);
