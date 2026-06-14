import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import LessonPlan from "@/models/LessonPlan";

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const deleted = await LessonPlan.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Lesson plan not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Lesson plan deleted" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
