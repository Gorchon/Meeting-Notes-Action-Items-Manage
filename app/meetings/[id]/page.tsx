"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

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

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "decisions" | "actions">("summary");
  const [outputs, setOutputs] = useState<Record<string, AIOutput>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);

  useEffect(() => {
    fetchMeeting();
  }, [id]);

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
    try {
      await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawNotes: notes }),
      });
    } catch (error) {
      console.error("Error saving notes:", error);
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

      // Refresh action items if we generated actions
      if (type === "actions") {
        fetchMeeting();
      }
    } catch (error) {
      setErrors({ ...errors, [type]: error instanceof Error ? error.message : "Failed to generate" });
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
    } catch (error) {
      console.error("Error updating action item:", error);
    }
  };

  if (!meeting) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{meeting.title}</h1>
        <div className="mt-2 text-sm text-gray-500">
          {new Date(meeting.date).toLocaleDateString()} • {meeting.participants}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Notes Editor */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Meeting Notes</h2>
            <button
              onClick={saveNotes}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-96 p-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none text-gray-900 font-mono text-sm"
            placeholder="Enter your meeting notes here..."
          />
        </div>

        {/* Right Panel: AI Outputs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {(["summary", "decisions", "actions"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loadingStates[activeTab] ? "Generating..." : `Generate ${activeTab}`}
              </button>
              {outputs[activeTab] && (
                <div className="text-xs text-gray-500">
                  {outputs[activeTab].cached && <span className="text-green-600 mr-2">Cached</span>}
                  Tokens: {outputs[activeTab].promptTokens} in / {outputs[activeTab].completionTokens} out
                </div>
              )}
            </div>

            {errors[activeTab] && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {errors[activeTab]}
              </div>
            )}

            {/* Content Display */}
            <div className="prose max-w-none">
              {activeTab === "summary" && outputs.summary && (
                <div className="text-gray-900 whitespace-pre-wrap">{outputs.summary.content}</div>
              )}

              {activeTab === "decisions" && outputs.decisions && (
                <div className="space-y-2">
                  {(() => {
                    try {
                      const decisions = JSON.parse(outputs.decisions.content);
                      return decisions.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-gray-900">
                          {decisions.map((decision: string, i: number) => (
                            <li key={i}>{decision}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No decisions found</p>
                      );
                    } catch {
                      return <div className="text-gray-900 whitespace-pre-wrap">{outputs.decisions.content}</div>;
                    }
                  })()}
                </div>
              )}

              {activeTab === "actions" && (
                <div className="space-y-3">
                  {actionItems.length > 0 ? (
                    actionItems.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-gray-900">{item.description}</p>
                            {item.owner && <p className="text-sm text-gray-600 mt-1">Owner: {item.owner}</p>}
                            {item.dueDate && (
                              <p className="text-sm text-gray-600 mt-1">
                                Due: {new Date(item.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => updateActionItem(item.id, { status: item.status === "open" ? "done" : "open" })}
                            className={`ml-4 px-3 py-1 rounded text-sm ${
                              item.status === "done"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            {item.status === "done" ? "Done" : "Open"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No action items yet. Generate them to get started.</p>
                  )}
                </div>
              )}

              {!outputs[activeTab] && !loadingStates[activeTab] && (
                <p className="text-gray-500">Click Generate to create AI-powered {activeTab}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
