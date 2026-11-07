import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { startGoogleSignIn } from "@/modules/customers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  redirect(await startGoogleSignIn(request.nextUrl.searchParams.get("next")));
}
