import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";

const handler = NextAuth(authOptions);

export async function GET(request, context) {
  try {
    return await handler(request, context);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request, context) {
  try {
    return await handler(request, context);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}