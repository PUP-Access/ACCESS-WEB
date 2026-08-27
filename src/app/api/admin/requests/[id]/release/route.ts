import { NextResponse, type NextRequest } from "next/server";
import { releaseBorrowRequest } from "@/features/borrow";
import { toErrorResponse } from "@/lib/errors";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await releaseBorrowRequest(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/admin/requests/:id/release]", error);
    return toErrorResponse(error);
  }
}
