import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSummary, hashNotes } from "@/lib/ai";

// POST /api/meetings/[id]/ai/summary - Generate AI summary
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
        { error: "No notes to summarize" },
        { status: 400 }
      );
    }

    // Check for cached output
    const notesHash = hashNotes(meeting.rawNotes);
    const existingOutput = await prisma.aIOutput.findFirst({
      where: {
        meetingId: id,
        type: "summary",
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

    // Generate new summary
    const aiResponse = await generateSummary(meeting.rawNotes);

    // Save the output
    const aiOutput = await prisma.aIOutput.create({
      data: {
        meetingId: id,
        type: "summary",
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
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
