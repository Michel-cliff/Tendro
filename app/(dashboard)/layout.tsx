// This route group layout is kept for backwards compatibility.
// The actual layouts are in app/dashboard/layout.tsx and app/settings/layout.tsx
export default function GroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
