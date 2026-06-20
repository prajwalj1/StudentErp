import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  recipientRole: { type: String, enum: ["OWNER", "TEACHER", "STUDENT"], required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, refPath: "recipientModel", default: null },
  recipientModel: { type: String, enum: ["Student", "Teacher"], default: null },
  message: { type: String, required: true },
  link: { type: String, default: "" },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}
export default mongoose.model("Notification", NotificationSchema);
