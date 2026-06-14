import mongoose from "mongoose";

const NoticeSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  content: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  expiryDate: { type: Date },
  targetAudience: { type: String, enum: ["all", "teacher", "student"], default: "all" },
  grade: { type: String, default: "" },
  createdByName: { type: String, required: true },
  createdByRole: { type: String, enum: ["OWNER", "TEACHER"], required: true },
  createdAt: { type: Date, default: Date.now }
});

if (mongoose.models.Notice) {
  delete mongoose.models.Notice;
}
export default mongoose.model("Notice", NoticeSchema);
