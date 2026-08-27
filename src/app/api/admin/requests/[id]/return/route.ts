import { NextResponse, type NextRequest } from "next/server";
import { returnBorrowRequest } from "@/features/borrow";
import { toErrorResponse } from "@/lib/errors";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await returnBorrowRequest(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/admin/requests/:id/return]", error);
    return toErrorResponse(error);
  }
}
