import { NextResponse, type NextRequest } from "next/server";
import { rejectBorrowRequest } from "@/features/borrow";
import { toErrorResponse } from "@/lib/errors";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await rejectBorrowRequest(id, body.reason);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/admin/requests/:id/reject]", error);
    return toErrorResponse(error);
  }
}
