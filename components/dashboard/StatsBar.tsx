interface StatsBarProps {
  stats: {
    total: number;
    newToday: number;
    submitted: number;
    won: number;
  };
}

export function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { label: "Total appels d'offres", value: stats.total, color: "text-gray-900" },
    { label: "Nouveaux aujourd'hui", value: stats.newToday, color: "text-blue-600" },
    { label: "Candidatures soumises", value: stats.submitted, color: "text-purple-600" },
    { label: "Marchés gagnés", value: stats.won, color: "text-green-600" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {items.map((item) => (
        <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-500">{item.label}</p>
          <p className={`text-3xl font-bold mt-1 ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
