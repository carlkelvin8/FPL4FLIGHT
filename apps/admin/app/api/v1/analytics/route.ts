/**
 * /api/v1/analytics — Analytics API stub.
 * Full implementation (aggregates, CSV export) in Tasks 24–25.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Analytics API — implemented in Tasks 24–25." },
    { status: 200 },
  );
}
