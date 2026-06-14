import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import ClassSchedule from "@/models/ClassSchedule";

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const deletedSchedule = await ClassSchedule.findByIdAndDelete(id);

    if (!deletedSchedule) {
      return NextResponse.json({ error: "Class schedule not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Class schedule deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
