"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MeetingDetailSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/ToastProvider";

interface Meeting {
  id: string;
  title: string;
  date: string;
  participants: string;
  rawNotes: string;
}

interface AIOutput {
  id: string;
  type: string;
  content: string;
  promptTokens: number;
  completionTokens: number;
  model: string;
  cached?: boolean;
}

interface ActionItem {
  id: string;
  description: string;
  owner: string | null;
  dueDate: string | null;
  status: string;
}

export default function MeetingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { showToast } = useToast();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [activeTab, setActiveTab] = useState<"summary" | "decisions" | "actions">("summary");
  const [outputs, setOutputs] = useState<Record<string, AIOutput>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  // Debounced autosave
  useEffect(() => {
    if (!meeting) return;

    // Don't autosave if notes haven't changed from the fetched version
    if (notes === meeting.rawNotes) return;

    setSaveStatus("saving");
    const timeoutId = setTimeout(() => {
      saveNotes();
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [notes]);

  const fetchMeeting = async () => {
    try {
      const response = await fetch(`/api/meetings/${id}`);
      const data = await response.json();
      setMeeting(data);
      setNotes(data.rawNotes || "");
      setActionItems(data.actionItems || []);

      // Load existing AI outputs
      const outputsMap: Record<string, AIOutput> = {};
      data.aiOutputs?.forEach((output: AIOutput) => {
        outputsMap[output.type] = output;
      });
      setOutputs(outputsMap);
    } catch (error) {
      console.error("Error fetching meeting:", error);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    setSaveStatus("saving");

    // Create a minimum delay of 1 second for visual feedback
    const minDelay = new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Wait for both the save and the minimum delay
      await Promise.all([
        fetch(`/api/meetings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawNotes: notes }),
        }),
        minDelay
      ]);

      setSaveStatus("saved");
      showToast("Notes saved successfully", "success");
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Error saving notes:", error);
      setSaveStatus("error");
      showToast("Failed to save notes", "error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  };

  const generateAI = async (type: "summary" | "decisions" | "actions") => {
    setLoadingStates({ ...loadingStates, [type]: true });
    setErrors({ ...errors, [type]: "" });

    try {
      const response = await fetch(`/api/meetings/${id}/ai/${type}`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate");
      }

      const data = await response.json();
      setOutputs({ ...outputs, [type]: data });

      // Show success toast
      const typeName = type.charAt(0).toUpperCase() + type.slice(1);
      showToast(
        data.cached ? `${typeName} loaded from cache` : `${typeName} generated successfully`,
        "success"
      );

      // Refresh action items if we generated actions
      if (type === "actions") {
        fetchMeeting();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate";
      setErrors({ ...errors, [type]: errorMessage });
      showToast(errorMessage, "error");
    } finally {
      setLoadingStates({ ...loadingStates, [type]: false });
    }
  };

  const updateActionItem = async (itemId: string, updates: Partial<ActionItem>) => {
    try {
      await fetch(`/api/action-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      fetchMeeting();
      showToast(
        updates.status === "done" ? "Action item marked as done" : "Action item marked as open",
        "success"
      );
    } catch (error) {
      console.error("Error updating action item:", error);
      showToast("Failed to update action item", "error");
    }
  };

  if (!meeting) {
    return <MeetingDetailSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{meeting.title}</h1>
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {new Date(meeting.date).toLocaleDateString()} • {meeting.participants}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Notes Editor */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Meeting Notes</h2>
              {saveStatus !== "idle" && (
                <span className={`text-xs px-2 py-1 rounded ${
                  saveStatus === "saving"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : saveStatus === "saved"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                }`}>
                  {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Error saving"}
                </span>
              )}
            </div>
            <button
              onClick={saveNotes}
              disabled={saving}
              className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600"
            >
              Save
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 font-mono text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="Enter your meeting notes here..."
          />
        </div>

        {/* Right Panel: AI Outputs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {(["summary", "decisions", "actions"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <button
                onClick={() => generateAI(activeTab)}
                disabled={loadingStates[activeTab]}
                className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600"
              >
                {loadingStates[activeTab] ? "Generating..." : `Generate ${activeTab}`}
              </button>
              {outputs[activeTab] && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {outputs[activeTab].cached && <span className="text-green-600 dark:text-green-400 mr-2">Cached</span>}
                  Tokens: {outputs[activeTab].promptTokens} in / {outputs[activeTab].completionTokens} out
                </div>
              )}
            </div>

            {errors[activeTab] && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                {errors[activeTab]}
              </div>
            )}

            {/* Content Display */}
            <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-gray-900 dark:prose-p:text-gray-100 prose-ul:text-gray-900 dark:prose-ul:text-gray-100 prose-ol:text-gray-900 dark:prose-ol:text-gray-100 prose-table:text-gray-900 dark:prose-table:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
              {activeTab === "summary" && outputs.summary && (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {outputs.summary.content}
                </ReactMarkdown>
              )}

              {activeTab === "decisions" && outputs.decisions && (
                <div className="space-y-2">
                  {(() => {
                    try {
                      // Strip markdown code fences if present
                      let content = outputs.decisions.content;
                      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

                      const decisions = JSON.parse(content);
                      return decisions.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-gray-900 dark:text-gray-100">
                          {decisions.map((decision: string, i: number) => (
                            <li key={i}>{decision}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No decisions found</p>
                      );
                    } catch {
                      return <div className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{outputs.decisions.content}</div>;
                    }
                  })()}
                </div>
              )}

              {activeTab === "actions" && (
                <div className="space-y-3">
                  {actionItems.length > 0 ? (
                    actionItems.map((item) => (
                      <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded p-3 bg-white dark:bg-gray-700/50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-gray-900 dark:text-gray-100">{item.description}</p>
                            {item.owner && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Owner: {item.owner}</p>}
                            {item.dueDate && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Due: {new Date(item.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => updateActionItem(item.id, { status: item.status === "open" ? "done" : "open" })}
                            className={`ml-4 px-3 py-1 rounded text-sm ${
                              item.status === "done"
                                ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                                : "bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500"
                            }`}
                          >
                            {item.status === "done" ? "Done" : "Open"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No action items yet. Generate them to get started.</p>
                  )}
                </div>
              )}

              {!outputs[activeTab] && !loadingStates[activeTab] && (
                <p className="text-gray-500 dark:text-gray-400">Click Generate to create AI-powered {activeTab}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
