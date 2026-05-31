import { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { Chatbot } from "./Chatbot";
import { DataProvider } from "../context/DataContext";

export function Layout() {
  // Collapse sidebar by default on small screens
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );

  return (
    <DataProvider>
      <div className="relative flex h-screen overflow-hidden bg-gray-50 transition-colors dark:bg-slate-950">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Outlet />
        </div>
        <Chatbot />
      </div>
    </DataProvider>
  );
}
