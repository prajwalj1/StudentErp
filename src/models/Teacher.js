import mongoose from "mongoose";

const TeacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  teacherId: { type: String, required: true, unique: true }, // Added for teacher identification
  password: { type: String, required: true },
  role: { type: String, default: "TEACHER" }, // Explicitly define role
}, { timestamps: true });


if (mongoose.models.Teacher) {
  delete mongoose.models.Teacher;
}
export default mongoose.model("Teacher", TeacherSchema);