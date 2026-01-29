"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ActionItem {
  id: string;
  description: string;
  owner: string | null;
  dueDate: string | null;
  status: string;
  meeting: {
    id: string;
    title: string;
    date: string;
  };
}

export default function ActionItemsPage() {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");

  useEffect(() => {
    fetchActionItems();
  }, []);

  const fetchActionItems = async () => {
    try {
      const response = await fetch("/api/action-items");
      const data = await response.json();
      setActionItems(data);
    } catch (error) {
      console.error("Error fetching action items:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateActionItem = async (id: string, updates: Partial<ActionItem>) => {
    try {
      await fetch(`/api/action-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      fetchActionItems();
    } catch (error) {
      console.error("Error updating action item:", error);
    }
  };

  const filteredItems = actionItems.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const openCount = actionItems.filter((item) => item.status === "open").length;
  const doneCount = actionItems.filter((item) => item.status === "done").length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Action Items</h1>
        <div className="mt-2 flex space-x-4 text-sm text-gray-600">
          <span>{openCount} open</span>
          <span>{doneCount} done</span>
          <span>{actionItems.length} total</span>
        </div>
      </div>

      <div className="mb-6 flex space-x-2">
        {(["all", "open", "done"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-md ${
              filter === status
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No action items found. Create meetings and generate action items to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-lg text-gray-900">{item.description}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                    {item.owner && (
                      <span>
                        <span className="font-medium">Owner:</span> {item.owner}
                      </span>
                    )}
                    {item.dueDate && (
                      <span>
                        <span className="font-medium">Due:</span>{" "}
                        {new Date(item.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    <Link
                      href={`/meetings/${item.meeting.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {item.meeting.title}
                    </Link>
                  </div>
                </div>
                <button
                  onClick={() => updateActionItem(item.id, { status: item.status === "open" ? "done" : "open" })}
                  className={`ml-4 px-4 py-2 rounded-md ${
                    item.status === "done"
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {item.status === "done" ? "Done" : "Mark Done"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
