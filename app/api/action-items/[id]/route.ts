import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/action-items/[id] - Update an action item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { description, owner, dueDate, status } = body;

    const updateData: {
      description?: string;
      owner?: string | null;
      dueDate?: Date | null;
      status?: string;
    } = {};

    if (description !== undefined) updateData.description = description;
    if (owner !== undefined) updateData.owner = owner;
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (status !== undefined) updateData.status = status;

    const actionItem = await prisma.actionItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(actionItem);
  } catch (error) {
    console.error("Error updating action item:", error);
    return NextResponse.json(
      { error: "Failed to update action item" },
      { status: 500 }
    );
  }
}
