/**
 * /api/v1/users — User management API stub.
 * Full implementation (search, pagination, role management) in Task 27.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Users API — implemented in Task 27." },
    { status: 200 },
  );
}
