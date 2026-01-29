"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MeetingListSkeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/ToastProvider";

interface Meeting {
  id: string;
  title: string;
  date: string;
  participants: string;
  _count: {
    actionItems: number;
  };
}

export default function MeetingsPage() {
  const { showToast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    participants: "",
  });

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await fetch("/api/meetings");
      const data = await response.json();
      setMeetings(data);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({ title: "", date: new Date().toISOString().split("T")[0], participants: "" });
        fetchMeetings();
        showToast("Meeting created successfully", "success");
      } else {
        showToast("Failed to create meeting", "error");
      }
    } catch (error) {
      console.error("Error creating meeting:", error);
      showToast("Failed to create meeting", "error");
    }
  };

  const filteredMeetings = meetings.filter((meeting) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      meeting.title.toLowerCase().includes(query) ||
      meeting.participants.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Meetings</h1>
        </div>
        <MeetingListSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Meetings</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          {showForm ? "Cancel" : "New Meeting"}
        </button>
      </div>

      {!showForm && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search meetings by title or participant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Create New Meeting</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Title
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date
              </label>
              <input
                type="date"
                id="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="participants" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Participants
              </label>
              <input
                type="text"
                id="participants"
                value={formData.participants}
                onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                placeholder="John, Jane, etc."
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              Create Meeting
            </button>
          </form>
        </div>
      )}

      {filteredMeetings.length === 0 ? (
        meetings.length === 0 ? (
          <EmptyState
            icon="meetings"
            title="No meetings yet"
            description="Create your first meeting to start tracking notes and generating AI-powered insights."
            action={{
              label: "Create Meeting",
              onClick: () => setShowForm(true),
            }}
          />
        ) : (
          <EmptyState
            icon="search"
            title="No meetings found"
            description="Try adjusting your search query to find what you're looking for."
          />
        )
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredMeetings.map((meeting) => (
              <li key={meeting.id}>
                <Link
                  href={`/meetings/${meeting.id}`}
                  className="block hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-4 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{meeting.title}</h3>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{new Date(meeting.date).toLocaleDateString()}</span>
                        {meeting.participants && <span>{meeting.participants}</span>}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {meeting._count.actionItems} action item{meeting._count.actionItems !== 1 ? "s" : ""}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
