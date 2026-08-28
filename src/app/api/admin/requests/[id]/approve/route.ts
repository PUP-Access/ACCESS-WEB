import { NextResponse, type NextRequest } from "next/server";
import { approveBorrowRequest } from "@/features/borrow";
import { toErrorResponse } from "@/lib/errors";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await approveBorrowRequest(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/admin/requests/:id/approve]", error);
    return toErrorResponse(error);
  }
}
