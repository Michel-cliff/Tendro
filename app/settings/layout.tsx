import { Sidebar } from "@/components/layout/Sidebar";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto md:pl-60">{children}</main>
    </div>
  );
}
