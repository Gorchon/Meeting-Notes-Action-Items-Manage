"use client";

import { DarkModeToggle } from "./DarkModeToggle";

export function Navigation() {
  return (
    <nav className="border-b bg-white dark:bg-gray-900 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <a
              href="/meetings"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
            >
              Meetings
            </a>
            <a
              href="/action-items"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
            >
              Action Items
            </a>
          </div>
          <div className="flex items-center">
            <DarkModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
