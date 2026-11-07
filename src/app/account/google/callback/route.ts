import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { finishGoogleSignIn } from "@/modules/customers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  redirect(
    await finishGoogleSignIn({
      code: searchParams.get("code"),
      state: searchParams.get("state"),
      error: searchParams.get("error"),
    }),
  );
}
