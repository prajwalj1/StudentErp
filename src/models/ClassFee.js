import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true }
}, { _id: false });

const TermSchema = new mongoose.Schema({
  name: { type: String, required: true },
  categories: [CategorySchema],
  totalFee: { type: Number, default: 0 }
}, { _id: false });

const ClassFeeSchema = new mongoose.Schema({
  grade: { type: String, required: true, unique: true },
  terms: [TermSchema],
  totalFee: { type: Number, default: 0 }
}, { timestamps: true });

if (mongoose.models.ClassFee) {
  delete mongoose.models.ClassFee;
}
export default mongoose.model("ClassFee", ClassFeeSchema);
