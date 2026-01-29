import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateActions, hashNotes } from "@/lib/ai";

// POST /api/meetings/[id]/ai/actions - Generate AI action items
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
        type: "actions",
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

    // Generate new action items
    const aiResponse = await generateActions(meeting.rawNotes);

    // Save the output
    const aiOutput = await prisma.aIOutput.create({
      data: {
        meetingId: id,
        type: "actions",
        content: aiResponse.content,
        rawNotesHash: notesHash,
        promptTokens: aiResponse.promptTokens,
        completionTokens: aiResponse.completionTokens,
        model: aiResponse.model,
      },
    });

    // Parse action items and create them in the database
    try {
      const actions = JSON.parse(aiResponse.content);
      if (Array.isArray(actions)) {
        const actionItems = actions.map((action: {
          description: string;
          owner?: string | null;
          dueDate?: string | null;
        }) => ({
          meetingId: id,
          description: action.description,
          owner: action.owner || null,
          dueDate: action.dueDate ? new Date(action.dueDate) : null,
          status: "open",
        }));

        await prisma.actionItem.createMany({
          data: actionItems,
        });
      }
    } catch (parseError) {
      console.error("Error parsing action items:", parseError);
      // Continue anyway, the raw JSON is stored
    }

    return NextResponse.json({
      cached: false,
      ...aiOutput,
    });
  } catch (error) {
    console.error("Error generating action items:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate action items";
    return NextResponse.json(
      { error: errorMessage, details: error },
      { status: 500 }
    );
  }
}
