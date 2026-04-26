export const dynamic = "force-dynamic";
import { Sidebar } from "@/components/layout/Sidebar";
import { LanguageProvider } from "@/components/layout/LanguageProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden md:pl-60">
          {children}
        </div>
      </div>
    </LanguageProvider>
  );
}
