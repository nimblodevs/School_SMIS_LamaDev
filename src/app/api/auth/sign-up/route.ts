import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Public registration is disabled. Ask a school administrator to create your account.",
    },
    { status: 403 }
  );
}
