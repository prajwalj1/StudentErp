import mongoose from "mongoose";

const SubscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  subscribedAt: { type: Date, default: Date.now }
});

if (mongoose.models.Subscriber) {
  delete mongoose.models.Subscriber;
}
export default mongoose.model("Subscriber", SubscriberSchema);
