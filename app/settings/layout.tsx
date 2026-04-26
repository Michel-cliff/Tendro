"use client";
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState("");
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-60">
        <TopBar search={search} onSearchChange={setSearch} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
