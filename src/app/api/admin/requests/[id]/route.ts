import { NextResponse, type NextRequest } from "next/server";
import { getBorrowRequestById } from "@/features/borrow";
import { toErrorResponse } from "@/lib/errors";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await getBorrowRequestById(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/admin/requests/:id]", error);
    return toErrorResponse(error);
  }
}
