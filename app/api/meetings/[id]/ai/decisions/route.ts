import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDecisions, hashNotes } from "@/lib/ai";

// POST /api/meetings/[id]/ai/decisions - Generate AI decisions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the meeting
    const meeting = await prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    if (!meeting.rawNotes || meeting.rawNotes.trim() === "") {
      return NextResponse.json(
        { error: "No notes to analyze" },
        { status: 400 }
      );
    }

    // Check for cached output
    const notesHash = hashNotes(meeting.rawNotes);
    const existingOutput = await prisma.aIOutput.findFirst({
      where: {
        meetingId: id,
        type: "decisions",
        rawNotesHash: notesHash,
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingOutput) {
      // Return cached result
      return NextResponse.json({
        cached: true,
        ...existingOutput,
      });
    }

    // Generate new decisions
    const aiResponse = await generateDecisions(meeting.rawNotes);

    // Save the output
    const aiOutput = await prisma.aIOutput.create({
      data: {
        meetingId: id,
        type: "decisions",
        content: aiResponse.content,
        rawNotesHash: notesHash,
        promptTokens: aiResponse.promptTokens,
        completionTokens: aiResponse.completionTokens,
        model: aiResponse.model,
      },
    });

    return NextResponse.json({
      cached: false,
      ...aiOutput,
    });
  } catch (error) {
    console.error("Error generating decisions:", error);
    return NextResponse.json(
      { error: "Failed to generate decisions" },
      { status: 500 }
    );
  }
}
