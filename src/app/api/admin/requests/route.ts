import { NextResponse, type NextRequest } from "next/server";
import { getBorrowRequestsForAdmin } from "@/features/borrow";
import { toErrorResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const result = await getBorrowRequestsForAdmin({
      status: (searchParams.get("status") as never) ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/admin/requests]", error);
    return toErrorResponse(error);
  }
}
