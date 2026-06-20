import { NextResponse } from "next/server";
import os from "os";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const cpus = os.cpus();
    const totalCpu = cpus.length || 1;
    const totalTick = cpus.reduce((sum, cpu) => {
      const t = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      return sum + t;
    }, 0);
    const idleTick = cpus.reduce((sum, cpu) => sum + (cpu.times.idle || 0), 0);
    const cpuLoad = totalTick > 0 ? Math.round(((totalTick - idleTick) / totalTick) * 100) : 0;

    const totalMem = os.totalmem() || 1;
    const freeMem = os.freemem();
    const memPct = Math.round(((totalMem - freeMem) / totalMem) * 100);

    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);

    const processMem = process.memoryUsage();
    const heapPct = processMem.heapTotal > 0 ? Math.round((processMem.heapUsed / processMem.heapTotal) * 100) : 0;

    const mongoState = mongoose.connection.readyState;
    const mongoStatus = mongoState === 1 ? "connected" : mongoState === 2 ? "connecting" : "disconnected";

    return NextResponse.json({
      cpu: cpuLoad,
      memory: memPct,
      heap: heapPct,
      uptime: `${days}d ${hours}h`,
      database: mongoStatus,
      node: process.version,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
