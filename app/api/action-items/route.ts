import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/action-items - Get all action items
export async function GET() {
  try {
    const actionItems = await prisma.actionItem.findMany({
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            date: true,
          },
        },
      },
    });

    return NextResponse.json(actionItems);
  } catch (error) {
    console.error("Error fetching action items:", error);
    return NextResponse.json(
      { error: "Failed to fetch action items" },
      { status: 500 }
    );
  }
}
