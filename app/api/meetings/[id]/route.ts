import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/meetings/[id] - Get a single meeting
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        aiOutputs: {
          orderBy: { createdAt: "desc" },
        },
        actionItems: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting" },
      { status: 500 }
    );
  }
}

// PATCH /api/meetings/[id] - Update a meeting
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, date, participants, rawNotes } = body;

    const updateData: {
      title?: string;
      date?: Date;
      participants?: string;
      rawNotes?: string;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (date !== undefined) updateData.date = new Date(date);
    if (participants !== undefined) updateData.participants = participants;
    if (rawNotes !== undefined) updateData.rawNotes = rawNotes;

    const meeting = await prisma.meeting.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json(
      { error: "Failed to update meeting" },
      { status: 500 }
    );
  }
}
